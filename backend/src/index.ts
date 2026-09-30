import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import './workers/emailWorker';
import emailRoutes from './routes/emailRoutes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

import rateLimit from 'express-rate-limit';

// Global API rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

import { emailQueue } from './queues/emailQueue';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullMQAdapter(emailQueue)],
  serverAdapter: serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());

app.use('/api/', apiLimiter);

app.use('/api/emails', emailRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

import { recoverPendingJobs } from './services/restartRecovery';
import { initElasticsearch } from './config/elasticsearch';

app.listen(port, async () => {
  console.log(`Server is running on port ${port}`);
  
  // Initialize Elasticsearch index
  await initElasticsearch();

  // Run recovery after server starts
  await recoverPendingJobs();
});
