import { documentRepo } from '../repositories/document.repo';
import { db } from '../db';
import { AppError } from '../middleware/errors';

function toDocResponse(row: { id: string; title: string; owner_id: string; created_at: Date; updated_at: Date }) {
  return {
    id: row.id,
    title: row.title,
    ownerId: row.owner_id,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export const documentService = {
  async listForUser(userId: string) {
    const docs = await documentRepo.listForUser(userId);
    return { documents: docs.map(toDocResponse) };
  },

  async getById(id: string, userId: string) {
    const hasAccess = await documentRepo.hasAccess(id, userId);
    if (!hasAccess) {
      throw new AppError(403, 'Access denied');
    }
    const doc = await documentRepo.findById(id);
    if (!doc) throw new AppError(404, 'Document not found');
    return toDocResponse(doc);
  },

  async create(title: string, ownerId: string) {
    const doc = await documentRepo.create({ title, ownerId });
    return toDocResponse(doc);
  },

  async update(id: string, userId: string, data: { title?: string }) {
    const hasAccess = await documentRepo.hasAccess(id, userId);
    if (!hasAccess) throw new AppError(403, 'Access denied');
    const doc = await documentRepo.update(id, data);
    return toDocResponse(doc);
  },

  async delete(id: string, userId: string) {
    const isOwner = await documentRepo.isOwner(id, userId);
    if (!isOwner) throw new AppError(403, 'Only the owner can delete this document');
    await documentRepo.delete(id);
  },

  async share(documentId: string, userId: string, targetEmail: string, permission: string) {
    const isOwner = await documentRepo.isOwner(documentId, userId);
    if (!isOwner) throw new AppError(403, 'Only the owner can share this document');

    const targetUser = await db('users').where({ email: targetEmail }).first();
    if (!targetUser) throw new AppError(404, 'User not found');
    if (targetUser.id === userId) throw new AppError(400, 'Cannot share with yourself');

    await db('collaborators')
      .insert({
        document_id: documentId,
        user_id: targetUser.id,
        permission,
      })
      .onConflict(['document_id', 'user_id'])
      .merge({ permission });
  },

  async getCollaborators(documentId: string, userId: string) {
    const hasAccess = await documentRepo.hasAccess(documentId, userId);
    if (!hasAccess) throw new AppError(403, 'Access denied');

    const collaborators = await db('collaborators')
      .leftJoin('users', 'collaborators.user_id', 'users.id')
      .where('collaborators.document_id', documentId)
      .select(
        'collaborators.*',
        'users.display_name',
        'users.email',
        'users.avatar_url'
      );

    return {
      collaborators: collaborators.map((c) => ({
        id: c.id,
        documentId: c.document_id,
        userId: c.user_id,
        permission: c.permission,
        createdAt: c.created_at.toISOString(),
        user: {
          displayName: c.display_name,
          email: c.email,
          avatarUrl: c.avatar_url,
        },
      })),
    };
  },
};
