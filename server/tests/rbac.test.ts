/**
 * RBAC Matrix Tests
 * Tests every role against every module for allowed and denied actions.
 * Also validates tier-based approval, record-level ownership, 403 + audit log behavior.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { connectDB, disconnectDB } from '../src/config/db';
import { seedDatabase } from '../src/utils/seed';
import { AuditLog } from '../src/models/auditLog.model';
import { Contract } from '../src/models/contract.model';
import { User } from '../src/models/user.model';
import { Vendor } from '../src/models/vendor.model';

/** Helper: login and get token */
async function getToken(email: string, password: string): Promise<string> {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  if (res.status !== 200) throw new Error(`Login failed for ${email}: ${JSON.stringify(res.body)}`);
  return res.body.token;
}

/**
 * Asserts that:
 * 1. The response has a 403 status
 * 2. An ACCESS_DENIED audit log entry was created for the user
 */
async function expect403WithAuditLog(res: any, userEmail: string): Promise<void> {
  expect(res.status).toBe(403);
  expect(res.body.error).toBe('Forbidden');

  // Verify audit log entry exists
  const auditEntry = await AuditLog.findOne({
    userEmail,
    action: 'ACCESS_DENIED',
  }).sort({ createdAt: -1 });

  expect(auditEntry).not.toBeNull();
  expect(auditEntry?.action).toBe('ACCESS_DENIED');
}

