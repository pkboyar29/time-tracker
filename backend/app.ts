import express, { Express, NextFunction, Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

import { loggerMiddleware } from './logger';
import * as sessionRouter from './src/controller/session.controller';
import * as activityRouter from './src/controller/activity.controller';
import * as activityGroupRouter from './src/controller/activityGroup.controller';
import * as analyticsRouter from './src/controller/analytics.controller';
import * as userRouter from './src/controller/user.controller';
import * as eventsRouter from './src/controller/events.controller';
import userService from './src/service/user.service';

const app: Express = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// authorization middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  if (
    req.path === '/users/sign-in' ||
    req.path === '/users/sign-up' ||
    req.path === '/users/refresh'
  ) {
    next();
  } else {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      res.status(401).send('jwt not provided');
    } else {
      try {
        const jwt = authHeader.substring(7);
        const accessPayload = userService.decodeAccessToken(jwt);
        if (accessPayload) {
          res.locals.userId = accessPayload.userId;
        }
        next();
      } catch (e) {
        if (e instanceof Error) {
          res.status(403).send(e.message);
        }
      }
    }
  }
});

// adding body for logs into response object
app.use((req, res, next) => {
  const oldSend = res.send;

  res.send = function (body) {
    if (res.statusCode >= 400) {
      (res as any)._bodyForLog = body;
    }
    return oldSend.call(this, body);
  };

  next();
});

// logging middleware
app.use(loggerMiddleware);

app.use('/sessions', sessionRouter.default);
app.use('/activities', activityRouter.default);
app.use('/activity-groups/', activityGroupRouter.default);
app.use('/analytics/', analyticsRouter.default);
app.use('/users/', userRouter.default);
app.use('/events/', eventsRouter.default);

export { app };
