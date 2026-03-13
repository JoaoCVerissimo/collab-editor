import { db } from '../db';

export interface DocumentRow {
  id: string;
  title: string;
  owner_id: string;
  yjs_state: Buffer | null;
  created_at: Date;
  updated_at: Date;
}

export const documentRepo = {
  async listForUser(userId: string): Promise<DocumentRow[]> {
    return db('documents')
      .leftJoin('collaborators', 'documents.id', 'collaborators.document_id')
      .where('documents.owner_id', userId)
      .orWhere('collaborators.user_id', userId)
      .select('documents.*')
      .groupBy('documents.id')
      .orderBy('documents.updated_at', 'desc');
  },

  async findById(id: string): Promise<DocumentRow | undefined> {
    return db('documents').where({ id }).first();
  },

  async create(data: { title: string; ownerId: string }): Promise<DocumentRow> {
    const [row] = await db('documents')
      .insert({ title: data.title, owner_id: data.ownerId })
      .returning('*');
    return row;
  },

  async update(id: string, data: { title?: string; yjs_state?: Buffer }): Promise<DocumentRow> {
    const [row] = await db('documents')
      .where({ id })
      .update({ ...data, updated_at: db.fn.now() })
      .returning('*');
    return row;
  },

  async delete(id: string): Promise<void> {
    await db('documents').where({ id }).delete();
  },

  async isOwner(documentId: string, userId: string): Promise<boolean> {
    const doc = await db('documents').where({ id: documentId, owner_id: userId }).first();
    return !!doc;
  },

  async hasAccess(documentId: string, userId: string): Promise<boolean> {
    const doc = await db('documents').where({ id: documentId, owner_id: userId }).first();
    if (doc) return true;
    const collab = await db('collaborators').where({ document_id: documentId, user_id: userId }).first();
    return !!collab;
  },
};
