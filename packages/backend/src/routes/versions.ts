import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authMiddleware } from '../middleware/auth';
import { versionService } from '../services/version.service';

const router = Router();

const createSchema = z.object({
  label: z.string().max(255).optional(),
});

router.use(authMiddleware);

// List versions for a document
router.get('/documents/:documentId/versions', async (req, res, next) => {
  try {
    const result = await versionService.listByDocument(req.params.documentId, req.userId!);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Create a version snapshot
router.post('/documents/:documentId/versions', validate(createSchema), async (req, res, next) => {
  try {
    const version = await versionService.create(req.params.documentId, req.userId!, req.body.label);
    res.status(201).json(version);
  } catch (err) {
    next(err);
  }
});

// Restore a version
router.post('/documents/:documentId/versions/:versionId/restore', async (req, res, next) => {
  try {
    await versionService.restore(req.params.documentId, req.params.versionId, req.userId!);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
