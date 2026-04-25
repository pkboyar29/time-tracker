import { Router, Request, Response } from 'express';
import sessionService from '../service/session.service';
import { sendErrorResponse } from '../helpers/sendErrorResponse';
import { convertParamToBoolean } from '../helpers/convertParamToBoolean';
import User from '../model/user.model';

const router = Router();

// TODO: в эндпоинте можно разом получить все completed sessions (если передать completed = true), либо можем вообще не указывать completed (чтобы он был undefined).
// Из-за чего мы получим долгий запрос
router.get('/', async (req: Request, res: Response) => {
  try {
    let data;

    const completedParam = req.query.completed;
    let completed: boolean | undefined;
    if (typeof completedParam === 'string') {
      completed = convertParamToBoolean(completedParam as string);
    } else {
      completed = undefined;
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
      res.locals.userId,
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
      res.locals.userId,
    );
    res.status(200).json(data);
  } catch (e) {
    sendErrorResponse(e, res);
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    if (req.body.spentTimeSeconds && isNaN(Number(req.body.spentTimeSeconds))) {
      res.status(400).send('spentTimeSeconds - should be number');
      return;
    }
    if (req.body.totalTimeSeconds && isNaN(Number(req.body.totalTimeSeconds))) {
      res.status(400).send('totalTimeSeconds - should be number');
      return;
    }

    const tzInfo = await User.findById(res.locals.userId).select('timezone');

    const data = await sessionService.updateSession(
      req.params.id,
      { ...req.body, isPaused: convertParamToBoolean(req.body.isPaused) },
      res.locals.userId,
      tzInfo!.timezone,
    );
    res.status(200).json(data);
  } catch (e) {
    sendErrorResponse(e, res);
  }
});

router.patch('/:id/note', async (req: Request, res: Response) => {
  try {
    const data = await sessionService.updateSessionNote(
      req.params.id,
      req.body.note ?? '',
      res.locals.userId,
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
      res.locals.userId,
      true,
    );
    res.status(200).json(data);
  } catch (e) {
    sendErrorResponse(e, res);
  }
});

export default router;
