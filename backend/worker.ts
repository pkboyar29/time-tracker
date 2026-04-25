import { getRabbitConnection } from './rabbitMQ';

async function startWorker() {
  const conn = await getRabbitConnection();
  const channel = await conn.createChannel();

  const QUEUE = 'test_queue'; // TODO: другое название у очереди
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
      const content = msg.content.toString();
      console.log('Received: ', content);

      // TODO: метод бизнес логики

      channel.ack(msg);
    } catch (e) {
      console.error('Error processing message: ', e);
      channel.nack(msg, false, true);
    }
  });
}

startWorker();
