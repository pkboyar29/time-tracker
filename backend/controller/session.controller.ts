import { Router, Request, Response } from 'express';
import sessionService from '../service/session.service';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    let data;

    const completedParam = req.query.completed;
    let completed: boolean | undefined;
    if (typeof completedParam === 'string') {
      if (completedParam.toLowerCase() === 'true') {
        completed = true;
      } else if (completedParam.toLowerCase() === 'false') {
        completed = false;
      }
    }

    if (req.query.activityId) {
      data = await sessionService.getSessionsForActivity(
        req.query.activityId.toString(),
        res.locals.userId,
        completed
      );
    } else {
      data = await sessionService.getSessions(
        completed !== undefined ? { completed: completed } : {},
        res.locals.userId
      );
    }

    res.json(data);
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === 'Activity For Session Not Found') {
        res.status(404).send(e.message);
      } else {
        res.status(500).send(e.message);
      }
    }
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const data = await sessionService.getSession(
      req.params.id,
      res.locals.userId
    );
    res.status(200).json(data);
  } catch (e) {
    if (e instanceof Error) {
      if (
        e.message === 'Session Not Found' ||
        e.message === 'Activity For Session Not Found'
      ) {
        res.status(404).send(e.message);
      } else {
        res.status(500).send(e.message);
      }
    }
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const data = await sessionService.createSession(
      req.body,
      res.locals.userId
    );
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
    const data = await sessionService.updateSession(
      req.params.id,
      req.body,
      res.locals.userId
    );
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
    const data = await sessionService.deleteSession(
      req.params.id,
      res.locals.userId
    );
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
