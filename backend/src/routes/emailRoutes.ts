import { Router } from 'express';
import { scheduleEmails } from '../controllers/emailController';

const router = Router();

router.post('/schedule', scheduleEmails);

export default router;
