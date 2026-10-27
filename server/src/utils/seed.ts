import { User } from '../models/user.model';
import { Vendor } from '../models/vendor.model';
import { Contract } from '../models/contract.model';
import { hashPassword } from './password';

export const DEMO_USERS = [
  {
    name: 'Sarah Connor (Admin)',
    email: 'admin@clm.local',
    password: 'Admin123!',
    role: 'Admin' as const,
    department: 'Corporate Administration',
  },
  {
    name: 'Elena Rostova (Legal Counsel)',
    email: 'legal@clm.local',
    password: 'Legal123!',
    role: 'Legal' as const,
    department: 'Legal Affairs',
  },
  {
    name: 'Marcus Vance (Procurement Lead)',
    email: 'procurement@clm.local',
    password: 'Procure123!',
    role: 'Procurement' as const,
    department: 'Global Sourcing',
  },
  {
    name: 'David Sterling (VP Finance)',
    email: 'finance@clm.local',
    password: 'Finance123!',
    role: 'Finance' as const,
    department: 'Finance & Treasury',
  },
  {
    name: 'Claire Underwood (Executive Approver)',
    email: 'approver@clm.local',
    password: 'Approve123!',
    role: 'Approver' as const,
    department: 'Executive Management',
  },
  {
    name: 'Tom Reynolds (Auditor / Viewer)',
    email: 'viewer@clm.local',
    password: 'Viewer123!',
    role: 'Viewer' as const,
    department: 'Compliance & Audit',
  },
];

export const DEMO_VENDORS = [
  {
    name: 'Amazon Web Services Inc.',
    code: 'VEND-AWS-001',
    category: 'Software/SaaS' as const,
    contactPerson: {
      name: 'Michael Chen',
      email: 'mchen@amazon.com',
      phone: '+1 (206) 266-1000',
    },
    address: {
      street: '410 Terry Ave N',
      city: 'Seattle',
      state: 'WA',
      country: 'USA',
      postalCode: '98109',
    },
    taxId: 'US-911646860',
    status: 'Active' as const,
    performanceRating: 4.8,
    riskScore: 'Low' as const,
    notes: 'Primary cloud infrastructure host (compute, storage, and networking SLA 99.99%).',
  },
  {
    name: 'Microsoft Corporation',
    code: 'VEND-MSFT-002',
    category: 'Software/SaaS' as const,
    contactPerson: {
      name: 'Jennifer Gates',
      email: 'jgates@microsoft.com',
      phone: '+1 (425) 882-8080',
    },
    address: {
      street: 'One Microsoft Way',
      city: 'Redmond',
      state: 'WA',
      country: 'USA',
      postalCode: '98052',
    },
    taxId: 'US-911144442',
    status: 'Active' as const,
    performanceRating: 4.6,
    riskScore: 'Low' as const,
    notes: 'Office 365, Azure Active Directory, and Enterprise Security licensing.',
  },
  {
    name: 'Salesforce Enterprises',
    code: 'VEND-CRM-003',
    category: 'Software/SaaS' as const,
    contactPerson: {
      name: 'Arthur Pendelton',
      email: 'apendelton@salesforce.com',
      phone: '+1 (415) 901-7000',
    },
    address: {
      street: '415 Mission St',
      city: 'San Francisco',
      state: 'CA',
      country: 'USA',
      postalCode: '94105',
    },
    taxId: 'US-943320693',
    status: 'Active' as const,
    performanceRating: 4.2,
    riskScore: 'Medium' as const,
    notes: 'Enterprise CRM licensing for customer operations. Renewal review required in Q3.',
  },
  {
    name: 'Boston Strategic Consulting Group',
    code: 'VEND-BCG-004',
    category: 'Consulting' as const,
    contactPerson: {
      name: 'Victoria Sterling',
      email: 'v.sterling@bcg-advisory.com',
      phone: '+1 (617) 973-1200',
    },
    address: {
      street: '200 Pier 4 Blvd',
      city: 'Boston',
      state: 'MA',
      country: 'USA',
      postalCode: '02210',
    },
    taxId: 'US-042838321',
    status: 'Active' as const,
    performanceRating: 4.9,
    riskScore: 'Low' as const,
    notes: 'Advisory on digital transformation and operational governance frameworks.',
  },
  {
    name: 'FedEx Global Logistics',
    code: 'VEND-FDX-005',
    category: 'Logistics' as const,
    contactPerson: {
      name: 'Robert Hayes',
      email: 'rhayes@fedex-supply.com',
      phone: '+1 (901) 818-7500',
    },
    address: {
      street: '3610 Hacks Cross Rd',
      city: 'Memphis',
      state: 'TN',
      country: 'USA',
      postalCode: '38125',
    },
    taxId: 'US-710427007',
    status: 'Under Review' as const,
    performanceRating: 3.4,
    riskScore: 'High' as const,
    notes: 'Freight handling SLA slipped below 92% on time delivery in Q2; under operational audit.',
  },
];

