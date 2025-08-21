import { Router, Request, Response } from 'express';
import activityService from '../service/activity.service';
import { HttpError } from '../helpers/HttpError';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    let data;

    const activityGroupIdParam = req.query.activityGroupId;
    if (activityGroupIdParam) {
      data = await activityService.getActivitiesForActivityGroup(
        activityGroupIdParam.toString(),
        res.locals.userId
      );
    } else {
      data = await activityService.getSplitActivities(res.locals.userId);
    }
    res.status(200).json(data);
  } catch (e) {
    if (e instanceof HttpError) {
      res.status(e.status).send(e.message);
    } else if (e instanceof Error) {
      res.status(500).send(e.message);
    }
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const data = await activityService.getActivity(
      req.params.id,
      res.locals.userId
    );
    res.status(200).json(data);
  } catch (e) {
    if (e instanceof HttpError) {
      res.status(e.status).send(e.message);
    } else if (e instanceof Error) {
      res.status(500).send(e.message);
    }
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const data = await activityService.createActivity(
      req.body,
      res.locals.userId
    );
    res.status(200).json(data);
  } catch (e) {
    if (e instanceof HttpError) {
      res.status(e.status).send(e.message);
    } else if (e instanceof Error) {
      res.status(500).send(e.message);
    }
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const data = await activityService.updateActivity(
      req.params.id,
      req.body,
      res.locals.userId
    );
    res.status(200).json(data);
  } catch (e) {
    if (e instanceof HttpError) {
      res.status(e.status).send(e.message);
    } else if (e instanceof Error) {
      res.status(500).send(e.message);
    }
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const data = await activityService.deleteActivity(
      req.params.id,
      res.locals.userId
    );
    res.status(200).json(data);
  } catch (e) {
    if (e instanceof HttpError) {
      res.status(e.status).send(e.message);
    } else if (e instanceof Error) {
      res.status(500).send(e.message);
    }
  }
});

export default router;
