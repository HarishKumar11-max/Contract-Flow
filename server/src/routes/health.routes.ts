import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { env } from '../config/env';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  const isDbConnected = mongoose.connection.readyState === 1;

  res.status(isDbConnected ? 200 : 503).json({
    status: isDbConnected ? 'ok' : 'degraded',
    message: 'Contract Lifecycle Management API is operational',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
    database: {
      status: isDbConnected ? 'connected' : 'disconnected',
      readyState: mongoose.connection.readyState,
      name: mongoose.connection.name || 'clm_database',
    },
  });
});

export default router;
