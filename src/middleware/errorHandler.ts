

import { Request, Response, NextFunction } from 'express';
import { IApiError } from '../interfaces';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

// ── 404 Catch-All ─────────────────────────────
export function notFoundHandler(req: Request, res: Response, _next: NextFunction): void {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
    statusCode: 404,
  } satisfies IApiError);
}

// ── Global Error Handler ───────────────────────
export function globalErrorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;
  const message = isAppError ? err.message : 'An unexpected internal server error occurred.';
  const details = process.env['NODE_ENV'] !== 'production' ? err.stack : undefined;

  console.error(`[ErrorHandler] ${statusCode} — ${err.message}`, {
    stack: err.stack,
    isOperational: isAppError ? err.isOperational : false,
  });

  res.status(statusCode).json({
    success: false,
    error: message,
    details,
    statusCode,
  } satisfies IApiError);
}
