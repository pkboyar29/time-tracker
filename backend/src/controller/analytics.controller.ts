import { Router, Request, Response } from 'express';
import { getYear } from 'date-fns';
import analyticsService from '../service/analytics.service';

const router = Router();

router.get('/days/:date', async (req: Request, res: Response) => {
  try {
    const date: Date = new Date(req.params.date);
    if (date.toDateString() === 'Invalid Date') {
      res.status(500).send('Invalid Date');
    } else {
      const data = await analyticsService.getAnalyticsForDay(
        date,
        res.locals.userId
      );
      res.status(200).send(data);
    }
  } catch (e) {
    if (e instanceof Error) {
      res.status(500).send(e.message);
    }
  }
});

router.get('/months/:date', async (req: Request, res: Response) => {
  try {
    const date: Date = new Date(req.params.date);
    if (date.toDateString() === 'Invalid Date') {
      res.status(500).send('Invalid Date');
    } else {
      const data = await analyticsService.getAnalyticsForMonth(
        date,
        res.locals.userId
      );
      res.status(200).send(data);
    }
  } catch (e) {
    if (e instanceof Error) {
      res.status(500).send(e.message);
    }
  }
});

router.get('/years/:date', async (req: Request, res: Response) => {
  try {
    const date: Date = new Date(req.params.date);
    if (date.toDateString() === 'Invalid Date') {
      res.status(500).send('Invalid Date');
    } else {
      const data = await analyticsService.getAnalyticsForYear(
        getYear(date),
        res.locals.userId
      );
      res.status(200).send(data);
    }
  } catch (e) {
    if (e instanceof Error) {
      res.status(500).send(e.message);
    }
  }
});

router.get('/overall', async (req: Request, res: Response) => {
  try {
    const data = await analyticsService.getOverallAnalytics(res.locals.userId);
    res.status(200).send(data);
  } catch (e) {
    if (e instanceof Error) {
      res.status(500).send(e.message);
    }
  }
});

export default router;
