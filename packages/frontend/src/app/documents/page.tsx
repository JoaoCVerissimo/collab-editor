'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { documents as docsApi } from '@/lib/api';
import { getUser, logout, isAuthenticated } from '@/lib/auth';
import type { Document } from '@collab-editor/shared';

export default function DocumentsPage() {
  const router = useRouter();
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const user = getUser();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadDocuments();
  }, [router]);

  async function loadDocuments() {
    try {
      const data = await docsApi.list();
      setDocs(data.documents);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  }

  async function createDocument() {
    setCreating(true);
    try {
      const doc = await docsApi.create('Untitled Document');
      router.push(`/documents/${doc.id}`);
    } catch (err) {
      console.error('Failed to create document:', err);
      setCreating(false);
    }
  }

  async function deleteDocument(id: string, title: string) {
    if (!confirm(`Delete "${title}"?`)) return;
    try {
      await docsApi.delete(id);
      setDocs(docs.filter((d) => d.id !== id));
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>My Documents</h1>
          {user && <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{user.email}</p>}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={createDocument}
            disabled={creating}
            style={{
              padding: '8px 16px',
              background: 'var(--accent-color)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            {creating ? 'Creating...' : '+ New Document'}
          </button>
          <button
            onClick={logout}
            style={{
              padding: '8px 16px',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '14px',
            }}
          >
            Sign Out
          </button>
        </div>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }}>Loading...</p>
      ) : docs.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'var(--bg-primary)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
        }}>
          <p style={{ fontSize: '18px', marginBottom: '8px' }}>No documents yet</p>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>Create your first document to get started.</p>
          <button
            onClick={createDocument}
            disabled={creating}
            style={{
              padding: '10px 24px',
              background: 'var(--accent-color)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            + New Document
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {docs.map((doc) => (
            <div
              key={doc.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                background: 'var(--bg-primary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
                transition: 'box-shadow 0.15s',
              }}
              onClick={() => router.push(`/documents/${doc.id}`)}
            >
              <div>
                <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>{doc.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                  Last edited: {new Date(doc.updatedAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); deleteDocument(doc.id, doc.title); }}
                style={{
                  padding: '4px 12px',
                  background: 'none',
                  color: 'var(--danger-color)',
                  border: '1px solid var(--danger-color)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
