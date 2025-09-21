import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { logger } from './logger';
import { app } from './app';
import { redisClient } from './redisClient';

dotenv.config();

const MONGO_URL = process.env.MONGO_URL || '';
const PORT = process.env.PORT || 7000;

mongoose.connect(MONGO_URL).then(() => {
  logger.info('connection with database is successful');
});

redisClient.on('error', (err) => logger.error('Redis Client Error', err));
redisClient.connect().then(() => {
  logger.info('connection with redis is successful');
});

function startServer() {
  app.listen(PORT, () => {
    logger.info(`[server]: Server is running at http://localhost:${PORT}`);
  });
}

startServer();
