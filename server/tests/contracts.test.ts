import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import path from 'path';
import fs from 'fs';
import app from '../src/app';
import { connectDB, disconnectDB } from '../src/config/db';
import { seedDatabase } from '../src/utils/seed';
import { AuditLog } from '../src/models/auditLog.model';
import { Vendor } from '../src/models/vendor.model';
import { Contract } from '../src/models/contract.model';

describe('Contracts & State Machine & Document Upload API', () => {
  let adminToken: string;
  let procurementToken: string;
  let viewerToken: string;
  let legalToken: string;
  let sampleVendorId: string;
  let createdContractId: string;
  let createdDocId: string;
  const tempTestFilePath = path.resolve(__dirname, 'test_contract_agreement.txt');

  beforeAll(async () => {
    process.env.USE_MEMORY_DB = 'true';
    await connectDB();
    await seedDatabase();

    // Create temp document for upload testing
    fs.writeFileSync(tempTestFilePath, 'CONFIDENTIAL MASTER SERVICES AGREEMENT TERMS AND CONDITIONS');

    // Acquire tokens
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

    const vendor = await Vendor.findOne();
    sampleVendorId = vendor!._id.toString();
  }, 180000);

  afterAll(async () => {
    if (fs.existsSync(tempTestFilePath)) {
      fs.unlinkSync(tempTestFilePath);
    }
    await disconnectDB();
  });

  describe('GET /api/contracts', () => {
    it('should list all seeded contracts with metrics', async () => {
      const res = await request(app)
        .get('/api/contracts')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('contracts');
      expect(res.body.contracts.length).toBeGreaterThanOrEqual(5);
      expect(res.body.metrics).toBeDefined();
      expect(res.body.metrics.totalContractValue).toBeGreaterThan(0);
      expect(res.body.metrics.activeContracts).toBeGreaterThanOrEqual(1);
    });

    it('should filter contracts by status', async () => {
      const res = await request(app)
        .get('/api/contracts?status=Active')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.contracts.length).toBeGreaterThanOrEqual(1);
      expect(res.body.contracts[0].status).toBe('Active');
    });

    it('should search contracts by keyword', async () => {
      const res = await request(app)
        .get('/api/contracts?search=AWS')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.contracts.length).toBe(1);
      expect(res.body.contracts[0].contractNumber).toBe('CTR-2026-0001');
    });
  });

  describe('POST /api/contracts', () => {
    it('should allow Procurement to create a new Draft contract with auto-generated number', async () => {
      const now = new Date();
      const inOneYear = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

      const res = await request(app)
        .post('/api/contracts')
        .set('Authorization', `Bearer ${procurementToken}`)
        .send({
          title: 'Snowflake Data Cloud Master Agreement',
          description: 'Enterprise data warehouse capacity and compute credits.',
          type: 'MSA',
          vendorId: sampleVendorId,
          value: 75000,
          currency: 'USD',
          startDate: now.toISOString(),
          endDate: inOneYear.toISOString(),
          renewalType: 'Manual Review',
          renewalNoticeDays: 45,
          department: 'Data Engineering',
          tags: ['Data', 'Analytics', 'Snowflake'],
        });

      expect(res.status).toBe(201);
      expect(res.body.contract).toHaveProperty('contractNumber');
      expect(res.body.contract.contractNumber).toMatch(/^CTR-\d{4}-\d{4}$/);
      expect(res.body.contract.status).toBe('Draft');
      expect(res.body.contract.value).toBe(75000);

      createdContractId = res.body.contract._id;
    });

    it('should forbid Viewer from creating contracts', async () => {
      const res = await request(app)
        .post('/api/contracts')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          title: 'Unauthorized Contract',
          type: 'NDA',
          vendorId: sampleVendorId,
          value: 1000,
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
        });

      expect(res.status).toBe(403);
    });
  });

  describe('State Machine Transitions (PATCH /api/contracts/:id/transition)', () => {
    it('should successfully transition contract from Draft to In Review', async () => {
      const res = await request(app)
        .patch(`/api/contracts/${createdContractId}/transition`)
        .set('Authorization', `Bearer ${procurementToken}`)
        .send({ targetStatus: 'In Review', notes: 'Submitted for legal and finance review.' });

      expect(res.status).toBe(200);
      expect(res.body.contract.status).toBe('In Review');
      expect(res.body.allowedTransitions).toContain('Pending Approval');
      expect(res.body.allowedTransitions).toContain('Draft');
    });

    it('should reject invalid transition (In Review -> Active directly without approval)', async () => {
      const res = await request(app)
        .patch(`/api/contracts/${createdContractId}/transition`)
        .set('Authorization', `Bearer ${procurementToken}`)
        .send({ targetStatus: 'Active' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('StateMachineError');
      expect(res.body.message).toContain("Invalid contract status transition from 'In Review' to 'Active'");
    });

    it('should advance from In Review to Pending Approval', async () => {
      const res = await request(app)
        .patch(`/api/contracts/${createdContractId}/transition`)
        .set('Authorization', `Bearer ${procurementToken}`)
        .send({ targetStatus: 'Pending Approval', notes: 'Procurement submits for approval.' });

      expect(res.status).toBe(200);
      expect(res.body.contract.status).toBe('Pending Approval');
    });
  });

  describe('Document Upload & Download', () => {
    it('should upload a contract document and increment version number', async () => {
      const res = await request(app)
        .post(`/api/contracts/${createdContractId}/documents`)
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', tempTestFilePath)
        .field('notes', 'Initial executed version for counter-signing');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('document');
      expect(res.body.document.originalName).toBe('test_contract_agreement.txt');
      expect(res.body.document.version).toBe(1);
      expect(res.body.currentVersion).toBe(1);

      createdDocId = res.body.document.docId;
    });

    it('should download uploaded contract document', async () => {
      const res = await request(app)
        .get(`/api/contracts/${createdContractId}/documents/${createdDocId}/download`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.text).toContain('CONFIDENTIAL MASTER SERVICES AGREEMENT TERMS AND CONDITIONS');
    });
  });

  describe('Contract Deletion Security Rule', () => {
    it('should forbid deletion of non-draft contracts (Pending Approval)', async () => {
      const res = await request(app)
        .delete(`/api/contracts/${createdContractId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('IllegalOperation');
      expect(res.body.message).toContain('Deletion prohibited');
    });

    it('should allow Admin to delete a contract only when it is in Draft status', async () => {
      // Find or create a draft contract
      const draft = await Contract.findOne({ status: 'Draft' });
      expect(draft).toBeDefined();

      const res = await request(app)
        .delete(`/api/contracts/${draft!._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('deleted successfully');
    });
  });

  describe('Audit Logging for Contracts', () => {
    it('should have recorded audit log entries for CREATE and STATUS_TRANSITION', async () => {
      const createLog = await AuditLog.findOne({
        action: 'CREATE',
        entityType: 'Contract',
        entityId: createdContractId,
      });
      expect(createLog).toBeDefined();

      const transitionLog = await AuditLog.findOne({
        action: 'STATUS_TRANSITION',
        entityType: 'Contract',
        entityId: createdContractId,
      });
      expect(transitionLog).toBeDefined();
      expect(transitionLog?.changes?.after?.status).toBe('In Review');
    });
  });
});
