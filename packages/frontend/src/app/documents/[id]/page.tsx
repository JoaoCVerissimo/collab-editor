'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCollaboration } from '@/hooks/useCollaboration';
import { CollabEditor } from '@/components/editor/Editor';
import { CommentsPanel } from '@/components/comments/CommentsPanel';
import { VersionHistoryPanel } from '@/components/versions/VersionHistoryPanel';
import { Avatar } from '@/components/ui/Avatar';
import { documents as docsApi } from '@/lib/api';
import { getUser, isAuthenticated } from '@/lib/auth';
import { getRandomColor } from '@collab-editor/shared';
import type { Document } from '@collab-editor/shared';

export default function DocumentPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [, setDocument] = useState<Document | null>(null);
  const [title, setTitle] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [titleTimeout, setTitleTimeout] = useState<NodeJS.Timeout | null>(null);

  const user = getUser();
  const collabUser = {
    id: user?.id || 'anonymous',
    name: user?.displayName || 'Anonymous',
    color: getRandomColor(),
  };

  const { ydoc, provider, isSynced, isConnected, connectedUsers } = useCollaboration({
    documentId: params.id,
    user: collabUser,
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadDocument();
  }, [params.id]);  // eslint-disable-line react-hooks/exhaustive-deps

  async function loadDocument() {
    try {
      const doc = await docsApi.get(params.id);
      setDocument(doc);
      setTitle(doc.title);
    } catch (err) {
      console.error('Failed to load document:', err);
    }
  }

  function handleTitleChange(newTitle: string) {
    setTitle(newTitle);
    if (titleTimeout) clearTimeout(titleTimeout);
    const timeout = setTimeout(async () => {
      try {
        await docsApi.update(params.id, newTitle);
      } catch (err) {
        console.error('Failed to update title:', err);
      }
    }, 500);
    setTitleTimeout(timeout);
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <button
            onClick={() => router.push('/documents')}
            style={{
              padding: '6px 12px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
            }}
          >
            &larr; Back
          </button>
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            style={{
              fontSize: '20px',
              fontWeight: 600,
              border: 'none',
              background: 'transparent',
              outline: 'none',
              flex: 1,
              padding: '4px 0',
            }}
            placeholder="Untitled"
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Connection status */}
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            color: isConnected ? 'var(--success-color)' : 'var(--text-secondary)',
          }}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: isConnected ? 'var(--success-color)' : 'var(--border-color)',
            }} />
            {isConnected ? (isSynced ? 'Synced' : 'Syncing...') : 'Offline'}
          </span>

          {/* Connected users */}
          <div style={{ display: 'flex', marginLeft: '8px' }}>
            {connectedUsers.filter(u => u.id !== collabUser.id).map((u, i) => (
              <div key={u.id} style={{ marginLeft: i > 0 ? '-8px' : 0 }}>
                <Avatar name={u.name} color={u.color} size={28} />
              </div>
            ))}
          </div>

          {/* Panel toggles */}
          <button
            onClick={() => { setShowComments(!showComments); setShowVersions(false); }}
            style={{
              padding: '6px 12px',
              background: showComments ? 'var(--accent-color)' : 'var(--bg-primary)',
              color: showComments ? '#fff' : 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
            }}
          >
            Comments
          </button>
          <button
            onClick={() => { setShowVersions(!showVersions); setShowComments(false); }}
            style={{
              padding: '6px 12px',
              background: showVersions ? 'var(--accent-color)' : 'var(--bg-primary)',
              color: showVersions ? '#fff' : 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
            }}
          >
            History
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ display: 'flex', gap: '16px' }}>
        <div style={{ flex: 1 }}>
          {provider ? (
            <CollabEditor ydoc={ydoc} provider={provider} user={collabUser} />
          ) : (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              background: 'var(--bg-primary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
            }}>
              Connecting to collaboration server...
            </div>
          )}
        </div>

        {/* Side panels */}
        {showComments && (
          <div style={{ width: '320px', flexShrink: 0 }}>
            <CommentsPanel documentId={params.id} />
          </div>
        )}
        {showVersions && (
          <div style={{ width: '320px', flexShrink: 0 }}>
            <VersionHistoryPanel documentId={params.id} />
          </div>
        )}
      </div>
    </div>
  );
}
