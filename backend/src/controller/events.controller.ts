import { Router, Request, Response } from 'express';
import { sendServerEvent } from '../helpers/sendServerEvent';
import { logger } from '../../logger';
import userService from '../service/user.service';
import User from '../model/user.model';

const router = Router();

export const sseConnections = new Map<string, Response[]>(); // userId -> [res1, res2, ...]

router.get('/', async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  res.flushHeaders(); // важно сразу отправить заголовки

  const userId = res.locals.userId;

  const userConnections = sseConnections.get(userId);
  if (userConnections) {
    userConnections.push(res);
  } else {
    sseConnections.set(userId, [res]);
  }

  // очистка при закрытии соединения
  req.on('close', () => {
    console.log('Client disconnected');

    const userConnections = sseConnections.get(userId);
    if (userConnections) {
      sseConnections.set(
        userId,
        userConnections.filter((r) => r !== res),
      );
    }
  });

  const timezoneInfo = await User.findById(userId).select('timezone');
  const isDailyGoalCompletedMarkedToday =
    await userService.isDailyGoalCompletedMarkedToday(
      userId,
      timezoneInfo!.timezone,
    );
  const isDailyGoalNotifiedMarkedToday =
    await userService.isDailyGoalNotifiedMarkedToday(
      userId,
      timezoneInfo!.timezone,
    );

  if (isDailyGoalCompletedMarkedToday && !isDailyGoalNotifiedMarkedToday) {
    logger.info('trying to send notification in events.controller.ts ...');
    sendServerEvent(res, 'daily_goal_completed', {});

    await userService.markDailyGoalNotified(userId);
  }
});

export default router;
