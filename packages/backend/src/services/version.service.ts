import * as Y from 'yjs';
import { versionRepo } from '../repositories/version.repo';
import { documentRepo } from '../repositories/document.repo';
import { AppError } from '../middleware/errors';

export const versionService = {
  async listByDocument(documentId: string, userId: string) {
    const hasAccess = await documentRepo.hasAccess(documentId, userId);
    if (!hasAccess) throw new AppError(403, 'Access denied');

    const rows = await versionRepo.listByDocument(documentId);
    return {
      versions: rows.map((r) => ({
        id: r.id,
        documentId: r.document_id,
        versionNum: r.version_num,
        contentText: r.content_text,
        createdBy: r.created_by,
        label: r.label,
        createdAt: r.created_at.toISOString(),
      })),
    };
  },

  async create(documentId: string, userId: string, label?: string) {
    const hasAccess = await documentRepo.hasAccess(documentId, userId);
    if (!hasAccess) throw new AppError(403, 'Access denied');

    const doc = await documentRepo.findById(documentId);
    if (!doc) throw new AppError(404, 'Document not found');

    // Extract current Y.Doc state and text content
    let yjsSnapshot: Buffer;
    let contentText: string | null = null;

    if (doc.yjs_state) {
      yjsSnapshot = Buffer.from(doc.yjs_state);
      // Extract plain text from Y.Doc for preview
      const ydoc = new Y.Doc();
      Y.applyUpdate(ydoc, new Uint8Array(doc.yjs_state));
      const xmlFragment = ydoc.getXmlFragment('default');
      contentText = xmlFragment.toJSON();
      ydoc.destroy();
    } else {
      // Empty document — create empty snapshot
      const ydoc = new Y.Doc();
      yjsSnapshot = Buffer.from(Y.encodeStateAsUpdate(ydoc));
      ydoc.destroy();
    }

    const row = await versionRepo.create({
      documentId,
      yjsSnapshot,
      contentText,
      createdBy: userId,
      label,
    });

    return {
      id: row.id,
      documentId: row.document_id,
      versionNum: row.version_num,
      contentText: row.content_text,
      createdBy: row.created_by,
      label: row.label,
      createdAt: row.created_at.toISOString(),
    };
  },

  async restore(documentId: string, versionId: string, userId: string) {
    const hasAccess = await documentRepo.hasAccess(documentId, userId);
    if (!hasAccess) throw new AppError(403, 'Access denied');

    const version = await versionRepo.findById(versionId);
    if (!version || version.document_id !== documentId) {
      throw new AppError(404, 'Version not found');
    }

    // Replace the document's Y.Doc state with the snapshot
    await documentRepo.update(documentId, {
      yjs_state: Buffer.from(version.yjs_snapshot),
    });
  },
};
