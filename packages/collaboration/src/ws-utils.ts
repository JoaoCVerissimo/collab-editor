/**
 * Lightweight y-websocket server implementation.
 * Handles Yjs sync protocol and awareness for collaborative editing.
 */
import * as Y from 'yjs';
import { WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import * as syncProtocol from 'y-protocols/sync';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';

const MESSAGE_SYNC = 0;
const MESSAGE_AWARENESS = 1;

interface Persistence {
  bindState(docName: string, ydoc: Y.Doc): Promise<void>;
  writeState(docName: string, ydoc: Y.Doc): Promise<void>;
}

interface WSSharedDoc extends Y.Doc {
  name: string;
  conns: Map<WebSocket, Set<number>>;
  awareness: awarenessProtocol.Awareness;
}

const docs = new Map<string, WSSharedDoc>();
const pendingDocs = new Map<string, Promise<WSSharedDoc>>();

function getYDoc(docName: string, persistence?: Persistence): Promise<WSSharedDoc> {
  const existing = docs.get(docName);
  if (existing) return Promise.resolve(existing);

  // Deduplicate concurrent calls for the same doc
  const pending = pendingDocs.get(docName);
  if (pending) return pending;

  const promise = (async () => {
    const doc = new Y.Doc() as WSSharedDoc;
    doc.name = docName;
    doc.conns = new Map();
    doc.awareness = new awarenessProtocol.Awareness(doc);
    doc.awareness.setLocalState(null);

    doc.awareness.on('update', ({ added, updated, removed }: { added: number[]; updated: number[]; removed: number[] }) => {
      const changedClients = added.concat(updated, removed);
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MESSAGE_AWARENESS);
      encoding.writeVarUint8Array(encoder, awarenessProtocol.encodeAwarenessUpdate(doc.awareness, changedClients));
      const message = encoding.toUint8Array(encoder);
      doc.conns.forEach((_controlledIds, conn) => {
        if (conn.readyState === WebSocket.OPEN) {
          conn.send(message);
        }
      });
    });

    // Load persisted state BEFORE making the doc available
    if (persistence) {
      try {
        await persistence.bindState(docName, doc);
      } catch (err) {
        console.error(`Failed to bind state for ${docName}:`, err);
      }
    }

    docs.set(docName, doc);
    pendingDocs.delete(docName);
    return doc;
  })();

  pendingDocs.set(docName, promise);
  return promise;
}

function messageListener(conn: WebSocket, doc: WSSharedDoc, message: Uint8Array): void {
  const decoder = decoding.createDecoder(message);
  const messageType = decoding.readVarUint(decoder);

  switch (messageType) {
    case MESSAGE_SYNC: {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MESSAGE_SYNC);
      syncProtocol.readSyncMessage(decoder, encoder, doc, conn);
      if (encoding.length(encoder) > 1) {
        conn.send(encoding.toUint8Array(encoder));
      }
      break;
    }
    case MESSAGE_AWARENESS: {
      const update = decoding.readVarUint8Array(decoder);
      awarenessProtocol.applyAwarenessUpdate(doc.awareness, update, conn);
      break;
    }
  }
}

function closeConn(doc: WSSharedDoc, conn: WebSocket): void {
  const controlledIds = doc.conns.get(conn);
  if (controlledIds) {
    doc.conns.delete(conn);
    awarenessProtocol.removeAwarenessStates(doc.awareness, Array.from(controlledIds), null);

    if (doc.conns.size === 0) {
      docs.delete(doc.name);
      // Persist state when last client disconnects
      doc.destroy();
    }
  }
}

interface SetupOptions {
  docName: string;
  persistence?: Persistence;
}

export async function persistDoc(docName: string, persistence: Persistence): Promise<boolean> {
  const doc = docs.get(docName);
  if (!doc) return false;
  await persistence.writeState(docName, doc);
  return true;
}

export function evictDoc(docName: string): boolean {
  const doc = docs.get(docName);
  if (!doc) return false;
  docs.delete(docName);
  // Collect connections, then clear the map BEFORE closing.
  // This prevents the close handler from persisting stale state.
  const conns = Array.from(doc.conns.keys());
  doc.conns.clear();
  for (const conn of conns) {
    conn.close();
  }
  doc.destroy();
  return true;
}

export function setupWSConnection(conn: WebSocket, _req: IncomingMessage, opts: SetupOptions): void {
  const { docName, persistence } = opts;

  conn.binaryType = 'arraybuffer';

  // Buffer messages until doc is ready
  const pendingMessages: Uint8Array[] = [];
  let doc: WSSharedDoc | null = null;

  conn.on('message', (rawMessage: ArrayBuffer | Buffer) => {
    const message = new Uint8Array(rawMessage instanceof ArrayBuffer ? rawMessage : rawMessage.buffer);
    if (doc) {
      messageListener(conn, doc, message);
    } else {
      pendingMessages.push(message);
    }
  });

  conn.on('close', () => {
    if (doc) {
      closeConn(doc, conn);
      if (persistence && doc.conns.size === 0) {
        persistence.writeState(docName, doc).catch((err) => {
          console.error(`Failed to write state for ${docName}:`, err);
        });
      }
    }
  });

  // Load doc (with persistence) then initialize sync
  getYDoc(docName, persistence).then((resolvedDoc) => {
    doc = resolvedDoc;
    doc.conns.set(conn, new Set());

    // Process any messages received while loading
    for (const msg of pendingMessages) {
      messageListener(conn, doc, msg);
    }
    pendingMessages.length = 0;

    if (conn.readyState !== WebSocket.OPEN) return;

    // Send initial sync step 1
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_SYNC);
    syncProtocol.writeSyncStep1(encoder, doc);
    conn.send(encoding.toUint8Array(encoder));

    // Send awareness states
    const awarenessStates = doc.awareness.getStates();
    if (awarenessStates.size > 0) {
      const awarenessEncoder = encoding.createEncoder();
      encoding.writeVarUint(awarenessEncoder, MESSAGE_AWARENESS);
      encoding.writeVarUint8Array(
        awarenessEncoder,
        awarenessProtocol.encodeAwarenessUpdate(doc.awareness, Array.from(awarenessStates.keys()))
      );
      conn.send(encoding.toUint8Array(awarenessEncoder));
    }
  }).catch((err) => {
    console.error(`Failed to setup connection for ${docName}:`, err);
    conn.close();
  });
}
