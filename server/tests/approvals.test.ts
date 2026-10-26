import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { connectDB, disconnectDB } from '../src/config/db';
import { seedDatabase } from '../src/utils/seed';
import { Contract } from '../src/models/contract.model';
import { Vendor } from '../src/models/vendor.model';
import { ApprovalWorkflow } from '../src/models/approval.model';

describe('Approval Workflow & Multi-Stage Matrix API', () => {
  let adminToken: string;
  let legalToken: string;
  let financeToken: string;
  let approverToken: string;
  let procurementToken: string;
  let viewerToken: string;

  let smallContractId: string; // < $25k (Tier 1: 1 step)
  let midContractId: string; // $25k - $100k (Tier 2: 2 steps)
  let largeContractId: string; // > $100k (Tier 3: 3 steps)
  let rejectContractId: string; // for rejection testing

  beforeAll(async () => {
    process.env.USE_MEMORY_DB = 'true';
    await connectDB();
    await seedDatabase();

    // Login users
    const [adminRes, legalRes, financeRes, approverRes, procRes, viewerRes] = await Promise.all([
      request(app).post('/api/auth/login').send({ email: 'admin@clm.local', password: 'Admin123!' }),
      request(app).post('/api/auth/login').send({ email: 'legal@clm.local', password: 'Legal123!' }),
      request(app).post('/api/auth/login').send({ email: 'finance@clm.local', password: 'Finance123!' }),
      request(app).post('/api/auth/login').send({ email: 'approver@clm.local', password: 'Approve123!' }),
      request(app).post('/api/auth/login').send({ email: 'procurement@clm.local', password: 'Procure123!' }),
      request(app).post('/api/auth/login').send({ email: 'viewer@clm.local', password: 'Viewer123!' }),
    ]);

    adminToken = adminRes.body.token;
    legalToken = legalRes.body.token;
    financeToken = financeRes.body.token;
    approverToken = approverRes.body.token;
    procurementToken = procRes.body.token;
    viewerToken = viewerRes.body.token;

    const vendor = await Vendor.findOne();
    const vendorId = vendor!._id.toString();

    // Create 4 test contracts with various values for tier testing
    // 1. Small contract: $15,000 (< $25k) -> Tier 1 (1 step: Legal)
    const smallRes = await request(app)
      .post('/api/contracts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Office Cloud Subscription',
        type: 'License',
        vendorId,
        value: 15000,
        currency: 'USD',
        startDate: '2026-02-01',
        endDate: '2027-02-01',
        renewalType: 'Auto-Renew',
        department: 'IT',
      });
    smallContractId = smallRes.body.contract._id;

    // 2. Mid contract: $60,000 ($25k - $100k) -> Tier 2 (2 steps: Legal, Finance)
    const midRes = await request(app)
      .post('/api/contracts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Network Hardware Maintenance',
        type: 'SOW',
        vendorId,
        value: 60000,
        currency: 'USD',
        startDate: '2026-02-01',
        endDate: '2027-02-01',
        renewalType: 'Manual Review',
        department: 'Operations',
      });
    midContractId = midRes.body.contract._id;

    // 3. Large contract: $150,000 (> $100k) -> Tier 3 (3 steps: Legal, Finance, Approver)
    const largeRes = await request(app)
      .post('/api/contracts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Strategic Logistics Haulage Master Agreement',
        type: 'MSA',
        vendorId,
        value: 150000,
        currency: 'USD',
        startDate: '2026-03-01',
        endDate: '2027-03-01',
        renewalType: 'Auto-Renew',
        department: 'Supply Chain',
      });
    largeContractId = largeRes.body.contract._id;

    // 4. Contract for Rejection testing
    const rejectRes = await request(app)
      .post('/api/contracts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Experimental AI Sandbox Pilot',
        type: 'Other',
        vendorId,
        value: 30000,
        currency: 'USD',
        startDate: '2026-04-01',
        endDate: '2026-10-01',
        renewalType: 'Manual Review',
        department: 'R&D',
      });
    rejectContractId = rejectRes.body.contract._id;
  }, 180000);

  afterAll(async () => {
    await disconnectDB();
  });

  describe('1. Workflow Initiation & Tiered Matrix Calculation', () => {
    it('initiates Tier 1 workflow (<$25k) with 1 step (Legal)', async () => {
      const res = await request(app)
        .post('/api/approvals')
        .set('Authorization', `Bearer ${procurementToken}`)
        .send({ contractId: smallContractId });

      expect(res.status).toBe(201);
      expect(res.body.workflow).toBeDefined();
      expect(res.body.workflow.status).toBe('In Progress');
      expect(res.body.workflow.steps).toHaveLength(1);
      expect(res.body.workflow.steps[0].roleRequired).toBe('Legal');
      expect(res.body.workflow.steps[0].status).toBe('Pending');

      // Contract status must be transitioned to Pending Approval
      const contract = await Contract.findById(smallContractId);
      expect(contract?.status).toBe('Pending Approval');
    });

    it('initiates Tier 2 workflow ($25k-$100k) with 2 steps (Legal -> Finance)', async () => {
      const res = await request(app)
        .post('/api/approvals')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ contractId: midContractId });

      expect(res.status).toBe(201);
      expect(res.body.workflow.steps).toHaveLength(2);
      expect(res.body.workflow.steps[0].roleRequired).toBe('Legal');
      expect(res.body.workflow.steps[1].roleRequired).toBe('Finance');
    });

    it('initiates Tier 3 workflow (>$100k) with 3 steps (Legal -> Finance -> Approver)', async () => {
      const res = await request(app)
        .post('/api/approvals')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ contractId: largeContractId });

      expect(res.status).toBe(201);
      expect(res.body.workflow.steps).toHaveLength(3);
      expect(res.body.workflow.steps[0].roleRequired).toBe('Legal');
      expect(res.body.workflow.steps[1].roleRequired).toBe('Finance');
      expect(res.body.workflow.steps[2].roleRequired).toBe('Approver');
    });

    it('rejects duplicate initiation with 409 Conflict when workflow already in progress', async () => {
      const res = await request(app)
        .post('/api/approvals')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ contractId: largeContractId });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('ApprovalError');
      expect(res.body.message).toContain('already in progress');
    });

    it('rejects initiation by unauthorized role (Viewer) with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/approvals')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ contractId: rejectContractId });

      expect(res.status).toBe(403);
    });

    it('returns 400 when contractId is missing', async () => {
      const res = await request(app)
        .post('/api/approvals')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('contractId is required');
    });
  });

  describe('2. Approvals Inbox & Role Filtering', () => {
    it('returns pending workflows for Legal user', async () => {
      const res = await request(app)
        .get('/api/approvals/inbox')
        .set('Authorization', `Bearer ${legalToken}`);

      expect(res.status).toBe(200);
      expect(res.body.count).toBeGreaterThanOrEqual(1);
      // All returned items must have current step role as Legal
      res.body.workflows.forEach((wf: any) => {
        expect(wf.steps[wf.currentStepIndex].roleRequired).toBe('Legal');
      });
    });

    it('returns empty or non-legal workflows for Approver at Step 0', async () => {
      const res = await request(app)
        .get('/api/approvals/inbox')
        .set('Authorization', `Bearer ${approverToken}`);

      expect(res.status).toBe(200);
      // None of the workflows are currently on step 3 (Approver)
      expect(res.body.workflows.filter((wf: any) => wf.steps[wf.currentStepIndex].roleRequired === 'Approver')).toHaveLength(0);
    });

    it('returns all in-progress workflows for Admin in inbox', async () => {
      const res = await request(app)
        .get('/api/approvals/inbox')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.count).toBeGreaterThanOrEqual(3);
    });
  });

  describe('3. Role Authorization & Step Enforcement', () => {
    let largeWorkflowId: string;

    beforeAll(async () => {
      const wf = await ApprovalWorkflow.findOne({ contractId: largeContractId, status: 'In Progress' });
      largeWorkflowId = wf!._id.toString();
    });

    it('blocks Finance from approving step 1 when Legal is required (403 Forbidden)', async () => {
      const res = await request(app)
        .patch(`/api/approvals/${largeWorkflowId}/action`)
        .set('Authorization', `Bearer ${financeToken}`)
        .send({ action: 'Approve', comments: 'Finance jumping ahead' });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('not authorized');
      expect(res.body.message).toContain('Required: \'Legal\'');
    });

    it('blocks Approver from approving step 1 when Legal is required (403 Forbidden)', async () => {
      const res = await request(app)
        .patch(`/api/approvals/${largeWorkflowId}/action`)
        .set('Authorization', `Bearer ${approverToken}`)
        .send({ action: 'Approve' });

      expect(res.status).toBe(403);
    });

    it('allows Legal to approve step 1 and advances currentStepIndex to 1 (Finance)', async () => {
      const res = await request(app)
        .patch(`/api/approvals/${largeWorkflowId}/action`)
        .set('Authorization', `Bearer ${legalToken}`)
        .send({ action: 'Approve', comments: 'Legal review cleared without reservations.' });

      expect(res.status).toBe(200);
      expect(res.body.workflow.currentStepIndex).toBe(1);
      expect(res.body.workflow.steps[0].status).toBe('Approved');
      expect(res.body.workflow.steps[0].comments).toBe('Legal review cleared without reservations.');
      expect(res.body.workflow.status).toBe('In Progress');
    });

    it('now allows Finance to act on step 2', async () => {
      const res = await request(app)
        .patch(`/api/approvals/${largeWorkflowId}/action`)
        .set('Authorization', `Bearer ${financeToken}`)
        .send({ action: 'Approve', comments: 'Budget allocated in FY26 Q1.' });

      expect(res.status).toBe(200);
      expect(res.body.workflow.currentStepIndex).toBe(2);
      expect(res.body.workflow.steps[1].status).toBe('Approved');
    });

    it('Admin override allows Admin to complete the final step (Approver step)', async () => {
      const res = await request(app)
        .patch(`/api/approvals/${largeWorkflowId}/action`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ action: 'Approve', comments: 'Executive sign-off confirmed by Admin override.' });

      expect(res.status).toBe(200);
      expect(res.body.workflow.status).toBe('Approved');
      expect(res.body.workflow.steps[2].status).toBe('Approved');

      // Check contract status is now Approved
      const updatedContract = await Contract.findById(largeContractId);
      expect(updatedContract?.status).toBe('Approved');
    });
  });

  describe('4. Mandatory Rejection Comments & Contract State Propagation', () => {
    let rejectWorkflowId: string;

    beforeAll(async () => {
      // Initiate workflow for rejectContractId
      const initRes = await request(app)
        .post('/api/approvals')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ contractId: rejectContractId });
      rejectWorkflowId = initRes.body.workflow._id;
    });

    it('rejects rejection action when comments are missing or whitespace (400 Bad Request)', async () => {
      const res = await request(app)
        .patch(`/api/approvals/${rejectWorkflowId}/action`)
        .set('Authorization', `Bearer ${legalToken}`)
        .send({ action: 'Reject', comments: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('mandatory');
    });

    it('successfully processes rejection with comments and transitions contract to Rejected', async () => {
      const rejectionReason = 'Indemnity clause 14.2 uncapped liability is unacceptable under corporate governance guidelines.';
      const res = await request(app)
        .patch(`/api/approvals/${rejectWorkflowId}/action`)
        .set('Authorization', `Bearer ${legalToken}`)
        .send({ action: 'Reject', comments: rejectionReason });

      expect(res.status).toBe(200);
      expect(res.body.workflow.status).toBe('Rejected');
      expect(res.body.workflow.steps[0].status).toBe('Rejected');
      expect(res.body.workflow.steps[0].comments).toBe(rejectionReason);

      // Contract state must be Rejected
      const contract = await Contract.findById(rejectContractId);
      expect(contract?.status).toBe('Rejected');
    });

    it('blocks subsequent action on an already completed/rejected workflow', async () => {
      const res = await request(app)
        .patch(`/api/approvals/${rejectWorkflowId}/action`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ action: 'Approve', comments: 'Try to approve after rejection' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already completed');
    });
  });

  describe('5. Contract ID & History Querying', () => {
    it('retrieves workflow by contract ID', async () => {
      const res = await request(app)
        .get(`/api/approvals/contract/${largeContractId}`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.workflow).toBeDefined();
      expect(res.body.workflow.status).toBe('Approved');
    });

    it('returns 404 for contract without any workflow', async () => {
      // Find a contract not initiated
      const uninitiated = await Contract.findOne({ status: 'Draft' });
      if (uninitiated) {
        const res = await request(app)
          .get(`/api/approvals/contract/${uninitiated._id}`)
          .set('Authorization', `Bearer ${viewerToken}`);

        expect(res.status).toBe(404);
      }
    });

    it('allows Admin to fetch paginated workflow history', async () => {
      const res = await request(app)
        .get('/api/approvals?limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.workflows)).toBe(true);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.total).toBeGreaterThanOrEqual(2);
    });
  });
});
