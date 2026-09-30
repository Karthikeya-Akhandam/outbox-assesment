import { Request, Response } from 'express';
import { prisma } from '../db';
import { emailQueue } from '../queues/emailQueue';
import { indexEmail } from '../services/elasticsearchService';

export const scheduleEmails = async (req: Request, res: Response) => {
  try {
    const { to, subject, body, scheduledAt, delayBetween, hourlyLimit } = req.body;

    // TODO: get userId from auth middleware. For now, hardcode or require it in body.
    const userId = req.body.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User ID is required' });
    }

    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      return res.status(400).json({ error: 'Invalid scheduledAt date' });
    }

    // Default delay to 2 seconds if not provided, hourly limit to 100
    const delay = delayBetween || 2000;
    const limit = hourlyLimit || 100;

    const emails = [];

    // Ensure recipient list is an array
    const recipients = Array.isArray(to) ? to : [to];

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      
      // Calculate stagger based on position to respect delay
      const staggerMs = i * delay;
      const individualScheduledDate = new Date(scheduledDate.getTime() + staggerMs);

      // Create in DB
      const email = await prisma.email.create({
        data: {
          userId,
          to: recipient,
          subject,
          body,
          senderEmail: process.env.SMTP_USER || 'test@ethereal.email',
          scheduledAt: individualScheduledDate,
          status: 'SCHEDULED',
        }
      });

      // Calculate BullMQ delay
      const jobDelay = Math.max(individualScheduledDate.getTime() - Date.now(), 0);

      // Add to Queue
      const job = await emailQueue.add('send-email', { 
        emailId: email.id, 
        hourlyLimit: limit 
      }, {
        delay: jobDelay,
        jobId: email.id, // Idempotency key
      });

      // Update email with BullMQ job ID
      await prisma.email.update({
        where: { id: email.id },
        data: { bullJobId: job.id }
      });

      // Index to Elasticsearch
      await indexEmail(email);

      emails.push(email);
    }

    return res.status(201).json({ 
      message: 'Emails scheduled successfully', 
      count: emails.length,
      emails 
    });

  } catch (error) {
    console.error('Error scheduling emails:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getScheduledEmails = async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string || (req.user as any)?.id;
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '10', 10);
    const skip = (page - 1) * limit;

    const where = { 
      status: { in: ['SCHEDULED', 'QUEUED', 'RATE_LIMITED'] as any },
      ...(userId ? { userId } : {})
    };

    const [emails, total] = await Promise.all([
      prisma.email.findMany({
        where,
        orderBy: { scheduledAt: 'asc' },
        skip,
        take: limit,
      }),
      prisma.email.count({ where })
    ]);

    return res.json({ emails, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Error fetching scheduled emails:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getSentEmails = async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string || (req.user as any)?.id;
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '10', 10);
    const skip = (page - 1) * limit;

    const where = { 
      status: { in: ['SENT', 'FAILED'] as any },
      ...(userId ? { userId } : {})
    };

    const [emails, total] = await Promise.all([
      prisma.email.findMany({
        where,
        orderBy: { sentAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.email.count({ where })
    ]);

    return res.json({ emails, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Error fetching sent emails:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const searchEmails = async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string || (req.user as any)?.id;
    const q = req.query.q as string;

    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Direct import for ES client here to avoid circular dep issues in controller
    const { esClient: client } = require('../config/elasticsearch');

    const result = await client.search({
      index: 'emails',
      body: {
        query: {
          bool: {
            must: [
              {
                multi_match: {
                  query: q,
                  fields: ['subject', 'body', 'to']
                }
              }
            ],
            ...(userId ? { filter: [{ term: { userId } }] } : {})
          }
        },
        sort: [{ scheduledAt: { order: 'desc' } }]
      }
    });

    const hits = result.hits.hits.map((hit: any) => hit._source);
    
    return res.json({ emails: hits, total: result.hits.total.value });
  } catch (error) {
    console.error('Error searching emails:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
