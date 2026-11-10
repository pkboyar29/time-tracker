import amqplib, { ChannelModel, Channel } from 'amqplib';
import { logger } from './logger';

let connection: ChannelModel | null = null;
let producerChannel: Channel | null = null;

export async function getRabbitConnection(): Promise<ChannelModel> {
  if (connection) {
    return connection;
  }

  const user = process.env.RABBITMQ_DEFAULT_USER;
  const password = process.env.RABBITMQ_DEFAULT_PASS;
  if (!user || !password) {
    throw new Error('RABBITMQ_DEFAULT_USER and RABBITMQ_DEFAULT_PASS must be set');
  }

  while (!connection) {
    try {
      const url = `amqp://${user}:${password}@rabbitmq:5672`;
      connection = await amqplib.connect(url);
      connection.on('close', () => {
        logger.error('RabbitMQ connection closed');
        connection = null;
      });

      logger.info('connection with rabbitmq is successful');
    } catch (e: any) {
      logger.error('RabbitMQ not ready, retrying...');
      await new Promise((res) => setTimeout(res, 2000));
    }
  }

  return connection;
}

export async function getProducerChannel(): Promise<Channel> {
  if (producerChannel) {
    return producerChannel;
  }

  const connection = await getRabbitConnection();
  producerChannel = await connection.createChannel();

  return producerChannel;
}
