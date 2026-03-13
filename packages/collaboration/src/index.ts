import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import dotenv from 'dotenv';
import { setupWSConnection } from './ws-utils';
import { PostgresPersistence } from './persistence';
import { verifyToken } from './auth';

dotenv.config({ path: '../../.env' });

const PORT = parseInt(process.env.COLLAB_PORT || '1234', 10);
const DATABASE_URL = process.env.DATABASE_URL;

let persistence: PostgresPersistence | null = null;

if (DATABASE_URL) {
  persistence = new PostgresPersistence(DATABASE_URL);
  console.log('PostgreSQL persistence enabled');
}

const server = http.createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok', service: 'collaboration-server' }));
});

const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request: IncomingMessage, socket, head) => {
  // Extract token from query params for auth
  const url = new URL(request.url || '/', `http://${request.headers.host}`);
  const token = url.searchParams.get('token');

  // Auth is optional for local dev - if no JWT_SECRET, allow all connections
  if (process.env.JWT_SECRET && token) {
    const payload = verifyToken(token);
    if (!payload) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }
    (request as IncomingMessage & { userId?: string }).userId = payload.userId;
  }

  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
  // Extract document ID from URL path: /documentId?token=...
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  const docName = url.pathname.slice(1) || 'default';

  setupWSConnection(ws, req, {
    docName,
    persistence: persistence || undefined,
  });
});

server.listen(PORT, () => {
  console.log(`Collaboration server listening on port ${PORT}`);
});
