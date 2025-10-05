import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;

export const initRedis = async () => {
  console.log('🔍 DEBUG - REDIS_HOST:', process.env.REDIS_HOST);
  console.log('🔍 DEBUG - REDIS_PORT:', process.env.REDIS_PORT);

  redisClient = createClient({
    socket: {
      host: process.env.REDIS_HOST || 'redis',
      port: Number(process.env.REDIS_PORT) || 6379,
    }
  });

  redisClient.on('connect', () => console.log('✅ Redis connecté'));
  redisClient.on('error', (err) => console.error('Redis Client Error', err));

  await redisClient.connect();
  console.log('✅ Redis prêt');
  
  return redisClient;
};

export const getRedis = () => {
  if (!redisClient) {
    throw new Error('Redis not initialized. Call initRedis() first.');
  }
  return redisClient;
};

export default { initRedis, getRedis };