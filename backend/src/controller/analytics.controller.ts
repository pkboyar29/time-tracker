import { Router, Request, Response } from 'express';
import analyticsService from '../service/analytics.service';
import { isValidTimeZone } from '../helpers/isValidTimeZone';
import { sendErrorResponse } from '../helpers/sendErrorResponse';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { from, to, tz } = req.query;
    if (!from) {
      res.status(400).send('from query param is required');
      return;
    }
    if (!to) {
      res.status(400).send('to query param is required');
      return;
    }
    if (!tz) {
      res.status(400).send('tz query param is required');
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

    if (fromDate.getTime() > toDate.getTime()) {
      res.status(400).send('to date should be later than from date');
      return;
    }

    if (!isValidTimeZone(tz as string)) {
      res.status(400).send('timezone format is invalid');
      return;
    }

    const data = await analyticsService.getAnalyticsForRangeWithCache({
      startOfRange: fromDate,
      endOfRange: toDate,
      userId: res.locals.userId,
      timezone: tz as string,
    });
    // const data = await analyticsService.getAnalyticsForRange({
    //   startOfRange: fromDate,
    //   endOfRange: toDate,
    //   userId: res.locals.userId,
    //   timezone: tz as string,
    // });
    res.status(200).send(data);
  } catch (e) {
    sendErrorResponse(e, res);
  }
});

export default router;
