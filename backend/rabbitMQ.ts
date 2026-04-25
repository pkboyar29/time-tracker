import amqplib, { ChannelModel, Channel } from 'amqplib';
import { logger } from './logger';

let connection: ChannelModel | null = null;
let producerChannel: Channel | null = null;

export async function getRabbitConnection(): Promise<ChannelModel> {
  if (connection) {
    return connection;
  }

  while (!connection) {
    try {
      // TODO: добавить в .env (однако в docker-compose.yml также должно быть обращение к .env файлу)
      connection = await amqplib.connect(
        'amqp://admin123:admin123@rabbitmq:5672',
      );
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
