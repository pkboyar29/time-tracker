import { Router, Request, Response } from 'express';
import activityService from '../service/activity.service';
import { sendErrorResponse } from '../helpers/sendErrorResponse';
import { convertParamToBoolean } from '../helpers/convertParamToBoolean';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const activityGroupIdParam = req.query.activityGroupId;

    let data;
    if (activityGroupIdParam) {
      data = await activityService.getActivities({
        activityGroupId: activityGroupIdParam.toString(),
        userId: res.locals.userId,
      });
    } else {
      data = await activityService.getSplitActivities({
        userId: res.locals.userId,
      });
    }

    res.status(200).json(data);
  } catch (e) {
    sendErrorResponse(e, res);
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const data = await activityService.getActivity({
      activityId: req.params.id,
      userId: res.locals.userId,
    });
    res.status(200).json(data);
  } catch (e) {
    sendErrorResponse(e, res);
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const data = await activityService.createActivity(
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
    const data = await activityService.updateActivity(
      req.params.id,
      req.body,
      res.locals.userId,
    );
    res.status(200).json(data);
  } catch (e) {
    sendErrorResponse(e, res);
  }
});

router.patch('/:id/color', async (req: Request, res: Response) => {
  try {
    const data = await activityService.updateActivityColor(
      req.params.id,
      req.body.color ?? '',
      res.locals.userId,
    );
    res.status(200).json(data);
  } catch (e) {
    sendErrorResponse(e, res);
  }
});

router.patch('/:id/archive', async (req: Request, res: Response) => {
  try {
    const data = await activityService.archiveActivity(
      req.params.id,
      convertParamToBoolean(req.body.archived),
      res.locals.userId,
    );
    res.status(200).json(data);
  } catch (e) {
    sendErrorResponse(e, res);
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const data = await activityService.deleteActivity(
      req.params.id,
      res.locals.userId,
    );
    res.status(200).json(data);
  } catch (e) {
    sendErrorResponse(e, res);
  }
});

export default router;
