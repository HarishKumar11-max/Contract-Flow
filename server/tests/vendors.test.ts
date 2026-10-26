import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { connectDB, disconnectDB } from '../src/config/db';
import { seedDatabase } from '../src/utils/seed';
import { AuditLog } from '../src/models/auditLog.model';

describe('Vendor Management & Performance API', () => {
  let adminToken: string;
  let procurementToken: string;
  let viewerToken: string;
  let legalToken: string;
  let createdVendorId: string;

  beforeAll(async () => {
    process.env.USE_MEMORY_DB = 'true';
    await connectDB();
    await seedDatabase();

    // Login users to acquire tokens
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@clm.local', password: 'Admin123!' });
    adminToken = adminRes.body.token;

    const procRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'procurement@clm.local', password: 'Procure123!' });
    procurementToken = procRes.body.token;

    const viewerRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'viewer@clm.local', password: 'Viewer123!' });
    viewerToken = viewerRes.body.token;

    const legalRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'legal@clm.local', password: 'Legal123!' });
    legalToken = legalRes.body.token;
  }, 180000);

  afterAll(async () => {
    await disconnectDB();
  });

  describe('GET /api/vendors', () => {
    it('should list all seeded vendors for any authenticated user (e.g. Viewer)', async () => {
      const res = await request(app)
        .get('/api/vendors')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('vendors');
      expect(Array.isArray(res.body.vendors)).toBe(true);
      expect(res.body.vendors.length).toBeGreaterThanOrEqual(5);
      expect(res.body.metrics).toBeDefined();
      expect(res.body.metrics.totalVendors).toBeGreaterThanOrEqual(5);
      expect(res.body.metrics.avgPerformanceRating).toBeGreaterThan(0);
    });

    it('should filter vendors by category', async () => {
      const res = await request(app)
        .get('/api/vendors?category=Logistics')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.vendors.length).toBeGreaterThanOrEqual(1);
      expect(res.body.vendors[0].category).toBe('Logistics');
    });

    it('should search vendors by keyword', async () => {
      const res = await request(app)
        .get('/api/vendors?search=Amazon')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.vendors.length).toBe(1);
      expect(res.body.vendors[0].code).toBe('VEND-AWS-001');
    });
  });

  describe('POST /api/vendors', () => {
    it('should allow Procurement role to create a new vendor', async () => {
      const newVendor = {
        name: 'Datadog Observability Inc.',
        code: 'VEND-DDOG-006',
        category: 'Software/SaaS',
        contactPerson: {
          name: 'Alexis Le-Quoc',
          email: 'alexis@datadoghq.com',
          phone: '+1 (866) 328-2364',
        },
        address: {
          street: '620 8th Ave',
          city: 'New York',
          state: 'NY',
          country: 'USA',
          postalCode: '10018',
        },
        taxId: 'US-274415387',
        status: 'Active',
        performanceRating: 4.7,
        riskScore: 'Low',
        notes: 'Application APM and security monitoring infrastructure.',
      };

      const res = await request(app)
        .post('/api/vendors')
        .set('Authorization', `Bearer ${procurementToken}`)
        .send(newVendor);

      expect(res.status).toBe(201);
      expect(res.body.vendor).toHaveProperty('name', 'Datadog Observability Inc.');
      expect(res.body.vendor).toHaveProperty('code', 'VEND-DDOG-006');
      expect(res.body.vendor.performanceRating).toBe(4.7);

      createdVendorId = res.body.vendor._id;
    });

    it('should prevent duplicate vendor codes', async () => {
      const res = await request(app)
        .post('/api/vendors')
        .set('Authorization', `Bearer ${procurementToken}`)
        .send({
          name: 'Duplicate Datadog',
          code: 'VEND-DDOG-006',
          category: 'Software/SaaS',
          contactPerson: {
            name: 'Test',
            email: 'test@datadoghq.com',
          },
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('ConflictError');
    });

    it('should forbid Legal role from creating vendors', async () => {
      const res = await request(app)
        .post('/api/vendors')
        .set('Authorization', `Bearer ${legalToken}`)
        .send({
          name: 'Unauthorized Vendor',
          code: 'VEND-UNAUTH-007',
          category: 'Software/SaaS',
          contactPerson: { name: 'Test', email: 'test@unauth.com' },
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Forbidden');
    });

    it('should forbid Viewer role from creating vendors', async () => {
      const res = await request(app)
        .post('/api/vendors')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          name: 'Viewer Vendor',
          code: 'VEND-VIEW-008',
          category: 'Software/SaaS',
          contactPerson: { name: 'Test', email: 'test@viewer.com' },
        });

      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/vendors/:id & PATCH /rating', () => {
    it('should allow Procurement to update vendor details', async () => {
      const res = await request(app)
        .put(`/api/vendors/${createdVendorId}`)
        .set('Authorization', `Bearer ${procurementToken}`)
        .send({
          notes: 'Updated monitoring scope to include European clusters.',
          riskScore: 'Medium',
        });

      expect(res.status).toBe(200);
      expect(res.body.vendor.riskScore).toBe('Medium');
      expect(res.body.vendor.notes).toContain('European clusters');
    });

    it('should allow Procurement to update performance rating', async () => {
      const res = await request(app)
        .patch(`/api/vendors/${createdVendorId}/rating`)
        .set('Authorization', `Bearer ${procurementToken}`)
        .send({ rating: 4.9 });

      expect(res.status).toBe(200);
      expect(res.body.vendor.performanceRating).toBe(4.9);
    });

    it('should reject rating values outside 1.0 - 5.0 range', async () => {
      const res = await request(app)
        .patch(`/api/vendors/${createdVendorId}/rating`)
        .set('Authorization', `Bearer ${procurementToken}`)
        .send({ rating: 6.5 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('ValidationError');
    });
  });

  describe('DELETE /api/vendors/:id', () => {
    it('should forbid Procurement from deleting a vendor', async () => {
      const res = await request(app)
        .delete(`/api/vendors/${createdVendorId}`)
        .set('Authorization', `Bearer ${procurementToken}`);

      expect(res.status).toBe(403);
    });

    it('should allow Admin to delete a vendor', async () => {
      const res = await request(app)
        .delete(`/api/vendors/${createdVendorId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('deleted successfully');
    });
  });

  describe('Audit Logging for Vendors', () => {
    it('should record audit logs for vendor creation and deletion', async () => {
      const createLog = await AuditLog.findOne({
        action: 'CREATE',
        entityType: 'Vendor',
        entityId: createdVendorId,
      });
      expect(createLog).toBeDefined();
      expect(createLog?.userEmail).toBe('procurement@clm.local');

      const deleteLog = await AuditLog.findOne({
        action: 'DELETE',
        entityType: 'Vendor',
        entityId: createdVendorId,
      });
      expect(deleteLog).toBeDefined();
      expect(deleteLog?.userEmail).toBe('admin@clm.local');
    });
  });
});