describe('RBAC Permission Matrix', () => {
  let tokens: Record<string, string> = {};
  let sampleVendorId: string;
  let procurementContractId: string; // owned by Procurement user
  let adminContractId: string; // owned by Admin user

  beforeAll(async () => {
    process.env.USE_MEMORY_DB = 'true';
    await connectDB();
    await seedDatabase();

    // Get tokens for all 6 roles
    [
      tokens['admin'] = await getToken('admin@clm.local', 'Admin123!'),
      tokens['legal'] = await getToken('legal@clm.local', 'Legal123!'),
      tokens['procurement'] = await getToken('procurement@clm.local', 'Procure123!'),
      tokens['finance'] = await getToken('finance@clm.local', 'Finance123!'),
      tokens['approver'] = await getToken('approver@clm.local', 'Approve123!'),
      tokens['viewer'] = await getToken('viewer@clm.local', 'Viewer123!'),
    ];

    // Get a vendor for contract creation
    const vendor = await Vendor.findOne();
    sampleVendorId = vendor?._id.toString() || '';

    // Create a contract as Admin
    const adminContractRes = await request(app)
      .post('/api/contracts')
      .set('Authorization', `Bearer ${tokens['admin']}`)
      .send({
        title: 'Admin Test Contract',
        type: 'MSA',
        vendorId: sampleVendorId,
        value: 50000,
        startDate: '2026-01-01',
        endDate: '2027-01-01',
      });
    adminContractId = adminContractRes.body.contract?._id;

    // Create a contract as Procurement
    const procContractRes = await request(app)
      .post('/api/contracts')
      .set('Authorization', `Bearer ${tokens['procurement']}`)
      .send({
        title: 'Procurement Test Contract',
        type: 'NDA',
        vendorId: sampleVendorId,
        value: 10000,
        startDate: '2026-01-01',
        endDate: '2027-01-01',
      });
    procurementContractId = procContractRes.body.contract?._id;
  }, 180000);

  afterAll(async () => {
    await disconnectDB();
  });

  // ===========================================================================
  // MODULE: users
  // ===========================================================================
  describe('Module: users', () => {
    it('Admin can list users', async () => {
      const res = await request(app).get('/api/users').set('Authorization', `Bearer ${tokens['admin']}`);
      expect(res.status).toBe(200);
    });

    it('Viewer cannot list users → 403 + audit log', async () => {
      const res = await request(app).get('/api/users').set('Authorization', `Bearer ${tokens['viewer']}`);
      await expect403WithAuditLog(res, 'viewer@clm.local');
    });

    it('Procurement cannot list users → 403 + audit log', async () => {
      const res = await request(app).get('/api/users').set('Authorization', `Bearer ${tokens['procurement']}`);
      await expect403WithAuditLog(res, 'procurement@clm.local');
    });

    it('Legal cannot list users → 403 + audit log', async () => {
      const res = await request(app).get('/api/users').set('Authorization', `Bearer ${tokens['legal']}`);
      await expect403WithAuditLog(res, 'legal@clm.local');
    });

    it('Finance cannot list users → 403 + audit log', async () => {
      const res = await request(app).get('/api/users').set('Authorization', `Bearer ${tokens['finance']}`);
      await expect403WithAuditLog(res, 'finance@clm.local');
    });

    it('Approver cannot list users → 403 + audit log', async () => {
      const res = await request(app).get('/api/users').set('Authorization', `Bearer ${tokens['approver']}`);
      await expect403WithAuditLog(res, 'approver@clm.local');
    });
  });

  // ===========================================================================
  // MODULE: contracts
  // ===========================================================================
  describe('Module: contracts', () => {
    it('Admin can read all contracts', async () => {
      const res = await request(app).get('/api/contracts').set('Authorization', `Bearer ${tokens['admin']}`);
      expect(res.status).toBe(200);
    });

    it('Legal can read all contracts', async () => {
      const res = await request(app).get('/api/contracts').set('Authorization', `Bearer ${tokens['legal']}`);
      expect(res.status).toBe(200);
    });

    it('Finance can read all contracts', async () => {
      const res = await request(app).get('/api/contracts').set('Authorization', `Bearer ${tokens['finance']}`);
      expect(res.status).toBe(200);
    });

    it('Viewer can read contracts', async () => {
      const res = await request(app).get('/api/contracts').set('Authorization', `Bearer ${tokens['viewer']}`);
      expect(res.status).toBe(200);
    });

    it('Procurement can create a contract', async () => {
      const res = await request(app)
        .post('/api/contracts')
        .set('Authorization', `Bearer ${tokens['procurement']}`)
        .send({
          title: 'Procurement New Contract',
          type: 'SOW',
          vendorId: sampleVendorId,
          value: 5000,
          startDate: '2026-01-01',
          endDate: '2026-12-31',
        });
      expect(res.status).toBe(201);
    });

    it('Legal cannot create a contract → 403 + audit log', async () => {
      const res = await request(app)
        .post('/api/contracts')
        .set('Authorization', `Bearer ${tokens['legal']}`)
        .send({
          title: 'Legal Cannot Create',
          type: 'MSA',
          vendorId: sampleVendorId,
          value: 5000,
          startDate: '2026-01-01',
          endDate: '2026-12-31',
        });
      await expect403WithAuditLog(res, 'legal@clm.local');
    });

    it('Finance cannot create a contract → 403 + audit log', async () => {
      const res = await request(app)
        .post('/api/contracts')
        .set('Authorization', `Bearer ${tokens['finance']}`)
        .send({
          title: 'Finance Cannot Create',
          type: 'MSA',
          vendorId: sampleVendorId,
          value: 5000,
          startDate: '2026-01-01',
          endDate: '2026-12-31',
        });
      await expect403WithAuditLog(res, 'finance@clm.local');
    });

    it('Viewer cannot create a contract → 403 + audit log', async () => {
      const res = await request(app)
        .post('/api/contracts')
        .set('Authorization', `Bearer ${tokens['viewer']}`)
        .send({
          title: 'Viewer Cannot Create',
          type: 'MSA',
          vendorId: sampleVendorId,
          value: 5000,
          startDate: '2026-01-01',
          endDate: '2026-12-31',
        });
      await expect403WithAuditLog(res, 'viewer@clm.local');
    });

    it('Approver cannot create a contract → 403 + audit log', async () => {
      const res = await request(app)
        .post('/api/contracts')
        .set('Authorization', `Bearer ${tokens['approver']}`)
        .send({
          title: 'Approver Cannot Create',
          type: 'MSA',
          vendorId: sampleVendorId,
          value: 5000,
          startDate: '2026-01-01',
          endDate: '2026-12-31',
        });
      await expect403WithAuditLog(res, 'approver@clm.local');
    });
  });

  // ===========================================================================
  // RECORD-LEVEL OWNERSHIP: Procurement
  // ===========================================================================
  describe('Record-level ownership: Procurement', () => {
    it('Procurement can update their own Draft contract', async () => {
      const res = await request(app)
        .put(`/api/contracts/${procurementContractId}`)
        .set('Authorization', `Bearer ${tokens['procurement']}`)
        .send({ title: 'Updated by Procurement' });
      expect(res.status).toBe(200);
    });

    it('Procurement cannot update a contract they do not own → 403', async () => {
      const res = await request(app)
        .put(`/api/contracts/${adminContractId}`)
        .set('Authorization', `Bearer ${tokens['procurement']}`)
        .send({ title: 'Procurement tries to update Admin contract' });
      expect(res.status).toBe(403);
    });

    it('Procurement cannot delete a contract they do not own → 403', async () => {
      const res = await request(app)
        .delete(`/api/contracts/${adminContractId}`)
        .set('Authorization', `Bearer ${tokens['procurement']}`);
      expect(res.status).toBe(403);
    });

    it('Admin can update any contract regardless of owner', async () => {
      const res = await request(app)
        .put(`/api/contracts/${procurementContractId}`)
        .set('Authorization', `Bearer ${tokens['admin']}`)
        .send({ title: 'Admin Can Update Any Contract' });
      expect(res.status).toBe(200);
    });
  });

  // ===========================================================================
  // MODULE: vendors
  // ===========================================================================
  describe('Module: vendors', () => {
    it('Admin can read vendors', async () => {
      const res = await request(app).get('/api/vendors').set('Authorization', `Bearer ${tokens['admin']}`);
      expect(res.status).toBe(200);
    });

    it('Procurement can create a vendor', async () => {
      const res = await request(app)
        .post('/api/vendors')
        .set('Authorization', `Bearer ${tokens['procurement']}`)
        .send({
          name: 'RBAC Test Vendor',
          code: 'RBAC-001',
          category: 'Software/SaaS',
          contactPerson: { name: 'Test Person', email: 'test@vendor.com' },
        });
      expect(res.status).toBe(201);
    });

    it('Legal cannot create a vendor → 403 + audit log', async () => {
      const res = await request(app)
        .post('/api/vendors')
        .set('Authorization', `Bearer ${tokens['legal']}`)
        .send({ name: 'Illegal Vendor', code: 'ILLEGAL-001', category: 'Software/SaaS', contactPerson: { name: 'T', email: 't@t.com' } });
      await expect403WithAuditLog(res, 'legal@clm.local');
    });

    it('Viewer cannot create a vendor → 403 + audit log', async () => {
      const res = await request(app)
        .post('/api/vendors')
        .set('Authorization', `Bearer ${tokens['viewer']}`)
        .send({ name: 'Viewer Vendor', code: 'VIEW-001', category: 'Software/SaaS', contactPerson: { name: 'T', email: 't@t.com' } });
      await expect403WithAuditLog(res, 'viewer@clm.local');
    });

    it('Procurement cannot blacklist (suspend) a vendor → 403', async () => {
      const vendor = await Vendor.findOne();
      const res = await request(app)
        .put(`/api/vendors/${vendor?._id}`)
        .set('Authorization', `Bearer ${tokens['procurement']}`)
        .send({ status: 'Suspended' });
      // The vendor controller blocks Procurement from setting Suspended
      expect(res.status).toBe(403);
    });
  });

  // ===========================================================================
  // MODULE: audit-logs
  // ===========================================================================
  describe('Module: audit-logs', () => {
    it('Admin can read audit logs', async () => {
      const res = await request(app).get('/api/audit-logs').set('Authorization', `Bearer ${tokens['admin']}`);
      expect(res.status).toBe(200);
    });

    it('Viewer can read audit logs', async () => {
      const res = await request(app).get('/api/audit-logs').set('Authorization', `Bearer ${tokens['viewer']}`);
      expect(res.status).toBe(200);
    });

    it('Procurement cannot read audit logs → 403 + audit log', async () => {
      const res = await request(app).get('/api/audit-logs').set('Authorization', `Bearer ${tokens['procurement']}`);
      await expect403WithAuditLog(res, 'procurement@clm.local');
    });

    it('Legal cannot read audit logs → 403 + audit log', async () => {
      const res = await request(app).get('/api/audit-logs').set('Authorization', `Bearer ${tokens['legal']}`);
      await expect403WithAuditLog(res, 'legal@clm.local');
    });

    it('Finance cannot read audit logs → 403 + audit log', async () => {
      const res = await request(app).get('/api/audit-logs').set('Authorization', `Bearer ${tokens['finance']}`);
      await expect403WithAuditLog(res, 'finance@clm.local');
    });
  });

  // ===========================================================================
  // MODULE: compliance
  // ===========================================================================
  describe('Module: compliance', () => {
    it('Admin can trigger compliance sweep', async () => {
      const res = await request(app)
        .post('/api/compliance/sweep')
        .set('Authorization', `Bearer ${tokens['admin']}`);
      expect(res.status).toBe(200);
    });

    it('Procurement cannot trigger sweep → 403 + audit log', async () => {
      const res = await request(app)
        .post('/api/compliance/sweep')
        .set('Authorization', `Bearer ${tokens['procurement']}`);
      await expect403WithAuditLog(res, 'procurement@clm.local');
    });

    it('Legal cannot trigger sweep → 403 + audit log (sweep is reminder-jobs:run-job)', async () => {
      const res = await request(app)
        .post('/api/compliance/sweep')
        .set('Authorization', `Bearer ${tokens['legal']}`);
      await expect403WithAuditLog(res, 'legal@clm.local');
    });

    it('Viewer can read compliance radar', async () => {
      const res = await request(app).get('/api/compliance/radar').set('Authorization', `Bearer ${tokens['viewer']}`);
      expect(res.status).toBe(200);
    });

    it('Legal can create a compliance item', async () => {
      const res = await request(app)
        .post(`/api/compliance/contracts/${adminContractId}/items`)
        .set('Authorization', `Bearer ${tokens['legal']}`)
        .send({ title: 'Legal adds compliance item', status: 'Pending Review' });
      expect(res.status).toBe(201);
    });

    it('Viewer cannot create compliance items → 403 + audit log', async () => {
      const res = await request(app)
        .post(`/api/compliance/contracts/${adminContractId}/items`)
        .set('Authorization', `Bearer ${tokens['viewer']}`)
        .send({ title: 'Viewer tries compliance item', status: 'Pending Review' });
      await expect403WithAuditLog(res, 'viewer@clm.local');
    });
  });

  // ===========================================================================
  // MODULE: approvals (initiation by Procurement)
  // ===========================================================================
  describe('Module: approvals — initiation', () => {
    it('Procurement can submit their own contract for approval', async () => {
      const res = await request(app)
        .post('/api/approvals')
        .set('Authorization', `Bearer ${tokens['procurement']}`)
        .send({ contractId: procurementContractId });
      // Should succeed or already in progress
      expect([201, 409]).toContain(res.status);
    });

    it('Viewer cannot initiate approval workflow → 403 + audit log', async () => {
      const res = await request(app)
        .post('/api/approvals')
        .set('Authorization', `Bearer ${tokens['viewer']}`)
        .send({ contractId: adminContractId });
      await expect403WithAuditLog(res, 'viewer@clm.local');
    });

    it('Viewer cannot take approval action → 403 + audit log', async () => {
      // Use a fake but valid-format ID; result should be 403 before reaching DB
      const res = await request(app)
        .patch('/api/approvals/000000000000000000000001/action')
        .set('Authorization', `Bearer ${tokens['viewer']}`)
        .send({ action: 'Approve' });
      await expect403WithAuditLog(res, 'viewer@clm.local');
    });
  });

  // ===========================================================================
  // TIER-BASED APPROVAL SEQUENCE
  // ===========================================================================
  describe('Tier-based approval sequence', () => {
    let tier3ContractId: string;
    let workflowId: string;

    it('Admin creates a Tier-3 contract (>$100k)', async () => {
      const res = await request(app)
        .post('/api/contracts')
        .set('Authorization', `Bearer ${tokens['admin']}`)
        .send({
          title: 'Tier-3 High Value Contract',
          type: 'MSA',
          vendorId: sampleVendorId,
          value: 150000,
          startDate: '2026-01-01',
          endDate: '2027-01-01',
        });
      expect(res.status).toBe(201);
      tier3ContractId = res.body.contract._id;
    });

    it('Admin initiates approval workflow for Tier-3 contract — creates 3 steps', async () => {
      const res = await request(app)
        .post('/api/approvals')
        .set('Authorization', `Bearer ${tokens['admin']}`)
        .send({ contractId: tier3ContractId });
      expect(res.status).toBe(201);
      workflowId = res.body.workflow._id;
      expect(res.body.workflow.steps).toHaveLength(3);
      expect(res.body.workflow.steps[0].roleRequired).toBe('Legal');
      expect(res.body.workflow.steps[1].roleRequired).toBe('Finance');
      expect(res.body.workflow.steps[2].roleRequired).toBe('Approver');
    });

    it('Finance cannot act on step 1 (Legal step) → ApprovalError 403', async () => {
      const res = await request(app)
        .patch(`/api/approvals/${workflowId}/action`)
        .set('Authorization', `Bearer ${tokens['finance']}`)
        .send({ action: 'Approve', comments: 'Finance acting on Legal step' });
      expect(res.status).toBe(403);
    });

    it('Approver cannot act on step 1 (Legal step) → ApprovalError 403', async () => {
      const res = await request(app)
        .patch(`/api/approvals/${workflowId}/action`)
        .set('Authorization', `Bearer ${tokens['approver']}`)
        .send({ action: 'Approve', comments: 'Approver acting on Legal step' });
      expect(res.status).toBe(403);
    });

    it('Legal approves step 1', async () => {
      const res = await request(app)
        .patch(`/api/approvals/${workflowId}/action`)
        .set('Authorization', `Bearer ${tokens['legal']}`)
        .send({ action: 'Approve', comments: 'Legal approved' });
      expect(res.status).toBe(200);
      expect(res.body.workflow.currentStepIndex).toBe(1);
    });

    it('Legal cannot act on step 2 (Finance step) → ApprovalError 403', async () => {
      const res = await request(app)
        .patch(`/api/approvals/${workflowId}/action`)
        .set('Authorization', `Bearer ${tokens['legal']}`)
        .send({ action: 'Approve', comments: 'Legal acting on Finance step' });
      expect(res.status).toBe(403);
    });

    it('Finance approves step 2', async () => {
      const res = await request(app)
        .patch(`/api/approvals/${workflowId}/action`)
        .set('Authorization', `Bearer ${tokens['finance']}`)
        .send({ action: 'Approve', comments: 'Finance approved' });
      expect(res.status).toBe(200);
      expect(res.body.workflow.currentStepIndex).toBe(2);
    });

    it('Rejection requires a comment — Approver rejects without comment → 400', async () => {
      const res = await request(app)
        .patch(`/api/approvals/${workflowId}/action`)
        .set('Authorization', `Bearer ${tokens['approver']}`)
        .send({ action: 'Reject' }); // missing comments
      expect(res.status).toBe(400);
    });

    it('Approver provides final Tier-3 approval → workflow Approved', async () => {
      const res = await request(app)
        .patch(`/api/approvals/${workflowId}/action`)
        .set('Authorization', `Bearer ${tokens['approver']}`)
        .send({ action: 'Approve', comments: 'Executive approval granted' });
      expect(res.status).toBe(200);
      expect(res.body.workflow.status).toBe('Approved');
      expect(res.body.contract.status).toBe('Approved');
    });
  });

  // ===========================================================================
  // LOGIN RESPONSE: permissions + demoMode
  // ===========================================================================
  describe('Login response includes permissions and demoMode', () => {
    it('Admin login returns full permissions map and demoMode', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@clm.local', password: 'Admin123!' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('permissions');
      expect(res.body).toHaveProperty('demoMode');
      expect(res.body.permissions).toHaveProperty('contracts');
      expect(res.body.permissions.contracts).toContain('create');
    });

    it('Viewer login permissions do NOT include contracts:create or export', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'viewer@clm.local', password: 'Viewer123!' });
      expect(res.status).toBe(200);
      expect(res.body.permissions.contracts).not.toContain('create');
      expect(res.body.permissions.contracts).not.toContain('export');
      expect(res.body.permissions['audit-logs']).toContain('read');
      // Viewer cannot export audit logs
      expect(res.body.permissions['audit-logs']).not.toContain('export');
    });

    it('Procurement login permissions include contracts:submit but not audit-logs:read', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'procurement@clm.local', password: 'Procure123!' });
      expect(res.status).toBe(200);
      expect(res.body.permissions.contracts).toContain('submit');
      expect(res.body.permissions['audit-logs']).toBeUndefined();
    });

    it('Legal login permissions include compliance:create but not contracts:create', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'legal@clm.local', password: 'Legal123!' });
      expect(res.status).toBe(200);
      expect(res.body.permissions.compliance).toContain('create');
      expect(res.body.permissions.contracts).not.toContain('create');
    });
  });

  // ===========================================================================
  // SETTINGS MODULE: Admin-only
  // ===========================================================================
  describe('Module: settings', () => {
    it('Admin can read system settings', async () => {
      const res = await request(app).get('/api/settings').set('Authorization', `Bearer ${tokens['admin']}`);
      expect(res.status).toBe(200);
    });

    it('Procurement cannot read settings → 403 + audit log', async () => {
      const res = await request(app).get('/api/settings').set('Authorization', `Bearer ${tokens['procurement']}`);
      await expect403WithAuditLog(res, 'procurement@clm.local');
    });

    it('Legal cannot update settings → 403 + audit log', async () => {
      const res = await request(app)
        .patch('/api/settings')
        .set('Authorization', `Bearer ${tokens['legal']}`)
        .send({ tier1Threshold: 10000 });
      await expect403WithAuditLog(res, 'legal@clm.local');
    });

    it('Admin can update tier thresholds via settings', async () => {
      const res = await request(app)
        .patch('/api/settings')
        .set('Authorization', `Bearer ${tokens['admin']}`)
        .send({ tier1Threshold: 30000, tier2Threshold: 120000 });
      expect(res.status).toBe(200);
      expect(res.body.settings.tier1Threshold).toBe(30000);
    });
  });

  // ===========================================================================
  // Unauthenticated requests
  // ===========================================================================
  describe('Unauthenticated requests', () => {
    it('Request without token returns 401', async () => {
      const res = await request(app).get('/api/contracts');
      expect(res.status).toBe(401);
    });

    it('Request with invalid token returns 401', async () => {
      const res = await request(app)
        .get('/api/contracts')
        .set('Authorization', 'Bearer invalid_token_here');
      expect(res.status).toBe(401);
    });
  });
});
