import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { getRabbitConnection } from './rabbitMQ';
import analyticsService from './src/service/analytics.service';

dotenv.config();
const MONGO_URL = process.env.MONGO_URL || '';
mongoose.connect(MONGO_URL).then(() => {
  console.log('connection with database is successful');
});

async function startWorker() {
  const conn = await getRabbitConnection();
  const channel = await conn.createChannel();

  const QUEUE = 'aggregates';
  await channel.assertQueue(QUEUE, {
    durable: true,
  });

  await channel.prefetch(1); // ограничиваем количество необработанных сообщений

  console.log('Worker started, waiting for messages');

  channel.consume(QUEUE, async (msg) => {
    if (!msg) {
      return;
    }

    try {
      const contentJSON = JSON.parse(msg.content.toString());

      if (contentJSON.type === 'activity.deleted') {
        await analyticsService.applyActivityDeleteToAggregates({
          userId: contentJSON.payload.userId,
          activityId: contentJSON.payload.activityId,
        });
      } else {
        throw new Error('Unknown message type');
      }

      channel.ack(msg);
    } catch (e) {
      console.error('Error processing message: ', e);
      channel.nack(msg, false, true);
    }
  });
}

startWorker();
