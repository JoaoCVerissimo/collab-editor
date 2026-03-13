import { db } from '../db';

export interface VersionRow {
  id: string;
  document_id: string;
  yjs_snapshot: Buffer;
  content_text: string | null;
  version_num: number;
  created_by: string;
  label: string | null;
  created_at: Date;
}

export const versionRepo = {
  async listByDocument(documentId: string): Promise<VersionRow[]> {
    return db('document_versions')
      .where({ document_id: documentId })
      .orderBy('version_num', 'desc');
  },

  async findById(id: string): Promise<VersionRow | undefined> {
    return db('document_versions').where({ id }).first();
  },

  async getNextVersionNum(documentId: string): Promise<number> {
    const result = await db('document_versions')
      .where({ document_id: documentId })
      .max('version_num as max');
    return (result[0]?.max || 0) + 1;
  },

  async create(data: {
    documentId: string;
    yjsSnapshot: Buffer;
    contentText: string | null;
    createdBy: string;
    label?: string;
  }): Promise<VersionRow> {
    const versionNum = await this.getNextVersionNum(data.documentId);
    const [row] = await db('document_versions')
      .insert({
        document_id: data.documentId,
        yjs_snapshot: data.yjsSnapshot,
        content_text: data.contentText,
        version_num: versionNum,
        created_by: data.createdBy,
        label: data.label || null,
      })
      .returning('*');
    return row;
  },
};
