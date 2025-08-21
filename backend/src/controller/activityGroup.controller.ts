import { Router, Request, Response } from 'express';
import activityGroupService from '../service/activityGroup.service';
import { HttpError } from '../helpers/HttpError';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const data = await activityGroupService.getActivityGroups(
      res.locals.userId
    );
    res.status(200).json(data);
  } catch (e) {
    if (e instanceof Error) {
      res.status(500).send(e.message);
    }
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const data = await activityGroupService.getActivityGroup(
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
    const data = await activityGroupService.createActivityGroup(
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
    const data = await activityGroupService.updateActivityGroup(
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
    const data = await activityGroupService.deleteActivityGroup(
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
