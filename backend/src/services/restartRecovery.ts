import { prisma } from '../db';
import { emailQueue } from '../queues/emailQueue';

export const recoverPendingJobs = async () => {
  try {
    console.log('Running restart recovery: checking for pending email jobs...');
    
    // Find all emails that are supposed to be scheduled but might have been lost from Redis
    const pendingEmails = await prisma.email.findMany({
      where: {
        status: { in: ['SCHEDULED', 'QUEUED', 'RATE_LIMITED'] },
        // We also want to catch ones that are in the past but didn't send (missed their window)
        // so we don't strictly filter by future date, but we schedule them immediately if past.
      },
    });

    if (pendingEmails.length === 0) {
      console.log('No pending jobs found for recovery.');
      return;
    }

    let recoveredCount = 0;

    for (const email of pendingEmails) {
      // Check if job already exists in BullMQ (based on idempotency key)
      const existingJob = await emailQueue.getJob(email.id);
      
      if (!existingJob) {
        // Calculate new delay (0 if it was scheduled in the past)
        const delay = Math.max(new Date(email.scheduledAt).getTime() - Date.now(), 0);
        
        // Use a default hourly limit for recovery, or read from somewhere
        const limit = parseInt(process.env.MAX_EMAILS_PER_HOUR_PER_SENDER || '100', 10);
        
        const job = await emailQueue.add('send-email', { 
          emailId: email.id,
          hourlyLimit: limit
        }, {
          delay,
          jobId: email.id,
        });

        // Update with new job ID just in case
        if (email.bullJobId !== job.id) {
            await prisma.email.update({
                where: { id: email.id },
                data: { bullJobId: job.id }
            });
        }
        recoveredCount++;
      }
    }

    console.log(`Recovery complete. Re-enqueued ${recoveredCount} jobs.`);
  } catch (error) {
    console.error('Error during restart recovery:', error);
  }
};
