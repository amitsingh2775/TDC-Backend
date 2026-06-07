

import morgan from 'morgan';
import { Request, Response } from 'express';

// Custom token: response body size
morgan.token('body-size', (_req: Request, res: Response): string => {
  const size = res.getHeader('content-length');
  return size ? `${size}b` : '-';
});


const DEV_FORMAT =
  ':method :url :status :response-time ms — :body-size [:date[clf]]';


const PROD_FORMAT = JSON.stringify({
  method: ':method',
  url: ':url',
  status: ':status',
  responseTime: ':response-time ms',
  referrer: ':referrer',
  userAgent: ':user-agent',
  date: ':date[iso]',
});

export const requestLogger = morgan(
  process.env['NODE_ENV'] === 'production' ? PROD_FORMAT : DEV_FORMAT
);
