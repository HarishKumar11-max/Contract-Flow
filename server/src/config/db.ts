import mongoose from 'mongoose';
import { env } from './env';

let mongodInstance: any = null;

export const connectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  // If in test environment or explicitly requested in-memory
  if (process.env.NODE_ENV === 'test' || process.env.USE_MEMORY_DB === 'true') {
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      // Use named database 'contractflow' so tests use consistent db name
      mongodInstance = await MongoMemoryServer.create({ instance: { dbName: 'contractflow' } });
      const memoryUri = mongodInstance.getUri();
      await mongoose.connect(memoryUri, { dbName: 'contractflow' });
      console.log(`[DB] Connected to in-memory MongoDB (contractflow) for testing at ${memoryUri}`);
      return;
    } catch (memErr) {
      console.error('[DB] Failed to initialize MongoMemoryServer:', memErr);
      throw memErr;
    }
  }

  // Otherwise, attempt connection to configured URI with short timeout
  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 2500,
    });
    console.log(`[DB] Connected to MongoDB at ${env.MONGODB_URI}`);
  } catch (err: any) {
    console.warn(`[DB] Could not connect to external MongoDB (${err.message}). Falling back to MongoMemoryServer...`);
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      // Named database in fallback too
      mongodInstance = await MongoMemoryServer.create({ instance: { dbName: 'contractflow' } });
      const memoryUri = mongodInstance.getUri();
      await mongoose.connect(memoryUri, { dbName: 'contractflow' });
      console.log(`[DB] Fallback in-memory MongoDB (contractflow) initialized at ${memoryUri}`);
    } catch (fallbackErr) {
      console.error('[DB] Critical: Failed to connect to external MongoDB and fallback failed:', fallbackErr);
      throw fallbackErr;
    }
  }
};

export const disconnectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongodInstance) {
    await mongodInstance.stop();
    mongodInstance = null;
  }
};
