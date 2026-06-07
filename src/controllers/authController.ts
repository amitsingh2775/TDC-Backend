

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { JwtConfig } from '../config';
import { MATCHMAKERS } from '../data/mockDb';
import { ILoginRequest, IAuthPayload, IApiSuccess } from '../interfaces';
import { AppError } from '../middleware/errorHandler';

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body as ILoginRequest;

    if (!email || !password) {
      throw new AppError('Email and password are required.', 400);
    }

    // Find matchmaker by email (case-insensitive)
    const matcher = MATCHMAKERS.find(
      (m) => m.email.toLowerCase() === email.toLowerCase()
    );

    if (!matcher) {
      throw new AppError('Invalid credentials.', 401);
    }

    // Verify password against bcrypt hash
    const passwordValid = await bcrypt.compare(password, matcher.passwordHash);
    if (!passwordValid) {
      throw new AppError('Invalid credentials.', 401);
    }

    // Build JWT payload
    const payload: IAuthPayload = {
      matcherId: matcher.id,
      email: matcher.email,
      name: matcher.name,
    };

    const token = jwt.sign(payload, JwtConfig.SECRET, {
      expiresIn: JwtConfig.EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });

    const response: IApiSuccess<{
      token: string;
      matcher: Omit<typeof matcher, 'passwordHash' | 'assignedClientIds'>;
      expiresIn: string;
    }> = {
      success: true,
      message: `Welcome back, ${matcher.name}!`,
      data: {
        token,
        matcher: {
          id: matcher.id,
          email: matcher.email,
          name: matcher.name,
        },
        expiresIn: JwtConfig.EXPIRES_IN,
      },
    };

    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const matcherId = req.matcher?.matcherId;
    const matcher = MATCHMAKERS.find((m) => m.id === matcherId);

    if (!matcher) {
      throw new AppError('Matchmaker not found.', 404);
    }

    res.json({
      success: true,
      data: {
        id: matcher.id,
        email: matcher.email,
        name: matcher.name,
        totalClients: matcher.assignedClientIds.length,
      },
    } satisfies IApiSuccess<{
      id: string;
      email: string;
      name: string;
      totalClients: number;
    }>);
  } catch (err) {
    next(err);
  }
}
