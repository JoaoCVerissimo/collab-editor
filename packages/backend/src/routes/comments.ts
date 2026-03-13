import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authMiddleware } from '../middleware/auth';
import { commentService } from '../services/comment.service';

const router = Router();

const createSchema = z.object({
  content: z.string().min(1),
  anchor: z.object({
    from: z.string(),
    to: z.string(),
  }).optional(),
  parentId: z.string().uuid().optional(),
});

const updateSchema = z.object({
  content: z.string().min(1).optional(),
  resolved: z.boolean().optional(),
});

router.use(authMiddleware);

// List comments for a document
router.get('/documents/:documentId/comments', async (req, res, next) => {
  try {
    const result = await commentService.listByDocument(req.params.documentId, req.userId!);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Create comment on a document
router.post('/documents/:documentId/comments', validate(createSchema), async (req, res, next) => {
  try {
    const comment = await commentService.create(req.params.documentId, req.userId!, req.body);
    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
});

// Update a comment
router.patch('/comments/:commentId', validate(updateSchema), async (req, res, next) => {
  try {
    const comment = await commentService.update(req.params.commentId, req.userId!, req.body);
    res.json(comment);
  } catch (err) {
    next(err);
  }
});

// Delete a comment
router.delete('/comments/:commentId', async (req, res, next) => {
  try {
    await commentService.delete(req.params.commentId, req.userId!);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
