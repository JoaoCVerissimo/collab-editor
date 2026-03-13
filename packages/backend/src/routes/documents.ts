import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authMiddleware } from '../middleware/auth';
import { documentService } from '../services/document.service';

const router = Router();

const createSchema = z.object({
  title: z.string().min(1).max(500).default('Untitled Document'),
});

const updateSchema = z.object({
  title: z.string().min(1).max(500).optional(),
});

const shareSchema = z.object({
  email: z.string().email(),
  permission: z.enum(['view', 'comment', 'edit', 'admin']).default('edit'),
});

router.use(authMiddleware);

router.get('/', async (req, res, next) => {
  try {
    const result = await documentService.listForUser(req.userId!);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/', validate(createSchema), async (req, res, next) => {
  try {
    const doc = await documentService.create(req.body.title, req.userId!);
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const doc = await documentService.getById(req.params.id, req.userId!);
    res.json(doc);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', validate(updateSchema), async (req, res, next) => {
  try {
    const doc = await documentService.update(req.params.id, req.userId!, req.body);
    res.json(doc);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await documentService.delete(req.params.id, req.userId!);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

router.post('/:id/share', validate(shareSchema), async (req, res, next) => {
  try {
    await documentService.share(req.params.id, req.userId!, req.body.email, req.body.permission);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

router.get('/:id/collaborators', async (req, res, next) => {
  try {
    const result = await documentService.getCollaborators(req.params.id, req.userId!);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
