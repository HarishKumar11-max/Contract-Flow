import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { connectDB, disconnectDB } from '../src/config/db';

describe('Health Check API', () => {
  beforeAll(async () => {
    process.env.USE_MEMORY_DB = 'true';
    await connectDB();
  }, 180000);

  afterAll(async () => {
    await disconnectDB();
  });

  it('GET /api/health should return 200 and report database connected', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('message');
    expect(response.body.database).toBeDefined();
    expect(response.body.database.status).toBe('connected');
    expect(response.body.database.readyState).toBe(1);
  });

  it('GET / should return basic service information', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('name');
    expect(response.body.status).toBe('online');
  });
});
