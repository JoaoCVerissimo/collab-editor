import express from 'express';
import cors from 'cors';
import { config } from './config';
import { errorHandler } from './middleware/errors';
import usersRouter from './routes/users';
import documentsRouter from './routes/documents';
import commentsRouter from './routes/comments';
import versionsRouter from './routes/versions';

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'backend-api' });
});

// Routes
app.use('/api/auth', usersRouter);
app.use('/api/documents', documentsRouter);
app.use('/api', commentsRouter);
app.use('/api', versionsRouter);

// Error handler
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Backend API server listening on port ${config.port}`);
});

export default app;
