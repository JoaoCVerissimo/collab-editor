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

function getYDoc(docName: string, persistence?: Persistence): WSSharedDoc {
  const existing = docs.get(docName);
  if (existing) return existing;

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

  if (persistence) {
    persistence.bindState(docName, doc).catch((err) => {
      console.error(`Failed to bind state for ${docName}:`, err);
    });
  }

  docs.set(docName, doc);
  return doc;
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

export function setupWSConnection(conn: WebSocket, _req: IncomingMessage, opts: SetupOptions): void {
  const { docName, persistence } = opts;
  const doc = getYDoc(docName, persistence);

  conn.binaryType = 'arraybuffer';
  doc.conns.set(conn, new Set());

  conn.on('message', (rawMessage: ArrayBuffer | Buffer) => {
    const message = new Uint8Array(rawMessage instanceof ArrayBuffer ? rawMessage : rawMessage.buffer);
    messageListener(conn, doc, message);
  });

  conn.on('close', () => {
    closeConn(doc, conn);
    if (persistence && doc.conns.size === 0) {
      persistence.writeState(docName, doc).catch((err) => {
        console.error(`Failed to write state for ${docName}:`, err);
      });
    }
  });

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
}
