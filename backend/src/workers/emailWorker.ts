import { Worker, Job } from 'bullmq';
import { connection } from '../config/redis';
import { prisma } from '../db';
import { sendEmail } from '../services/emailTransporter';
import { checkAndIncrementRate } from '../services/rateLimiter';
import { emailQueue } from '../queues/emailQueue';

const workerConcurrency = parseInt(process.env.WORKER_CONCURRENCY || '5', 10);

export const emailWorker = new Worker('email-queue', async (job: Job) => {
  const { emailId, hourlyLimit } = job.data;

  // Idempotency Check & Data Retrieval
  const email = await prisma.email.findUnique({ where: { id: emailId } });
  
  if (!email) {
    console.error(`Email record not found for job ${job.id}`);
    return;
  }

  if (email.status === 'SENT') {
    console.log(`Email ${email.id} already sent. Skipping (Idempotency).`);
    return;
  }

  // Rate limit check
  const senderEmail = email.senderEmail || process.env.SMTP_USER || 'test@ethereal.email';
  const rateLimitResult = await checkAndIncrementRate(senderEmail, hourlyLimit);

  if (!rateLimitResult.allowed) {
    console.log(`Rate limit exceeded for ${senderEmail}. Re-scheduling email ${email.id} for the next hour window.`);
    
    // Calculate ms until next hour window
    const now = new Date();
    const nextHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0, 0);
    const delay = nextHour.getTime() - now.getTime();

    // Update status
    await prisma.email.update({
      where: { id: email.id },
      data: { status: 'RATE_LIMITED' }
    });

    // Re-add to queue with delay
    await emailQueue.add('send-email', { emailId, hourlyLimit }, {
      delay,
      jobId: `${email.id}-rescheduled-${nextHour.getTime()}` // New idempotency key for the reschedule
    });

    // We can also trigger Slack notification here later
    
    return { status: 'RATE_LIMITED', nextAttempt: nextHour };
  }

  try {
    await prisma.email.update({
      where: { id: email.id },
      data: { status: 'SENDING' }
    });

    // Send the email via SMTP
    const info = await sendEmail(email.to, email.subject, email.body);

    await prisma.email.update({
      where: { id: email.id },
      data: { 
        status: 'SENT',
        sentAt: new Date(),
      }
    });

    return info;
  } catch (error: any) {
    console.error(`Failed to send email ${email.id}:`, error);

    await prisma.email.update({
      where: { id: email.id },
      data: { 
        status: 'FAILED',
        errorMessage: error.message
      }
    });

    throw error;
  }
}, { 
  connection,
  concurrency: workerConcurrency,
  limiter: {
    max: 1,
    duration: parseInt(process.env.MIN_DELAY_BETWEEN_SENDS_MS || '2000', 10),
  }
});

emailWorker.on('completed', (job) => {
  console.log(`Job with id ${job.id} has been completed`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`Job with id ${job?.id} has failed with ${err.message}`);
});
