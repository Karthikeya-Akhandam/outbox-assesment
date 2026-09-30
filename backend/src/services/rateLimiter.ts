import { connection } from '../config/redis';

export async function checkAndIncrementRate(
  senderEmail: string, 
  limit: number
): Promise<{ allowed: boolean; currentCount: number }> {
  // Use a sliding window or fixed hour window
  // Fixed hour window is easier: e.g. "2023-10-27-14"
  const hourBucket = Math.floor(Date.now() / 3600000);
  const key = `rate:${senderEmail}:${hourBucket}`;
  
  const current = await connection.incr(key);
  
  if (current === 1) {
    // Set expiry to slightly more than an hour to ensure it cleans up
    await connection.expire(key, 3600);
  }
  
  if (current > limit) {
    // Revert the increment since they are not allowed to send
    await connection.decr(key);
    return { allowed: false, currentCount: current - 1 };
  }
  
  return { allowed: true, currentCount: current };
}
