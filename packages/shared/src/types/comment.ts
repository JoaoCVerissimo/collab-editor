export interface Comment {
  id: string;
  documentId: string;
  authorId: string;
  anchor: CommentAnchor | null;
  content: string;
  parentId: string | null;
  resolved: boolean;
  createdAt: string;
  updatedAt: string;
  author?: {
    displayName: string;
    avatarUrl: string | null;
  };
  replies?: Comment[];
}

export interface CommentAnchor {
  from: string; // Base64-encoded Y.RelativePosition
  to: string;   // Base64-encoded Y.RelativePosition
}

export interface CreateCommentRequest {
  content: string;
  anchor?: CommentAnchor;
  parentId?: string;
}
