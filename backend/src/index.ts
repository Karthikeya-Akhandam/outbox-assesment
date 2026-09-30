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

app.use('/api/', apiLimiter);

app.use('/api/emails', emailRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

import { recoverPendingJobs } from './services/restartRecovery';

app.listen(port, async () => {
  console.log(`Server is running on port ${port}`);
  
  // Run recovery after server starts
  await recoverPendingJobs();
});
