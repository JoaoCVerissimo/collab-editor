export interface Document {
  id: string;
  title: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  versionNum: number;
  contentText: string | null;
  createdBy: string;
  label: string | null;
  createdAt: string;
}

export interface Collaborator {
  id: string;
  documentId: string;
  userId: string;
  permission: 'view' | 'comment' | 'edit' | 'admin';
  createdAt: string;
  user?: {
    displayName: string;
    email: string;
    avatarUrl: string | null;
  };
}

export type Permission = 'view' | 'comment' | 'edit' | 'admin';
