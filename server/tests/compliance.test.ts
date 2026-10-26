import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { connectDB, disconnectDB } from '../src/config/db';
import { seedDatabase } from '../src/utils/seed';
import { Contract } from '../src/models/contract.model';
import { Vendor } from '../src/models/vendor.model';
import { Notification } from '../src/models/notification.model';

describe('Phase 6 — Compliance Monitoring, Expiry Radar & Notifications API', () => {
  let adminToken: string;
  let legalToken: string;
  let procurementToken: string;
  let viewerToken: string;

  let expiringContractId: string;
  let pastDueContractId: string;
  let compliantContractId: string;
  let testItemId: string;

  beforeAll(async () => {
    process.env.USE_MEMORY_DB = 'true';
    await connectDB();
    await seedDatabase();

    // Login users
    const [adminRes, legalRes, procRes, viewerRes] = await Promise.all([
      request(app).post('/api/auth/login').send({ email: 'admin@clm.local', password: 'Admin123!' }),
      request(app).post('/api/auth/login').send({ email: 'legal@clm.local', password: 'Legal123!' }),
      request(app).post('/api/auth/login').send({ email: 'procurement@clm.local', password: 'Procure123!' }),
      request(app).post('/api/auth/login').send({ email: 'viewer@clm.local', password: 'Viewer123!' }),
    ]);

    adminToken = adminRes.body.token;
    legalToken = legalRes.body.token;
    procurementToken = procRes.body.token;
    viewerToken = viewerRes.body.token;

    const vendor = await Vendor.findOne();
    const vendorId = vendor!._id.toString();

    const now = new Date();

    // 1. Contract expiring in 15 days (Active, notice period 30 days) -> should transition to 'Expiring Soon'
    const fifteenDaysFromNow = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
    const expiringRes = await request(app)
      .post('/api/contracts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Cloud Infrastructure Primary Capacity',
        type: 'MSA',
        vendorId,
        value: 120000,
        currency: 'USD',
        startDate: '2025-01-01',
        endDate: fifteenDaysFromNow.toISOString().split('T')[0],
        renewalNoticeDays: 30,
        renewalType: 'Manual Review',
        department: 'Engineering',
      });
    expiringContractId = expiringRes.body.contract._id;

    // Advance to Active: Draft -> In Review -> Pending Approval -> Approved -> Active
    await request(app).patch(`/api/contracts/${expiringContractId}/transition`).set('Authorization', `Bearer ${adminToken}`).send({ targetStatus: 'In Review' });
    await request(app).patch(`/api/contracts/${expiringContractId}/transition`).set('Authorization', `Bearer ${adminToken}`).send({ targetStatus: 'Pending Approval' });
    await request(app).patch(`/api/contracts/${expiringContractId}/transition`).set('Authorization', `Bearer ${adminToken}`).send({ targetStatus: 'Approved' });
    await request(app).patch(`/api/contracts/${expiringContractId}/transition`).set('Authorization', `Bearer ${adminToken}`).send({ targetStatus: 'Active' });

    // 2. Contract past due date (Active, endDate in past) -> should transition to 'Expired'
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    const pastRes = await request(app)
      .post('/api/contracts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Legacy Colocation Hosting Facility',
        type: 'License',
        vendorId,
        value: 45000,
        currency: 'USD',
        startDate: '2024-01-01',
        endDate: fiveDaysAgo.toISOString().split('T')[0],
        renewalNoticeDays: 30,
        renewalType: 'Do Not Renew',
        department: 'IT',
      });
    pastDueContractId = pastRes.body.contract._id;

    // Advance to Active
    await request(app).patch(`/api/contracts/${pastDueContractId}/transition`).set('Authorization', `Bearer ${adminToken}`).send({ targetStatus: 'In Review' });
    await request(app).patch(`/api/contracts/${pastDueContractId}/transition`).set('Authorization', `Bearer ${adminToken}`).send({ targetStatus: 'Pending Approval' });
    await request(app).patch(`/api/contracts/${pastDueContractId}/transition`).set('Authorization', `Bearer ${adminToken}`).send({ targetStatus: 'Approved' });
    await request(app).patch(`/api/contracts/${pastDueContractId}/transition`).set('Authorization', `Bearer ${adminToken}`).send({ targetStatus: 'Active' });

    // 3. Contract with compliance items for verification testing
    const compRes = await request(app)
      .post('/api/contracts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Enterprise Cyber Threat Mitigation Service',
        type: 'SLA',
        vendorId,
        value: 95000,
        currency: 'USD',
        startDate: '2026-01-01',
        endDate: '2027-01-01',
        renewalNoticeDays: 60,
        renewalType: 'Auto-Renew',
        department: 'Security',
      });
    compliantContractId = compRes.body.contract._id;

    // Add a compliance item
    const addItemRes = await request(app)
      .post(`/api/compliance/contracts/${compliantContractId}/items`)
      .set('Authorization', `Bearer ${legalToken}`)
      .send({
        title: 'ISO 27001 Annual Attestation Audit',
        description: 'Independent verification of Information Security Management System.',
      });
    testItemId = addItemRes.body.item.id;
  }, 180000);

  afterAll(async () => {
    await disconnectDB();
  });

  describe('1. Radar Sweep & Automated State Transitions', () => {
    it('executes radar sweep and transitions active contract within warning window to Expiring Soon', async () => {
      const res = await request(app)
        .post('/api/compliance/sweep')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.result).toBeDefined();
      expect(res.body.result.contractsEvaluated).toBeGreaterThan(0);
      expect(res.body.result.transitionedToExpiringSoon).toContain(
        (await Contract.findById(expiringContractId))?.contractNumber
      );

      const contract = await Contract.findById(expiringContractId);
      expect(contract?.status).toBe('Expiring Soon');
    });

    it('transitions past-due contract to Expired', async () => {
      const contract = await Contract.findById(pastDueContractId);
      expect(contract?.status).toBe('Expired');
    });

    it('generates Expiry Warning notifications for contract owners and admins', async () => {
      const notifications = await Notification.find({
        type: 'Expiry Warning',
        contractId: expiringContractId,
      });

      expect(notifications.length).toBeGreaterThan(0);
      expect(notifications[0].title).toContain('Expiry Radar Warning');
    });

    it('blocks Viewer from triggering radar sweep (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/compliance/sweep')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('2. Compliance Radar Telemetry & Metrics', () => {
    it('returns comprehensive radar analytics and risk items', async () => {
      const res = await request(app)
        .get('/api/compliance/radar')
        .set('Authorization', `Bearer ${legalToken}`);

      expect(res.status).toBe(200);
      expect(res.body.metrics).toBeDefined();
      expect(typeof res.body.metrics.complianceRate).toBe('number');
      expect(res.body.metrics.totalComplianceItems).toBeGreaterThan(0);
      expect(Array.isArray(res.body.metrics.contractsAtRisk)).toBe(true);
    });
  });

  describe('3. Regulatory Compliance Item Management & Verification', () => {
    it('allows Legal to verify a compliance item as Compliant', async () => {
      const res = await request(app)
        .patch(`/api/compliance/contracts/${compliantContractId}/items/${testItemId}`)
        .set('Authorization', `Bearer ${legalToken}`)
        .send({ status: 'Compliant' });

      expect(res.status).toBe(200);
      expect(res.body.item.status).toBe('Compliant');
      expect(res.body.item.verifiedAt).toBeDefined();
    });

    it('blocks Procurement from updating compliance items (read-only per 6-role spec)', async () => {
      const res = await request(app)
        .patch(`/api/compliance/contracts/${compliantContractId}/items/${testItemId}`)
        .set('Authorization', `Bearer ${procurementToken}`)
        .send({ status: 'Non-Compliant' });

      expect(res.status).toBe(403);
    });

    it('rejects invalid compliance status with 400 Bad Request', async () => {
      const res = await request(app)
        .patch(`/api/compliance/contracts/${compliantContractId}/items/${testItemId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'InvalidStatus' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('ValidationError');
    });

    it('blocks Viewer from modifying compliance items (403 Forbidden)', async () => {
      const res = await request(app)
        .patch(`/api/compliance/contracts/${compliantContractId}/items/${testItemId}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ status: 'Compliant' });

      expect(res.status).toBe(403);
    });

    it('allows Admin to add a new compliance requirement to a contract', async () => {
      const res = await request(app)
        .post(`/api/compliance/contracts/${compliantContractId}/items`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'SOC 2 Type II Annual Independent Audit',
          description: 'Security and confidentiality principles verification.',
        });

      expect(res.status).toBe(201);
      expect(res.body.item.title).toBe('SOC 2 Type II Annual Independent Audit');
      expect(res.body.item.status).toBe('Pending Review');
    });
  });

  describe('4. Notification Center API & Read Actions', () => {
    let sampleNotificationId: string;

    beforeAll(async () => {
      const notif = await Notification.findOne();
      if (notif) {
        sampleNotificationId = notif._id.toString();
      }
    });

    it('returns user notifications and unread count', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.notifications)).toBe(true);
      expect(typeof res.body.unreadCount).toBe('number');
    });

    it('returns unread count endpoint', async () => {
      const res = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(typeof res.body.unreadCount).toBe('number');
    });

    it('marks a single notification as read', async () => {
      if (sampleNotificationId) {
        const res = await request(app)
          .patch(`/api/notifications/${sampleNotificationId}/read`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.notification.isRead).toBe(true);
      }
    });

    it('marks all notifications as read for current user', async () => {
      const res = await request(app)
        .patch('/api/notifications/read-all')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(typeof res.body.modifiedCount).toBe('number');

      const countRes = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(countRes.body.unreadCount).toBe(0);
    });
  });
});
