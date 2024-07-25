import { Router, Request, Response } from 'express';
import activityService from '../service/activity.service';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const data = await activityService.getActivities();
  res.json(data);
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const data = await activityService.createActivity(req.body);
    res.status(200).json(data);
  } catch (e) {
    console.log(e);
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const data = await activityService.updateActivity(req.params.id, req.body);
    res.status(200).json(data);
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === 'Activity Not Found') {
        res.status(404).send(e.message);
      }
    }
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const data = await activityService.deleteActivity(req.params.id);
    res.status(200).json(data);
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === 'Activity Not Found') {
        res.status(404).send(e.message);
      }
    }
  }
});

export default router;
