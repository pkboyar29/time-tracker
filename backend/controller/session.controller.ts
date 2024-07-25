import { Router, Request, Response } from 'express';
import sessionService from '../service/session.service';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const data = await sessionService.getSessions();
  res.json(data);
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const data = await sessionService.createSession(req.body);
    res.status(200).json(data);
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === 'Activity Not Found') {
        res.status(404).send(e.message);
      } else {
        res.status(500).send(e.message);
      }
    }
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const data = await sessionService.updateSession(req.params.id, req.body);
    res.status(200).json(data);
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === 'Session Not Found') {
        res.status(404).send(e.message);
      } else {
        res.status(500).send(e.message);
      }
    }
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const data = await sessionService.deleteSession(req.params.id);
    res.status(200).json(data);
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === 'Session Not Found') {
        res.status(404).send(e.message);
      } else {
        res.status(500).send(e.message);
      }
    }
  }
});

export default router;
