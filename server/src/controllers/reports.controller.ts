import { Request, Response } from 'express';
import { Parser as CsvParser } from 'json2csv';
import PDFDocument from 'pdfkit';
import { Contract } from '../models/contract.model';
import { Vendor } from '../models/vendor.model';
import { ApprovalWorkflow } from '../models/approval.model';
import { AuditLog } from '../models/auditLog.model';
import { recordAuditLog } from '../utils/audit.util';

// ─────────────────────────────────────────────
// GET /api/reports/analytics
// Executive spend analytics & portfolio summary
// ─────────────────────────────────────────────
export const getAnalytics = async (req: Request, res: Response): Promise<void> => {
  const [
    contractAgg,
    statusAgg,
    typeAgg,
    departmentAgg,
    monthlyAgg,
    vendorCount,
    approvalAgg,
    expiringCount,
  ] = await Promise.all([
    // Total spend and contract count
    Contract.aggregate([
      { $group: { _id: null, totalValue: { $sum: '$value' }, count: { $sum: 1 } } },
    ]),
    // Contracts by status
    Contract.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, value: { $sum: '$value' } } },
      { $sort: { count: -1 } },
    ]),
    // Contracts by type
    Contract.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 }, value: { $sum: '$value' } } },
      { $sort: { value: -1 } },
    ]),
    // Spend by department
    Contract.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 }, value: { $sum: '$value' } } },
      { $sort: { value: -1 } },
    ]),
    // Monthly contract creation trend (last 12 months)
    Contract.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
          value: { $sum: '$value' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    Vendor.countDocuments({ status: 'Active' }),
    // Approval metrics
    ApprovalWorkflow.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    // Expiring within 30 days
    Contract.countDocuments({
      status: { $in: ['Active', 'Expiring Soon'] },
      endDate: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);

  const summary = contractAgg[0] || { totalValue: 0, count: 0 };
  const approvalMap: Record<string, number> = {};
  approvalAgg.forEach((a: any) => { approvalMap[a._id] = a.count; });

  res.json({
    summary: {
      totalContracts: summary.count,
      totalSpend: summary.totalValue,
      activeVendors: vendorCount,
      pendingApprovals: approvalMap['In Progress'] || 0,
      approvedWorkflows: approvalMap['Approved'] || 0,
      rejectedWorkflows: approvalMap['Rejected'] || 0,
      expiringIn30Days: expiringCount,
    },
    byStatus: statusAgg.map((s: any) => ({ status: s._id, count: s.count, value: s.value })),
    byType: typeAgg.map((t: any) => ({ type: t._id, count: t.count, value: t.value })),
    byDepartment: departmentAgg.map((d: any) => ({ department: d._id, count: d.count, value: d.value })),
    monthlyTrend: monthlyAgg.map((m: any) => ({
      year: m._id.year,
      month: m._id.month,
      count: m.count,
      value: m.value,
    })),
  });
};

// ─────────────────────────────────────────────
// GET /api/reports/contracts/export?format=csv|pdf
// ─────────────────────────────────────────────
export const exportContracts = async (req: Request, res: Response): Promise<void> => {
  const format = (req.query.format as string) || 'csv';
  const status = req.query.status as string;
  const department = req.query.department as string;

  const query: any = {};
  // Procurement sees only own contracts
  if (req.user?.role === 'Procurement') query.ownerId = req.user._id;
  if (status) query.status = status;
  if (department) query.department = department;

  const contracts = await Contract.find(query)
    .populate('vendorId', 'name code')
    .populate('ownerId', 'name email')
    .sort({ createdAt: -1 })
    .limit(1000);

  await recordAuditLog({
    userId: req.user?._id.toString(),
    userEmail: req.user?.email || 'system',
    userRole: req.user?.role || 'Admin',
    action: 'EXPORT',
    entityType: 'Contract',
    entityId: 'bulk-export',
    changes: { after: { format, count: contracts.length, filters: { status, department } } },
    req,
  });

  if (format === 'pdf') {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="contracts-export-${Date.now()}.pdf"`);
    doc.pipe(res);

    // Header
    doc.fontSize(18).font('Helvetica-Bold').text('ContractFlow — Contracts Export', { align: 'center' });
    doc.fontSize(10).font('Helvetica').fillColor('#666')
      .text(`Generated: ${new Date().toLocaleString()} • Total: ${contracts.length} contracts`, { align: 'center' });
    doc.moveDown(1.5);

    // Column headers
    const colX = [40, 140, 230, 310, 380, 460, 510];
    const headers = ['#', 'Contract No.', 'Title', 'Vendor', 'Value', 'Status', 'Dept.'];
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#1e293b');
    headers.forEach((h, i) => doc.text(h, colX[i], doc.y, { width: colX[i + 1] ? colX[i + 1] - colX[i] - 4 : 80 }));
    doc.moveDown(0.3);
    doc.moveTo(40, doc.y).lineTo(560, doc.y).strokeColor('#e2e8f0').stroke();
    doc.moveDown(0.3);

    // Rows
    contracts.forEach((c: any, idx) => {
      if (doc.y > 740) { doc.addPage(); }
      const vendor = c.vendorId?.name || '—';
      const value = new Intl.NumberFormat('en-US', { style: 'currency', currency: c.currency || 'USD', maximumFractionDigits: 0 }).format(c.value);
      const row = [String(idx + 1), c.contractNumber, c.title.slice(0, 20), vendor.slice(0, 14), value, c.status, c.department?.slice(0, 10) || '—'];
      doc.fontSize(7).font('Helvetica').fillColor('#334155');
      row.forEach((cell, i) => {
        doc.text(cell, colX[i], doc.y, { width: colX[i + 1] ? colX[i + 1] - colX[i] - 4 : 80, lineBreak: false });
      });
      doc.moveDown(0.5);
    });

    doc.fontSize(8).fillColor('#94a3b8').text(`\nContractFlow CLM — Confidential`, { align: 'center' });
    doc.end();
    return;
  }

  // Default: CSV
  const fields = [
    { label: 'Contract Number', value: 'contractNumber' },
    { label: 'Title', value: 'title' },
    { label: 'Type', value: 'type' },
    { label: 'Vendor', value: (row: any) => row.vendorId?.name || '' },
    { label: 'Vendor Code', value: (row: any) => row.vendorId?.code || '' },
    { label: 'Value', value: 'value' },
    { label: 'Currency', value: 'currency' },
    { label: 'Status', value: 'status' },
    { label: 'Department', value: 'department' },
    { label: 'Start Date', value: (row: any) => row.startDate ? new Date(row.startDate).toISOString().split('T')[0] : '' },
    { label: 'End Date', value: (row: any) => row.endDate ? new Date(row.endDate).toISOString().split('T')[0] : '' },
    { label: 'Owner', value: (row: any) => row.ownerId?.name || '' },
    { label: 'Renewal Type', value: 'renewalType' },
    { label: 'Created At', value: (row: any) => row.createdAt ? new Date(row.createdAt).toISOString().split('T')[0] : '' },
  ];

  const parser = new CsvParser({ fields });
  const csv = parser.parse(contracts.map((c) => c.toObject()));
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="contracts-export-${Date.now()}.csv"`);
  res.send(csv);
};

// ─────────────────────────────────────────────
// GET /api/reports/vendors/export?format=csv
// ─────────────────────────────────────────────
export const exportVendors = async (req: Request, res: Response): Promise<void> => {
  const format = (req.query.format as string) || 'csv';

  const query: any = {};
  // Finance and Viewer can only read vendors (no filter); Procurement sees all they can manage
  const vendors = await Vendor.find(query).sort({ name: 1 }).limit(1000);

  await recordAuditLog({
    userId: req.user?._id.toString(),
    userEmail: req.user?.email || 'system',
    userRole: req.user?.role || 'Admin',
    action: 'EXPORT',
    entityType: 'Vendor',
    entityId: 'bulk-export',
    changes: { after: { format, count: vendors.length } },
    req,
  });

  const fields = [
    { label: 'Name', value: 'name' },
    { label: 'Code', value: 'code' },
    { label: 'Category', value: 'category' },
    { label: 'Status', value: 'status' },
    { label: 'Risk Score', value: 'riskScore' },
    { label: 'Performance Rating', value: 'performanceRating' },
    { label: 'Contact Name', value: (row: any) => row.contactPerson?.name || '' },
    { label: 'Contact Email', value: (row: any) => row.contactPerson?.email || '' },
    { label: 'Country', value: (row: any) => row.address?.country || '' },
    { label: 'Created At', value: (row: any) => row.createdAt ? new Date(row.createdAt).toISOString().split('T')[0] : '' },
  ];

  const parser = new CsvParser({ fields });
  const csv = parser.parse(vendors.map((v) => v.toObject()));
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="vendors-export-${Date.now()}.csv"`);
  res.send(csv);
};

// ─────────────────────────────────────────────
// GET /api/reports/approvals/export?format=csv
// ─────────────────────────────────────────────
export const exportApprovals = async (req: Request, res: Response): Promise<void> => {
  const format = (req.query.format as string) || 'csv';

  const workflows = await ApprovalWorkflow.find({})
    .populate('contractId', 'contractNumber title value department')
    .populate('initiatedBy', 'name email role')
    .sort({ createdAt: -1 })
    .limit(1000);

  await recordAuditLog({
    userId: req.user?._id.toString(),
    userEmail: req.user?.email || 'system',
    userRole: req.user?.role || 'Admin',
    action: 'EXPORT',
    entityType: 'Approval',
    entityId: 'bulk-export',
    changes: { after: { format, count: workflows.length } },
    req,
  });

  const fields = [
    { label: 'Contract Number', value: (row: any) => row.contractId?.contractNumber || '' },
    { label: 'Contract Title', value: (row: any) => row.contractId?.title || '' },
    { label: 'Contract Value', value: (row: any) => row.contractId?.value || 0 },
    { label: 'Department', value: (row: any) => row.contractId?.department || '' },
    { label: 'Workflow Status', value: 'status' },
    { label: 'Steps Total', value: (row: any) => row.steps?.length || 0 },
    { label: 'Initiated By', value: (row: any) => row.initiatedBy?.name || '' },
    { label: 'Initiated By Role', value: (row: any) => row.initiatedBy?.role || '' },
    { label: 'Created At', value: (row: any) => row.createdAt ? new Date(row.createdAt).toISOString().split('T')[0] : '' },
  ];

  const parser = new CsvParser({ fields });
  const csv = parser.parse(workflows.map((w) => w.toObject()));
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="approvals-export-${Date.now()}.csv"`);
  res.send(csv);
};
