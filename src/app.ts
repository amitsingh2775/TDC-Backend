

import express, { Application, Request, Response } from 'express';
import cors from 'cors';

import { requestLogger } from './middleware/logger';
import { globalErrorHandler, notFoundHandler } from './middleware/errorHandler';

import authRoutes from './routes/authRoutes';
import clientRoutes from './routes/clientRoutes';
import matchRoutes from './routes/matchRoutes';
import poolRoutes from './routes/poolRoutes';

export function createApp(): Application {
  const app = express();

  // ── Global Middleware ──────────────────────
  app.use(cors({
    origin: process.env['CORS_ORIGIN'] ?? '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);


  // ── API Routes ─────────────────────────────
  app.use('/api/auth', authRoutes);
  app.use('/api/clients', clientRoutes);
  app.use('/api/matches', matchRoutes);
  app.use('/api/pool', poolRoutes);

  // ── 404 and Error Handlers ─────────────────
  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
}
