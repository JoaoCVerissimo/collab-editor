import * as Y from 'yjs';
import pg from 'pg';

const { Pool } = pg;

export class PostgresPersistence {
  private pool: pg.Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
  }

  async bindState(docName: string, ydoc: Y.Doc): Promise<void> {
    try {
      const result = await this.pool.query(
        'SELECT yjs_state FROM documents WHERE id = $1',
        [docName]
      );

      if (result.rows[0]?.yjs_state) {
        const state = result.rows[0].yjs_state;
        Y.applyUpdate(ydoc, new Uint8Array(state));
      }
    } catch (err) {
      // Document may not exist in DB yet (created via collab server only)
      console.warn(`Could not load state for ${docName}:`, err);
    }
  }

  async writeState(docName: string, ydoc: Y.Doc): Promise<void> {
    try {
      const state = Buffer.from(Y.encodeStateAsUpdate(ydoc));
      const result = await this.pool.query(
        'UPDATE documents SET yjs_state = $1, updated_at = NOW() WHERE id = $2',
        [state, docName]
      );

      if (result.rowCount === 0) {
        console.warn(`Document ${docName} not found in DB, skipping persistence`);
      }
    } catch (err) {
      console.error(`Failed to persist state for ${docName}:`, err);
    }
  }

  async destroy(): Promise<void> {
    await this.pool.end();
  }
}
