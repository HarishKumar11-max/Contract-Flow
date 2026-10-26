import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { connectDB, disconnectDB } from '../src/config/db';
import { seedDatabase } from '../src/utils/seed';
import { AuditLog } from '../src/models/auditLog.model';

describe('Auth & RBAC & User Management API', () => {
  let adminToken: string;
  let viewerToken: string;

  beforeAll(async () => {
    process.env.USE_MEMORY_DB = 'true';
    await connectDB();
    await seedDatabase();
  }, 180000);

  afterAll(async () => {
    await disconnectDB();
  });

  describe('POST /api/auth/login', () => {
    it('should authenticate admin user with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@clm.local',
          password: 'Admin123!',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('email', 'admin@clm.local');
      expect(res.body.user).toHaveProperty('role', 'Admin');
      expect(res.body.user).not.toHaveProperty('passwordHash');

      adminToken = res.body.token;
    });

    it('should authenticate viewer user with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'viewer@clm.local',
          password: 'Viewer123!',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('role', 'Viewer');

      viewerToken = res.body.token;
    });

    it('should reject login with invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@clm.local',
          password: 'WrongPassword!',
        });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error', 'AuthenticationError');
    });

    it('should reject login for non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'ghost@clm.local',
          password: 'SomePassword123!',
        });

      expect(res.status).toBe(401);
    });

    it('should validate request body and reject invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'not-an-email',
          password: '123',
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'ValidationError');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return profile for authenticated user', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user).toHaveProperty('email', 'admin@clm.local');
      expect(res.body.user).toHaveProperty('role', 'Admin');
    });

    it('should return 401 if token is missing', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('should return 401 if token is invalid', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.jwt.token');
      expect(res.status).toBe(401);
    });
  });

  describe('RBAC & User Management (/api/users)', () => {
    it('should forbid Viewer from creating new users', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          name: 'Unauthorized User',
          email: 'unauth@clm.local',
          password: 'Password123!',
          role: 'Viewer',
          department: 'Legal',
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Forbidden');
    });

    it('should allow Admin to list users', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('users');
      expect(Array.isArray(res.body.users)).toBe(true);
      expect(res.body.users.length).toBeGreaterThanOrEqual(6);
      expect(res.body.pagination).toBeDefined();
    });

    it('should allow Admin to create a new user', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Jane Doe',
          email: 'jane.doe@clm.local',
          password: 'Password123!',
          role: 'Legal',
          department: 'Legal Operations',
        });

      expect(res.status).toBe(201);
      expect(res.body.user).toHaveProperty('email', 'jane.doe@clm.local');
      expect(res.body.user).toHaveProperty('role', 'Legal');
    });

    it('should prevent duplicate user creation with same email', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Jane Duplicate',
          email: 'jane.doe@clm.local',
          password: 'Password123!',
          role: 'Legal',
          department: 'Legal Operations',
        });

      expect(res.status).toBe(409);
    });
  });

  describe('Audit Logging (/api/audit-logs)', () => {
    it('should record audit log on login and user creation', async () => {
      const loginLogs = await AuditLog.find({ action: 'LOGIN' });
      expect(loginLogs.length).toBeGreaterThan(0);

      const createLogs = await AuditLog.find({ action: 'CREATE', entityType: 'User' });
      expect(createLogs.length).toBeGreaterThan(0);
      expect(createLogs[0].userEmail).toBe('admin@clm.local');
    });

    it('should allow Admin to query audit logs', async () => {
      const res = await request(app)
        .get('/api/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('logs');
      expect(Array.isArray(res.body.logs)).toBe(true);
      expect(res.body.logs.length).toBeGreaterThan(0);
    });

    it('should allow Viewer to access audit logs (read-only per 6-role spec)', async () => {
      const res = await request(app)
        .get('/api/audit-logs')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
    });
  });
});
