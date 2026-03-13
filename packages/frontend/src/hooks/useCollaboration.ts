'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';
import { getToken } from '@/lib/auth';

const COLLAB_WS_URL = process.env.NEXT_PUBLIC_COLLAB_WS_URL || 'ws://localhost:1234';

interface AwarenessUser {
  id: string;
  name: string;
  color: string;
}

interface UseCollaborationOptions {
  documentId: string;
  user: AwarenessUser;
}

interface UseCollaborationReturn {
  ydoc: Y.Doc;
  provider: WebsocketProvider | null;
  isSynced: boolean;
  isConnected: boolean;
  connectedUsers: AwarenessUser[];
}

export function useCollaboration({ documentId, user }: UseCollaborationOptions): UseCollaborationReturn {
  const ydoc = useMemo(() => new Y.Doc(), [documentId]); // eslint-disable-line react-hooks/exhaustive-deps
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [isSynced, setIsSynced] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<AwarenessUser[]>([]);

  const updateUsers = useCallback((awareness: WebsocketProvider['awareness']) => {
    const users: AwarenessUser[] = [];
    awareness.getStates().forEach((state) => {
      if (state.user) {
        users.push(state.user as AwarenessUser);
      }
    });
    setConnectedUsers(users);
  }, []);

  useEffect(() => {
    // Offline persistence via IndexedDB
    const indexeddbProvider = new IndexeddbPersistence(documentId, ydoc);

    // Build WebSocket URL with auth token
    const token = getToken();
    const wsUrl = COLLAB_WS_URL;

    const wsProvider = new WebsocketProvider(wsUrl, documentId, ydoc, {
      params: token ? { token } : {},
    });

    // Set local awareness state
    wsProvider.awareness.setLocalStateField('user', {
      id: user.id,
      name: user.name,
      color: user.color,
    });

    wsProvider.on('sync', (synced: boolean) => {
      setIsSynced(synced);
    });

    wsProvider.on('status', ({ status }: { status: string }) => {
      setIsConnected(status === 'connected');
    });

    wsProvider.awareness.on('change', () => {
      updateUsers(wsProvider.awareness);
    });

    updateUsers(wsProvider.awareness);
    setProvider(wsProvider);

    return () => {
      wsProvider.destroy();
      indexeddbProvider.destroy();
      ydoc.destroy();
    };
  }, [documentId]); // eslint-disable-line react-hooks/exhaustive-deps

  return { ydoc, provider, isSynced, isConnected, connectedUsers };
}
