import { Router, Request, Response } from 'express';
import activityGroupService from '../service/activityGroup.service';
import { sendErrorResponse } from '../helpers/sendErrorResponse';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const data = await activityGroupService.getActivityGroups({
      userId: res.locals.userId,
    });

    res.status(200).json(data);
  } catch (e) {
    sendErrorResponse(e, res);
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const data = await activityGroupService.getActivityGroup({
      activityGroupId: req.params.id,
      userId: res.locals.userId,
    });
    res.status(200).json(data);
  } catch (e) {
    sendErrorResponse(e, res);
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
    sendErrorResponse(e, res);
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
    sendErrorResponse(e, res);
  }
});

router.put('/:id/activities/archive', async (req: Request, res: Response) => {
  try {
    const data = await activityGroupService.archiveGroupActivities(
      req.params.id,
      res.locals.userId
    );
    res.status(200).json(data);
  } catch (e) {
    sendErrorResponse(e, res);
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
    sendErrorResponse(e, res);
  }
});

export default router;
