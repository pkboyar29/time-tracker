import express, { Express } from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import cors from 'cors';
import * as sessionRouter from './controller/session.controller';
import * as activityRouter from './controller/activity.controller';
import * as activityGroupRouter from './controller/activityGroup.controller';
import * as analyticsRouter from './controller/analytics.controller';

const app: Express = express();
dotenv.config();

const MONGO_URL = process.env.MONGO_URL || '';
const PORT = process.env.PORT || 7000;

mongoose.connect(MONGO_URL).then(() => {
  console.log('connection is successful');
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.use('/sessions', sessionRouter.default);
app.use('/activities', activityRouter.default);
app.use('/activity-groups/', activityGroupRouter.default);
app.use('/analytics/', analyticsRouter.default);

function startServer() {
  app.listen(PORT, () => {
    console.log(`[server]: Server is running at http://localhost:${PORT}`);
  });
}

startServer();
