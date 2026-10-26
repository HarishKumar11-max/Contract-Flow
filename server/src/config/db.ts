import mongoose from 'mongoose';
import { env } from './env';

let mongodInstance: any = null;

export const connectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (
    process.env.NODE_ENV === 'test' ||
    process.env.USE_MEMORY_DB === 'true'
  ) {
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');

      mongodInstance = await MongoMemoryServer.create({
        instance: { dbName: 'contractflow' },
      });

      await mongoose.connect(mongodInstance.getUri(), {
        dbName: 'contractflow',
      });

      console.log('[DB] Connected to in-memory MongoDB for testing.');
      return;
    } catch (error) {
      console.error('[DB] Failed to initialize in-memory MongoDB:', error);
      throw error;
    }
  }

  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log('[DB] Connected to configured MongoDB successfully.');
  } catch (error) {
    console.error('[DB] MongoDB connection failed. Check your Atlas configuration.');
    throw error;
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
