import { getToken } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: `Request failed: ${res.status}` }));
    throw new Error(err.message || `Request failed: ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// Documents
export const documents = {
  list: () => request<{ documents: import('@collab-editor/shared').Document[] }>('/api/documents'),
  get: (id: string) => request<import('@collab-editor/shared').Document>(`/api/documents/${id}`),
  create: (title: string) => request<import('@collab-editor/shared').Document>('/api/documents', {
    method: 'POST',
    body: JSON.stringify({ title }),
  }),
  update: (id: string, title: string) => request<import('@collab-editor/shared').Document>(`/api/documents/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ title }),
  }),
  delete: (id: string) => request<void>(`/api/documents/${id}`, { method: 'DELETE' }),
  share: (id: string, email: string, permission: string) =>
    request<void>(`/api/documents/${id}/share`, {
      method: 'POST',
      body: JSON.stringify({ email, permission }),
    }),
  collaborators: (id: string) =>
    request<{ collaborators: import('@collab-editor/shared').Collaborator[] }>(`/api/documents/${id}/collaborators`),
};

// Comments
export const comments = {
  list: (documentId: string) =>
    request<{ comments: import('@collab-editor/shared').Comment[] }>(`/api/documents/${documentId}/comments`),
  create: (documentId: string, data: import('@collab-editor/shared').CreateCommentRequest) =>
    request<import('@collab-editor/shared').Comment>(`/api/documents/${documentId}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (commentId: string, data: { content?: string; resolved?: boolean }) =>
    request<import('@collab-editor/shared').Comment>(`/api/comments/${commentId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: (commentId: string) => request<void>(`/api/comments/${commentId}`, { method: 'DELETE' }),
};

// Versions
export const versions = {
  list: (documentId: string) =>
    request<{ versions: import('@collab-editor/shared').DocumentVersion[] }>(`/api/documents/${documentId}/versions`),
  create: (documentId: string, label?: string) =>
    request<import('@collab-editor/shared').DocumentVersion>(`/api/documents/${documentId}/versions`, {
      method: 'POST',
      body: JSON.stringify({ label }),
    }),
  restore: (documentId: string, versionId: string) =>
    request<void>(`/api/documents/${documentId}/versions/${versionId}/restore`, { method: 'POST' }),
};
