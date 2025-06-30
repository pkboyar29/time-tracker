import { Router, Request, Response } from 'express';
import analyticsService from '../service/analytics.service';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { from, to } = req.query;
    if (!from) {
      res.status(400).send('from query param is required');
      return;
    }
    if (!to) {
      res.status(400).send('to query param is required');
      return;
    }

    const fromDate: Date = new Date(from.toString());
    const toDate: Date = new Date(to.toString());
    if (fromDate.toDateString() === 'Invalid Date') {
      res.status(400).send('from - invalid date');
      return;
    }
    if (toDate.toDateString() === 'Invalid Date') {
      res.status(400).send('to - invalid date');
      return;
    }

    const data = await analyticsService.getAnalyticsForRange(
      fromDate,
      toDate,
      res.locals.userId
    );
    res.status(200).send(data);
  } catch (e) {
    if (e instanceof Error) {
      res.status(500).send(e.message);
    }
  }
});

export default router;
