import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy, type Profile } from 'passport-google-oauth20';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../db/client';
import { config } from '../config';
import { logger } from '../config/logger';
import { createEtherealAccount } from '../services/sender.service';
import { hashPassword, verifyPassword } from '../services/password.service';
import { AppError } from '../middlewares/error.middleware';


// ─── Passport Strategy Configuration ─────────────────────────────────────────
// Configured once and imported into index.ts where passport.initialize() runs.

export function configureGoogleStrategy(): void {
  if (!config.GOOGLE_CLIENT_ID || !config.GOOGLE_CLIENT_SECRET) {
    logger.info('Google OAuth not configured — Email & Password authentication active');
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: config.GOOGLE_CLIENT_ID,
        clientSecret: config.GOOGLE_CLIENT_SECRET,
        callbackURL: config.GOOGLE_CALLBACK_URL,
      },
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: Profile,
        done: (err: Error | null, user?: Express.User | false) => void,
      ) => {
        try {
          const googleId = profile.id;
          const email = profile.emails?.[0]?.value ?? '';
          const name = profile.displayName ?? email;
          const avatarUrl = profile.photos?.[0]?.value ?? null;

          // Upsert: create on first login, update avatar/name on subsequent logins.
          const user = await prisma.user.upsert({
            where: { googleId },
            create: { googleId, email, name, avatarUrl },
            update: { name, avatarUrl },
          });

          // Provision a default Ethereal sender for new users.
          const existingSender = await prisma.sender.findFirst({
            where: { userId: user.id },
          });

          if (!existingSender) {
            logger.info({ userId: user.id }, 'Creating default Ethereal sender for new user');
            const account = await createEtherealAccount(name);
            await prisma.sender.create({
              data: {
                userId: user.id,
                email: account.fromEmail,
                displayName: account.fromName,
                etherealUser: account.user,
                etherealPass: account.pass,
              },
            });
          }

          done(null, user as Express.User);
        } catch (err) {
          done(err as Error);
        }
      },
    ),
  );

  // We use stateless JWT cookies so we don't need session serialization.
  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user, done) => done(null, user as Express.User));
}


// ─── Cookie helper ────────────────────────────────────────────────────────────



function setSessionCookie(res: Response, user: { id: string; email: string }): string {
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN as `${number}${'s' | 'm' | 'h' | 'd' | 'w' | 'y'}` },
  );

  res.cookie('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return token;
}

// ─── Registration & Login Schemas ─────────────────────────────────────────────

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

/** POST /auth/register — Create account with email & password */
export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, password } = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError('EMAIL_TAKEN', 'An account with this email already exists.', 409);
    }

    const passwordHash = hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
      },
    });

    // Provision default Ethereal sender for campaigns
    try {
      const account = await createEtherealAccount(name);
      await prisma.sender.create({
        data: {
          userId: user.id,
          email: account.fromEmail,
          displayName: account.fromName,
          etherealUser: account.user,
          etherealPass: account.pass,
        },
      });
    } catch (senderErr) {
      logger.warn({ userId: user.id, err: senderErr }, 'Could not provision Ethereal account');
    }

    const token = setSessionCookie(res, user);

    res.status(201).json({
      ok: true,
      data: {
        ...user,
        token,
      },
    });
  } catch (err) {
    next(err);
  }
}

/** POST /auth/login — Sign in with email & password */
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
      throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password.', 401);
    }

    // Provision a sender if one doesn't exist yet
    const existingSender = await prisma.sender.findFirst({ where: { userId: user.id } });
    if (!existingSender) {
      try {
        const account = await createEtherealAccount(user.name);
        await prisma.sender.create({
          data: {
            userId: user.id,
            email: account.fromEmail,
            displayName: account.fromName,
            etherealUser: account.user,
            etherealPass: account.pass,
          },
        });
      } catch (senderErr) {
        logger.warn({ userId: user.id, err: senderErr }, 'Could not provision Ethereal account');
      }
    }

    const token = setSessionCookie(res, user);

    res.json({
      ok: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        token,
      },
    });
  } catch (err) {
    next(err);
  }
}


/** GET /auth/google — Initiates the Google OAuth redirect. */
export const googleLogin = passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false,
});

/** GET /auth/google/callback — Handles the OAuth code exchange. */
export function googleCallback(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  passport.authenticate(
    'google',
    { session: false, failureRedirect: `${config.FRONTEND_URL}/login?authError=1` },
    (err: Error | null, user: { id: string; email: string } | false) => {
      if (err || !user) {
        logger.error({ err }, 'Google OAuth callback failed');
        res.redirect(`${config.FRONTEND_URL}/login?authError=1`);
        return;
      }

      setSessionCookie(res, user);

      res.redirect(`${config.FRONTEND_URL}/dashboard`);
    },
  )(req, res, next);
}

/** POST /auth/logout — Clears the session cookie. */
export function logout(req: Request, res: Response): void {
  res.clearCookie('session');
  res.json({ ok: true, data: null });
}

/** GET /me — Returns the current user's profile for the dashboard header. */
export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, name: true, email: true, avatarUrl: true },
    });

    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'User not found.', 404);
    }

    res.json({ ok: true, data: user });
  } catch (err) {
    next(err);
  }
}

