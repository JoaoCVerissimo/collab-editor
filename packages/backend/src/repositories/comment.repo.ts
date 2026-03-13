import { db } from '../db';

export interface CommentRow {
  id: string;
  document_id: string;
  author_id: string;
  anchor: Record<string, unknown> | null;
  content: string;
  parent_id: string | null;
  resolved: boolean;
  created_at: Date;
  updated_at: Date;
}

export const commentRepo = {
  async listByDocument(documentId: string): Promise<(CommentRow & { display_name: string; avatar_url: string | null })[]> {
    return db('comments')
      .leftJoin('users', 'comments.author_id', 'users.id')
      .where('comments.document_id', documentId)
      .select('comments.*', 'users.display_name', 'users.avatar_url')
      .orderBy('comments.created_at', 'asc');
  },

  async findById(id: string): Promise<CommentRow | undefined> {
    return db('comments').where({ id }).first();
  },

  async create(data: {
    documentId: string;
    authorId: string;
    content: string;
    anchor?: Record<string, unknown>;
    parentId?: string;
  }): Promise<CommentRow> {
    const [row] = await db('comments')
      .insert({
        document_id: data.documentId,
        author_id: data.authorId,
        content: data.content,
        anchor: data.anchor ? JSON.stringify(data.anchor) : null,
        parent_id: data.parentId || null,
      })
      .returning('*');
    return row;
  },

  async update(id: string, data: { content?: string; resolved?: boolean }): Promise<CommentRow> {
    const [row] = await db('comments')
      .where({ id })
      .update({ ...data, updated_at: db.fn.now() })
      .returning('*');
    return row;
  },

  async delete(id: string): Promise<void> {
    await db('comments').where({ id }).delete();
  },
};
