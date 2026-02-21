import amqp from 'amqplib';

type QueueResponse =
  | { success: true; info?: Record<string, unknown> }
  | { success: false; error: string };

type QueueDrainResponse =
  | { success: true; messages: unknown[] }
  | { success: false; error: string };

const getCandidateUrls = (): string[] => [
  process.env.RABBITMQ_URL,
  'amqp://rabbit:rabbit@127.0.0.1:5672/',
  'amqp://localhost:5672/',
].filter((url): url is string => Boolean(url && url.trim()));

async function connectWithFallback() {
  const candidateUrls = getCandidateUrls();
  let lastError = 'Unable to connect to RabbitMQ';

  for (const rabbitUrl of candidateUrls) {
    try {
      const connection = await amqp.connect(rabbitUrl);
      return { connection, rabbitUrl };
    } catch (error: unknown) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }

  throw new Error(lastError);
}

export const pushMessage = async (
  queueName: string,
  message: unknown
): Promise<QueueResponse> => {
  const payload =
    typeof message === 'string' ? message : JSON.stringify(message);

  try {
    const { connection, rabbitUrl } = await connectWithFallback();
    const channel = await connection.createChannel();

    await channel.assertQueue(queueName, { durable: true });
    const enqueued = channel.sendToQueue(queueName, Buffer.from(payload), {
      persistent: true,
    });

    await channel.close();
    await connection.close();

    return { success: true, info: { enqueued, rabbitUrl } };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

export const drainQueueMessages = async (
  queueName: string,
  maxMessages = 25
): Promise<QueueDrainResponse> => {
  try {
    const { connection } = await connectWithFallback();
    const channel = await connection.createChannel();
    await channel.assertQueue(queueName, { durable: true });

    const drainedMessages: unknown[] = [];

    for (let index = 0; index < maxMessages; index += 1) {
      const message = await channel.get(queueName, { noAck: false });
      if (!message) {
        break;
      }

      try {
        const text = message.content.toString();
        const parsed = JSON.parse(text) as unknown;
        drainedMessages.push(parsed);
        channel.ack(message);
      } catch {
        channel.nack(message, false, false);
      }
    }

    await channel.close();
    await connection.close();

    return { success: true, messages: drainedMessages };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};
