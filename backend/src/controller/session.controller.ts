import { Router, Request, Response } from 'express';
import sessionService from '../service/session.service';
import { sendErrorResponse } from '../helpers/sendErrorResponse';

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
      data = await sessionService.getSessionsForActivity({
        activityId: req.query.activityId.toString(),
        userId: res.locals.userId,
        completed: completed,
      });
    } else {
      data = await sessionService.getSessions({
        filter: completed !== undefined ? { completed: completed } : {},
        userId: res.locals.userId,
      });
    }

    res.json(data);
  } catch (e) {
    sendErrorResponse(e, res);
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
    sendErrorResponse(e, res);
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
    sendErrorResponse(e, res);
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
    sendErrorResponse(e, res);
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
    sendErrorResponse(e, res);
  }
});

export default router;
