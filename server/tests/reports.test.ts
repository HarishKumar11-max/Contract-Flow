import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { connectDB, disconnectDB } from '../src/config/db';
import { seedDatabase } from '../src/utils/seed';
import { AuditLog } from '../src/models/auditLog.model';
import { Contract } from '../src/models/contract.model';
import { Vendor } from '../src/models/vendor.model';

async function getToken(email: string, password: string): Promise<string> {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  if (res.status !== 200) throw new Error(`Login failed for ${email}`);
  return res.body.token;
}

describe('Phase 7 — Executive Reports, Analytics Export & Audit Log Governance', () => {
  let adminToken: string;
  let legalToken: string;
  let procurementToken: string;
  let financeToken: string;
  let approverToken: string;
  let viewerToken: string;

  beforeAll(async () => {
    process.env.USE_MEMORY_DB = 'true';
    await connectDB();
    await seedDatabase();

    [
      adminToken = await getToken('admin@clm.local', 'Admin123!'),
      legalToken = await getToken('legal@clm.local', 'Legal123!'),
      procurementToken = await getToken('procurement@clm.local', 'Procure123!'),
      financeToken = await getToken('finance@clm.local', 'Finance123!'),
      approverToken = await getToken('approver@clm.local', 'Approve123!'),
      viewerToken = await getToken('viewer@clm.local', 'Viewer123!'),
    ];
  }, 180000);

  afterAll(async () => {
    await disconnectDB();
  });

  // ===========================================================================
  // 1. Executive Analytics (GET /api/reports/analytics)
  // ===========================================================================
  describe('1. Executive Analytics (GET /api/reports/analytics)', () => {
    it('allows Admin to fetch executive analytics', async () => {
      const res = await request(app)
        .get('/api/reports/analytics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('summary');
      expect(res.body.summary).toHaveProperty('totalContracts');
      expect(res.body.summary).toHaveProperty('totalSpend');
      expect(res.body.summary).toHaveProperty('activeVendors');
      expect(res.body).toHaveProperty('byStatus');
      expect(res.body).toHaveProperty('byType');
      expect(res.body).toHaveProperty('byDepartment');
      expect(res.body).toHaveProperty('monthlyTrend');
      expect(Array.isArray(res.body.byStatus)).toBe(true);
      expect(Array.isArray(res.body.byDepartment)).toBe(true);
    });

    it('allows Finance to access spend analytics', async () => {
      const res = await request(app)
        .get('/api/reports/analytics')
        .set('Authorization', `Bearer ${financeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.summary.totalSpend).toBeGreaterThanOrEqual(0);
    });

    it('allows Legal to access analytics', async () => {
      const res = await request(app)
        .get('/api/reports/analytics')
        .set('Authorization', `Bearer ${legalToken}`);

      expect(res.status).toBe(200);
    });

    it('allows Procurement to access analytics', async () => {
      const res = await request(app)
        .get('/api/reports/analytics')
        .set('Authorization', `Bearer ${procurementToken}`);

      expect(res.status).toBe(200);
    });

    it('allows Approver to access analytics', async () => {
      const res = await request(app)
        .get('/api/reports/analytics')
        .set('Authorization', `Bearer ${approverToken}`);

      expect(res.status).toBe(200);
    });

    it('forbids Viewer from accessing reports analytics (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/reports/analytics')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Forbidden');

      // Verify denied access written to audit log
      const deniedLog = await AuditLog.findOne({
        userEmail: 'viewer@clm.local',
        action: 'ACCESS_DENIED',
      }).sort({ timestamp: -1 });

      expect(deniedLog).not.toBeNull();
    });
  });

  // ===========================================================================
  // 2. Contracts Export (CSV and PDF)
  // ===========================================================================
  describe('2. Contracts Export (CSV and PDF)', () => {
    it('allows Admin to export contracts as CSV', async () => {
      const res = await request(app)
        .get('/api/reports/contracts/export?format=csv')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.headers['content-disposition']).toContain('attachment');
      expect(res.text).toContain('Contract Number');
      expect(res.text).toContain('CTR-2026-');

      // Verify audit log
      const exportLog = await AuditLog.findOne({
        userEmail: 'admin@clm.local',
        action: 'EXPORT',
        entityType: 'Contract',
      }).sort({ timestamp: -1 });

      expect(exportLog).not.toBeNull();
      expect(exportLog?.changes?.after?.format).toBe('csv');
    });

    it('allows Admin to export contracts as PDF', async () => {
      const res = await request(app)
        .get('/api/reports/contracts/export?format=pdf')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/pdf');
      expect(res.headers['content-disposition']).toContain('attachment');
      expect(res.body).toBeDefined();

      // Verify audit log for PDF export
      const pdfExportLog = await AuditLog.findOne({
        userEmail: 'admin@clm.local',
        action: 'EXPORT',
        entityType: 'Contract',
      }).sort({ timestamp: -1 });

      expect(pdfExportLog?.changes?.after?.format).toBe('pdf');
    });

    it('allows Procurement to export their own contracts as CSV', async () => {
      const res = await request(app)
        .get('/api/reports/contracts/export?format=csv')
        .set('Authorization', `Bearer ${procurementToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
    });

    it('forbids Viewer from exporting contracts (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/reports/contracts/export?format=csv')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ===========================================================================
  // 3. Vendors and Approvals Export
  // ===========================================================================
  describe('3. Vendors and Approvals Export', () => {
    it('allows Admin to export vendors as CSV', async () => {
      const res = await request(app)
        .get('/api/reports/vendors/export?format=csv')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('Name');
      expect(res.text).toContain('Code');
      expect(res.text).toContain('Category');
    });

    it('allows Admin to export approvals workflow history as CSV', async () => {
      const res = await request(app)
        .get('/api/reports/approvals/export?format=csv')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('Contract Number');
      expect(res.text).toContain('Workflow Status');
    });

    it('forbids Viewer from exporting vendors or approvals', async () => {
      const resVendor = await request(app)
        .get('/api/reports/vendors/export?format=csv')
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(resVendor.status).toBe(403);

      const resApproval = await request(app)
        .get('/api/reports/approvals/export?format=csv')
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(resApproval.status).toBe(403);
    });
  });

  // ===========================================================================
  // 4. Audit Log Querying & Filtering (GET /api/audit-logs)
  // ===========================================================================
  describe('4. Audit Log Querying & Filtering', () => {
    it('allows Admin to list audit logs with pagination', async () => {
      const res = await request(app)
        .get('/api/audit-logs?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('logs');
      expect(res.body).toHaveProperty('pagination');
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(10);
      expect(res.body.logs.length).toBeGreaterThan(0);
    });

    it('allows Viewer (Auditor) to view audit logs in read-only mode', async () => {
      const res = await request(app)
        .get('/api/audit-logs')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.logs.length).toBeGreaterThan(0);
    });

    it('forbids Procurement and Legal from reading audit logs', async () => {
      const resProc = await request(app)
        .get('/api/audit-logs')
        .set('Authorization', `Bearer ${procurementToken}`);
      expect(resProc.status).toBe(403);

      const resLegal = await request(app)
        .get('/api/audit-logs')
        .set('Authorization', `Bearer ${legalToken}`);
      expect(resLegal.status).toBe(403);
    });

    it('filters audit logs by action (e.g. EXPORT)', async () => {
      const res = await request(app)
        .get('/api/audit-logs?action=EXPORT')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      res.body.logs.forEach((log: any) => {
        expect(log.action).toBe('EXPORT');
      });
    });

    it('filters audit logs by entityType (e.g. Contract)', async () => {
      const res = await request(app)
        .get('/api/audit-logs?entityType=Contract')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      res.body.logs.forEach((log: any) => {
        expect(log.entityType).toBe('Contract');
      });
    });

    it('filters audit logs by date range', async () => {
      const today = new Date().toISOString().split('T')[0];
      const res = await request(app)
        .get(`/api/audit-logs?startDate=${today}&endDate=${today}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.logs.length).toBeGreaterThan(0);
    });

    it('searches audit logs by free text keyword', async () => {
      const res = await request(app)
        .get('/api/audit-logs?search=admin@clm.local')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      res.body.logs.forEach((log: any) => {
        const matches =
          log.userEmail.includes('admin@clm.local') ||
          log.userRole.toLowerCase().includes('admin');
        expect(matches).toBe(true);
      });
    });
  });

  // ===========================================================================
  // 5. Audit Log CSV Export (GET /api/audit-logs/export)
  // ===========================================================================
  describe('5. Audit Log CSV Export (GET /api/audit-logs/export)', () => {
    it('allows Admin to export audit logs as CSV', async () => {
      const res = await request(app)
        .get('/api/audit-logs/export')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.headers['content-disposition']).toContain('attachment');
      expect(res.text).toContain('User Email');
      expect(res.text).toContain('Action');
      expect(res.text).toContain('Entity Type');
    });

    it('strictly forbids Viewer from exporting audit logs (Viewer is read-only)', async () => {
      const res = await request(app)
        .get('/api/audit-logs/export')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Forbidden');
    });

    it('strictly forbids Procurement from exporting audit logs (403)', async () => {
      const res = await request(app)
        .get('/api/audit-logs/export')
        .set('Authorization', `Bearer ${procurementToken}`);

      expect(res.status).toBe(403);
    });
  });
});
