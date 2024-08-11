import { Router, Request, Response } from 'express';
import analyticsService from '../service/analytics.service';

const router = Router();

router.get('/:date', async (req: Request, res: Response) => {
  try {
    let data;

    const date: Date = new Date(req.params.date);
    if (date.toDateString() === 'Invalid Date') {
      res.status(500).send('Invalid Date');
    } else {
      data = await analyticsService.getAnalyticsForDay(date);
      res.status(200).send(data);
    }
  } catch (e) {
    if (e instanceof Error) {
      console.log(`Error: ${e}`);
      res.status(500).send(e.message);
    }
  }
});

export default router;
