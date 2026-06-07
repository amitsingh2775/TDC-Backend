// ─────────────────────────────────────────────
//  src/index.ts
//  Server bootstrap
// ─────────────────────────────────────────────

import { createApp } from './app';
import { AppConfig } from './config';

const app = createApp();

const server = app.listen(AppConfig.PORT, () => {
  console.log("server started on port " + AppConfig.PORT);
});

// ── Graceful Shutdown ──────────────────────────
function gracefulShutdown(signal: string): void {
  console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('[Server] HTTP server closed. Goodbye! 💫');
    process.exit(0);
  });
  // Force close after 10s
  setTimeout(() => {
    console.error('[Server] Forced shutdown after timeout.');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ── Unhandled Rejection / Uncaught Exception ──
process.on('unhandledRejection', (reason: unknown) => {
  console.error('[Server] Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (error: Error) => {
  console.error('[Server] Uncaught Exception:', error);
  process.exit(1);
});

export default server;
