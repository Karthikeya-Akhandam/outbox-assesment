import { Queue } from 'bullmq';
import { connection } from '../config/redis';

export const emailQueue = new Queue('email-queue', {
  connection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  },
});
