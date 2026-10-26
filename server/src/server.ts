import app from './app';
import { connectDB, disconnectDB } from './config/db';
import { seedDatabase } from './utils/seed';
import { env } from './config/env';

import { radarService } from './services/radar.service';

const startServer = async () => {
  try {
    console.log('[Server] Initializing database connection...');
    await connectDB();

    console.log('[Server] Checking and seeding default database demo accounts...');
    await seedDatabase();

    // Start background radar cron schedule (runs daily)
    radarService.startCron('0 0 * * *');

    const server = app.listen(env.PORT, () => {
      console.log(`[Server] CLM API running on http://localhost:${env.PORT} in ${env.NODE_ENV} mode`);
      console.log(`[Server] Health check available at http://localhost:${env.PORT}/api/health`);
    });

    const shutdown = async (signal: string) => {
      console.log(`\n[Server] Received ${signal}. Gracefully shutting down...`);
      radarService.stopCron();
      server.close(async () => {
        await disconnectDB();
        console.log('[Server] Server closed and database disconnected.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('[Server] Fatal startup error:', error);
    process.exit(1);
  }
};

startServer();
