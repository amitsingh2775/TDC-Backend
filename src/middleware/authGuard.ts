

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtConfig } from '../config';
import { IAuthPayload } from '../interfaces';
import { AppError } from './errorHandler';


declare global {
  namespace Express {
    interface Request {
      matcher?: IAuthPayload;
    }
  }
}

export function authGuard(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication required. Please provide a Bearer token.', 401));
  }

  const token = authHeader.slice(7); 

  try {
    const decoded = jwt.verify(token, JwtConfig.SECRET) as IAuthPayload;
    req.matcher = decoded;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(new AppError('Session expired. Please log in again.', 401));
    }
    return next(new AppError('Invalid token. Please log in again.', 401));
  }
}
