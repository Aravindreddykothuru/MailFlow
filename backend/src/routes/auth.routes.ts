import { Router } from 'express';
import {
  register,
  login,
  googleLogin,
  googleCallback,
  logout,
  getMe,
} from '../controllers/auth.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

/** POST /auth/register — Create account with email & password. */
router.post('/register', register);

/** POST /auth/login — Sign in with email & password. */
router.post('/login', login);

/** GET /auth/google — Start Google OAuth redirect flow. */
router.get('/google', googleLogin);

/** GET /auth/google/callback — OAuth code exchange; sets httpOnly cookie; redirects to frontend. */
router.get('/google/callback', googleCallback);

/** POST /auth/logout — Clears the session cookie. */
router.post('/logout', logout);

/** GET /auth/me or GET /me — Returns the current user's profile. Requires auth. */
router.get('/me', requireAuth, getMe);

export { router as authRouter };

