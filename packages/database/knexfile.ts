import type { Knex } from 'knex';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

const config: Knex.Config = {
  client: 'pg',
  connection: process.env.DATABASE_URL || 'postgresql://collab:collab_dev@localhost:5432/collab_editor',
  migrations: {
    directory: './migrations',
    extension: 'ts',
  },
  pool: {
    min: 2,
    max: 10,
  },
};

export default config;
