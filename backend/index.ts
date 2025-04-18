import express, { Express, NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import cors from 'cors';
import * as sessionRouter from './src/controller/session.controller';
import * as activityRouter from './src/controller/activity.controller';
import * as activityGroupRouter from './src/controller/activityGroup.controller';
import * as analyticsRouter from './src/controller/analytics.controller';
import * as userRouter from './src/controller/user.controller';
import userService from './src/service/user.service';

const app: Express = express();
dotenv.config();

const MONGO_URL = process.env.MONGO_URL || '';
const PORT = process.env.PORT || 7000;

mongoose.connect(MONGO_URL).then(() => {
  console.log('connection with database is successful');
});

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

app.use('/sessions', sessionRouter.default);
app.use('/activities', activityRouter.default);
app.use('/activity-groups/', activityGroupRouter.default);
app.use('/analytics/', analyticsRouter.default);
app.use('/users/', userRouter.default);

function startServer() {
  app.listen(PORT, () => {
    console.log(`[server]: Server is running at http://localhost:${PORT}`);
  });
}

startServer();