export const seedDatabase = async (): Promise<void> => {
  try {
    const userCount = await User.countDocuments();
    let adminUser: any = null;
    let procUser: any = null;

    if (userCount === 0) {
      console.log('[Seed] No existing users found. Seeding demo accounts for all 6 roles...');
      for (const demo of DEMO_USERS) {
        const passwordHash = await hashPassword(demo.password);
        const created = await User.create({
          name: demo.name,
          email: demo.email,
          passwordHash,
          role: demo.role,
          department: demo.department,
          isActive: true,
        });
        if (demo.role === 'Admin') adminUser = created;
        if (demo.role === 'Procurement') procUser = created;
      }
      console.log(`[Seed] Successfully seeded ${DEMO_USERS.length} demo accounts.`);
    } else {
      adminUser = await User.findOne({ role: 'Admin' });
      procUser = await User.findOne({ role: 'Procurement' });
    }

    const vendorCount = await Vendor.countDocuments();
    const vendorMap: Record<string, any> = {};

    if (vendorCount === 0) {
      console.log('[Seed] No existing vendors found. Seeding realistic sample vendors...');
      for (const v of DEMO_VENDORS) {
        const createdVendor = await Vendor.create({
          ...v,
          createdBy: adminUser?._id,
        });
        vendorMap[v.code] = createdVendor;
      }
      console.log(`[Seed] Successfully seeded ${DEMO_VENDORS.length} enterprise vendor records.`);
    } else {
      const allVendors = await Vendor.find();
      allVendors.forEach((v) => {
        vendorMap[v.code] = v;
      });
    }

    const contractCount = await Contract.countDocuments();
    if (contractCount === 0 && vendorMap['VEND-AWS-001']) {
      console.log('[Seed] Seeding sample contracts across lifecycle stages...');

      const now = new Date();
      const inOneYear = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      const in25Days = new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000);
      const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

      await Contract.create([
        {
          contractNumber: 'CTR-2026-0001',
          title: 'AWS Enterprise Cloud Compute & Storage Agreement',
          description: 'Tier-1 production infrastructure hosting across US-East and US-West regions.',
          type: 'MSA',
          vendorId: vendorMap['VEND-AWS-001']._id,
          status: 'Active',
          value: 180000,
          currency: 'INR',
          startDate: sixMonthsAgo,
          endDate: inOneYear,
          renewalType: 'Auto-Renew',
          renewalNoticeDays: 30,
          autoRenewTermMonths: 12,
          ownerId: procUser?._id || adminUser?._id,
          department: 'Engineering',
          currentVersion: 1,
          tags: ['Cloud', 'Infrastructure', 'Mission-Critical'],
          complianceItems: [
            { id: 'c1', title: 'SOC 2 Type II Compliance Report', status: 'Compliant' },
            { id: 'c2', title: 'Data Processing Addendum (DPA)', status: 'Compliant' },
            { id: 'c3', title: 'Commercial Insurance Certificate', status: 'Compliant' },
          ],
        },
        {
          contractNumber: 'CTR-2026-0002',
          title: 'Microsoft 365 & Security Copilot License Subscription',
          description: '500 enterprise seats of Microsoft 365 E5 with advanced data protection.',
          type: 'License',
          vendorId: vendorMap['VEND-MSFT-002']._id,
          status: 'In Review',
          value: 95000,
          currency: 'INR',
          startDate: now,
          endDate: inOneYear,
          renewalType: 'Manual Review',
          renewalNoticeDays: 60,
          ownerId: procUser?._id || adminUser?._id,
          department: 'Information Technology',
          currentVersion: 1,
          tags: ['Software', 'Productivity', 'Security'],
          complianceItems: [
            { id: 'c4', title: 'GDPR & Privacy Impact Assessment', status: 'Pending Review' },
            { id: 'c5', title: 'Cyber Liability Coverage Endorsement', status: 'Compliant' },
          ],
        },
        {
          contractNumber: 'CTR-2026-0003',
          title: 'Salesforce Enterprise CRM Service Order & Integration SOW',
          description: 'Sales and Service Cloud expansion order with custom API connectors.',
          type: 'SOW',
          vendorId: vendorMap['VEND-CRM-003']._id,
          status: 'Draft',
          value: 42000,
          currency: 'INR',
          startDate: now,
          endDate: inOneYear,
          renewalType: 'Manual Review',
          renewalNoticeDays: 30,
          ownerId: procUser?._id || adminUser?._id,
          department: 'Sales & Marketing',
          currentVersion: 1,
          tags: ['CRM', 'Operations', 'Expansion'],
          complianceItems: [
            { id: 'c6', title: 'Mutual Confidentiality Agreement', status: 'Compliant' },
            { id: 'c7', title: 'Service Level Agreement Threshold Verification', status: 'Pending Review' },
          ],
        },
        {
          contractNumber: 'CTR-2026-0004',
          title: 'Boston Consulting Group Executive Strategic Advisory Retainer',
          description: 'Advisory engagement for enterprise operating model transformation.',
          type: 'Vendor Agreement',
          vendorId: vendorMap['VEND-BCG-004']._id,
          status: 'Pending Approval',
          value: 150000,
          currency: 'INR',
          startDate: now,
          endDate: inOneYear,
          renewalType: 'Do Not Renew',
          renewalNoticeDays: 30,
          ownerId: adminUser?._id,
          department: 'Executive Administration',
          currentVersion: 1,
          tags: ['Consulting', 'Executive', 'Governance'],
          complianceItems: [
            { id: 'c8', title: 'Conflict of Interest Attestation', status: 'Compliant' },
            { id: 'c9', title: 'Anti-Bribery and Corruption Due Diligence', status: 'Compliant' },
          ],
        },
        {
          contractNumber: 'CTR-2026-0005',
          title: 'FedEx Dedicated Freight & Supply Chain Service Level Agreement',
          description: 'North American distribution and fulfillment carrier logistics services.',
          type: 'SLA',
          vendorId: vendorMap['VEND-FDX-005']._id,
          status: 'Expiring Soon',
          value: 65000,
          currency: 'INR',
          startDate: sixMonthsAgo,
          endDate: in25Days, // Expiration within notice window
          renewalType: 'Manual Review',
          renewalNoticeDays: 30,
          ownerId: procUser?._id || adminUser?._id,
          department: 'Supply Chain',
          currentVersion: 1,
          tags: ['Logistics', 'Carrier', 'Expiring-Alert'],
          complianceItems: [
            { id: 'c10', title: 'DOT Motor Carrier Safety Certification', status: 'Compliant' },
            { id: 'c11', title: 'Cargo Loss and Damage Indemnity Verification', status: 'Pending Review' },
          ],
        },
      ]);
      console.log('[Seed] Successfully seeded 5 sample contracts across various lifecycle states.');
    }
  } catch (error) {
    console.error('[Seed] Error seeding database:', error);
  }
};
