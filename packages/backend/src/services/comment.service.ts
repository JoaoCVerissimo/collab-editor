import { commentRepo } from '../repositories/comment.repo';
import { documentRepo } from '../repositories/document.repo';
import { AppError } from '../middleware/errors';

export const commentService = {
  async listByDocument(documentId: string, userId: string) {
    const hasAccess = await documentRepo.hasAccess(documentId, userId);
    if (!hasAccess) throw new AppError(403, 'Access denied');

    const rows = await commentRepo.listByDocument(documentId);
    return {
      comments: rows.map((r) => ({
        id: r.id,
        documentId: r.document_id,
        authorId: r.author_id,
        anchor: r.anchor,
        content: r.content,
        parentId: r.parent_id,
        resolved: r.resolved,
        createdAt: r.created_at.toISOString(),
        updatedAt: r.updated_at.toISOString(),
        author: {
          displayName: r.display_name,
          avatarUrl: r.avatar_url,
        },
      })),
    };
  },

  async create(documentId: string, userId: string, data: { content: string; anchor?: Record<string, unknown>; parentId?: string }) {
    const hasAccess = await documentRepo.hasAccess(documentId, userId);
    if (!hasAccess) throw new AppError(403, 'Access denied');

    const row = await commentRepo.create({
      documentId,
      authorId: userId,
      content: data.content,
      anchor: data.anchor,
      parentId: data.parentId,
    });

    return {
      id: row.id,
      documentId: row.document_id,
      authorId: row.author_id,
      anchor: row.anchor,
      content: row.content,
      parentId: row.parent_id,
      resolved: row.resolved,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  },

  async update(commentId: string, userId: string, data: { content?: string; resolved?: boolean }) {
    const comment = await commentRepo.findById(commentId);
    if (!comment) throw new AppError(404, 'Comment not found');
    if (comment.author_id !== userId) {
      const isOwner = await documentRepo.isOwner(comment.document_id, userId);
      if (!isOwner) throw new AppError(403, 'Access denied');
    }

    const row = await commentRepo.update(commentId, data);
    return {
      id: row.id,
      documentId: row.document_id,
      authorId: row.author_id,
      anchor: row.anchor,
      content: row.content,
      parentId: row.parent_id,
      resolved: row.resolved,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  },

  async delete(commentId: string, userId: string) {
    const comment = await commentRepo.findById(commentId);
    if (!comment) throw new AppError(404, 'Comment not found');
    if (comment.author_id !== userId) {
      const isOwner = await documentRepo.isOwner(comment.document_id, userId);
      if (!isOwner) throw new AppError(403, 'Access denied');
    }
    await commentRepo.delete(commentId);
  },
};
