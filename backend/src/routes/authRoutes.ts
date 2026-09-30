import { Router } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-do-not-use-in-prod';

// Initiate Google OAuth
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google OAuth callback
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login?error=auth_failed' }),
  (req: any, res) => {
    // Generate JWT
    const token = jwt.sign(
      { id: req.user.id, email: req.user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Redirect back to frontend with token
    res.redirect(`http://localhost:5173/auth/success?token=${token}`);
  }
);

// Get current user details
router.get('/me', (req: any, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ user: decoded });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
