'use client';

import { useEffect, useState } from 'react';
import { versions as versionsApi } from '@/lib/api';
import type { WebsocketProvider } from 'y-websocket';
import type { DocumentVersion } from '@collab-editor/shared';

interface VersionHistoryPanelProps {
  documentId: string;
  provider?: WebsocketProvider | null;
}

export function VersionHistoryPanel({ documentId, provider }: VersionHistoryPanelProps) {
  const [versionsList, setVersionsList] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);

  useEffect(() => {
    loadVersions();
  }, [documentId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadVersions() {
    try {
      const data = await versionsApi.list(documentId);
      setVersionsList(data.versions);
    } catch (err) {
      console.error('Failed to load versions:', err);
    } finally {
      setLoading(false);
    }
  }

  async function saveVersion() {
    setSaving(true);
    try {
      const version = await versionsApi.create(documentId);
      setVersionsList([version, ...versionsList]);
    } catch (err) {
      console.error('Failed to save version:', err);
    } finally {
      setSaving(false);
    }
  }

  async function restoreVersion(versionId: string) {
    if (!confirm('Restore this version? Current content will be replaced.')) return;
    setRestoring(versionId);
    try {
      // Disconnect the WebSocket provider to stop syncing local changes
      if (provider) {
        provider.disconnect();
      }
      // Call restore (which flushes collab server, then updates DB)
      await versionsApi.restore(documentId, versionId);
      // Clear the local IndexedDB cache so the restored state loads cleanly
      try {
        await new Promise<void>((resolve, reject) => {
          const req = indexedDB.deleteDatabase(documentId);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });
      } catch {
        // IndexedDB may not exist yet
      }
      // Reload the page to get the restored content via Yjs sync
      window.location.reload();
    } catch (err) {
      console.error('Failed to restore version:', err);
      setRestoring(null);
    }
  }

  return (
    <div style={{
      background: 'var(--bg-primary)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border-color)',
      height: 'fit-content',
    }}>
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ fontWeight: 600, fontSize: '14px' }}>Version History</span>
        <button
          onClick={saveVersion}
          disabled={saving}
          style={{
            padding: '4px 12px',
            background: 'var(--accent-color)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          {saving ? 'Saving...' : 'Save Version'}
        </button>
      </div>

      <div style={{ maxHeight: '500px', overflowY: 'auto', padding: '8px' }}>
        {loading ? (
          <p style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center' }}>
            Loading...
          </p>
        ) : versionsList.length === 0 ? (
          <p style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center' }}>
            No versions saved yet
          </p>
        ) : (
          versionsList.map((version) => (
            <div
              key={version.id}
              style={{
                padding: '10px 12px',
                margin: '4px 0',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-secondary)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600, fontSize: '13px' }}>
                  Version {version.versionNum}
                  {version.label && ` — ${version.label}`}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                {new Date(version.createdAt).toLocaleString()}
              </p>
              {version.contentText && (
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  {version.contentText.slice(0, 100)}
                  {version.contentText.length > 100 ? '...' : ''}
                </p>
              )}
              <button
                onClick={() => restoreVersion(version.id)}
                disabled={restoring === version.id}
                style={{
                  fontSize: '11px',
                  color: 'var(--accent-color)',
                  background: 'none',
                  border: 'none',
                  fontWeight: 600,
                }}
              >
                {restoring === version.id ? 'Restoring...' : 'Restore'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
