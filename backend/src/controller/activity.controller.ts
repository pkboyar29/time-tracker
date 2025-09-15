import { Router, Request, Response } from 'express';
import activityService from '../service/activity.service';
import { sendErrorResponse } from '../helpers/sendErrorResponse';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    let data;
    const detailedParam = req.query.detailed === 'true';

    const activityGroupIdParam = req.query.activityGroupId;
    if (activityGroupIdParam) {
      data = await activityService.getActivitiesForActivityGroup({
        activityGroupId: activityGroupIdParam.toString(),
        userId: res.locals.userId,
        detailed: detailedParam,
        onlyCompleted: false,
      });
    } else {
      data = detailedParam
        ? await activityService.getSplitActivities({
            userId: res.locals.userId,
            detailed: true,
          })
        : await activityService.getSplitActivities({
            userId: res.locals.userId,
            detailed: false,
          });
    }

    res.status(200).json(data);
  } catch (e) {
    sendErrorResponse(e, res);
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const data = await activityService.getDetailedActivity({
      activityId: req.params.id,
      userId: res.locals.userId,
      onlyCompleted: false,
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
      res.locals.userId
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
      res.locals.userId
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
      res.locals.userId
    );
    res.status(200).json(data);
  } catch (e) {
    sendErrorResponse(e, res);
  }
});

export default router;
