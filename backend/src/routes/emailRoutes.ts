import { Router } from 'express';
import { scheduleEmails, getScheduledEmails, getSentEmails, searchEmails } from '../controllers/emailController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth); // Protect all routes below

router.post('/schedule', scheduleEmails);
router.get('/scheduled', getScheduledEmails);
router.get('/sent', getSentEmails);
router.get('/search', searchEmails);

export default router;
