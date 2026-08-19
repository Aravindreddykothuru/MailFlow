import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../db/client';
import { createEtherealAccount } from '../services/sender.service';
import { AppError } from '../middlewares/error.middleware';
import { logger } from '../config/logger';

const createSenderSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters').trim(),
});

/**
 * GET /senders — List all configured senders for the authenticated user.
 */
export async function getSenders(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    let senders = await prisma.sender.findMany({
      where: { userId: req.userId },
      select: {
        id: true,
        displayName: true,
        email: true,
        etherealUser: true,
      },
      orderBy: { email: 'asc' },
    });

    // If user has no sender yet, auto-provision the default one
    if (senders.length === 0) {
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { name: true },
      });
      const name = user?.name || 'Default Sender';
      const account = await createEtherealAccount(name);
      const created = await prisma.sender.create({
        data: {
          userId: req.userId,
          displayName: account.fromName,
          email: account.fromEmail,
          etherealUser: account.user,
          etherealPass: account.pass,
        },
        select: {
          id: true,
          displayName: true,
          email: true,
          etherealUser: true,
        },
      });
      senders = [created];
    }

    res.json({ ok: true, data: senders });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /senders — Create a new Sender profile with dedicated Ethereal credentials.
 */
export async function createSender(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { displayName } = createSenderSchema.parse(req.body);

    const account = await createEtherealAccount(displayName);

    const sender = await prisma.sender.create({
      data: {
        userId: req.userId,
        displayName: account.fromName,
        email: account.fromEmail,
        etherealUser: account.user,
        etherealPass: account.pass,
      },
      select: {
        id: true,
        displayName: true,
        email: true,
        etherealUser: true,
      },
    });

    logger.info(
      { userId: req.userId, senderId: sender.id, email: sender.email },
      'New sender profile created',
    );

    res.status(201).json({ ok: true, data: sender });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /senders/:id — Delete a sender profile if user has multiple senders.
 */
export async function deleteSender(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params;

    const count = await prisma.sender.count({
      where: { userId: req.userId },
    });

    if (count <= 1) {
      throw new AppError(
        'CANNOT_DELETE_LAST_SENDER',
        'You must have at least one sender configured.',
        400,
      );
    }

    const sender = await prisma.sender.findFirst({
      where: { id, userId: req.userId },
    });

    if (!sender) {
      throw new AppError('SENDER_NOT_FOUND', 'Sender not found.', 404);
    }

    await prisma.sender.delete({ where: { id } });

    res.json({ ok: true, data: null });
  } catch (err) {
    next(err);
  }
}
