import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

export const config = {
  port: parseInt(process.env.API_PORT || '4000', 10),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://collab:collab_dev@localhost:5432/collab_editor',
  jwtSecret: process.env.JWT_SECRET || 'local-dev-secret-change-in-prod',
  jwtExpiresIn: '7d',
  collabServerUrl: process.env.COLLAB_SERVER_URL || 'http://localhost:1234',
};
