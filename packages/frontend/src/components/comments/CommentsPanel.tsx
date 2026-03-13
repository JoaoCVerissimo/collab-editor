'use client';

import { useEffect, useState } from 'react';
import { comments as commentsApi } from '@/lib/api';
import type { Comment } from '@collab-editor/shared';

interface CommentsPanelProps {
  documentId: string;
}

export function CommentsPanel({ documentId }: CommentsPanelProps) {
  const [commentsList, setCommentsList] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComments();
  }, [documentId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadComments() {
    try {
      const data = await commentsApi.list(documentId);
      setCommentsList(data.comments);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoading(false);
    }
  }

  async function addComment() {
    if (!newComment.trim()) return;
    try {
      const comment = await commentsApi.create(documentId, { content: newComment.trim() });
      setCommentsList([...commentsList, comment]);
      setNewComment('');
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  }

  async function resolveComment(commentId: string) {
    try {
      await commentsApi.update(commentId, { resolved: true });
      setCommentsList(commentsList.map((c) =>
        c.id === commentId ? { ...c, resolved: true } : c
      ));
    } catch (err) {
      console.error('Failed to resolve comment:', err);
    }
  }

  async function deleteComment(commentId: string) {
    try {
      await commentsApi.delete(commentId);
      setCommentsList(commentsList.filter((c) => c.id !== commentId));
    } catch (err) {
      console.error('Failed to delete comment:', err);
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
        fontWeight: 600,
        fontSize: '14px',
      }}>
        Comments ({commentsList.filter(c => !c.resolved).length})
      </div>

      <div style={{ maxHeight: '500px', overflowY: 'auto', padding: '8px' }}>
        {loading ? (
          <p style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center' }}>
            Loading...
          </p>
        ) : commentsList.length === 0 ? (
          <p style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center' }}>
            No comments yet
          </p>
        ) : (
          commentsList.map((comment) => (
            <div
              key={comment.id}
              style={{
                padding: '10px 12px',
                margin: '4px 0',
                borderRadius: 'var(--radius-sm)',
                background: comment.resolved ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                opacity: comment.resolved ? 0.7 : 1,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600, fontSize: '13px' }}>
                  {comment.author?.displayName || 'Unknown'}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {new Date(comment.createdAt).toLocaleString()}
                </span>
              </div>
              <p style={{ fontSize: '13px', marginBottom: '6px' }}>{comment.content}</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                {!comment.resolved && (
                  <button
                    onClick={() => resolveComment(comment.id)}
                    style={{
                      fontSize: '11px',
                      color: 'var(--success-color)',
                      background: 'none',
                      border: 'none',
                      fontWeight: 600,
                    }}
                  >
                    Resolve
                  </button>
                )}
                <button
                  onClick={() => deleteComment(comment.id)}
                  style={{
                    fontSize: '11px',
                    color: 'var(--danger-color)',
                    background: 'none',
                    border: 'none',
                    fontWeight: 600,
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ padding: '12px', borderTop: '1px solid var(--border-color)' }}>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px',
            resize: 'vertical',
            minHeight: '60px',
            fontFamily: 'inherit',
          }}
        />
        <button
          onClick={addComment}
          disabled={!newComment.trim()}
          style={{
            marginTop: '8px',
            padding: '6px 16px',
            background: 'var(--accent-color)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px',
            fontWeight: 600,
            opacity: newComment.trim() ? 1 : 0.5,
          }}
        >
          Add Comment
        </button>
      </div>
    </div>
  );
}
