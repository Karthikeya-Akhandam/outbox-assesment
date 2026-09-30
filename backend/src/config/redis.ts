import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL;
const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
const redisPassword = process.env.REDIS_PASSWORD;

// Upstash and managed Redis usually require TLS if using individual credentials, 
// but REDIS_URL (rediss://) handles it automatically.
export const connection = redisUrl 
  ? new Redis(redisUrl, { maxRetriesPerRequest: null })
  : new Redis({
      host: redisHost,
      port: redisPort,
      password: redisPassword,
      tls: redisPassword ? {} : undefined, // Enable TLS if password is provided (assuming managed Redis)
      maxRetriesPerRequest: null,
    });

connection.on('error', (err) => {
  console.error('Redis connection error:', err);
});
