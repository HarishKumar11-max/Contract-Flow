export type ComplianceItemStatus = 'Compliant' | 'Non-Compliant' | 'Pending Review';

export interface IComplianceItem {
  id: string;
  title: string;
  description?: string;
  status: ComplianceItemStatus;
  dueDate?: string;
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface ContractAtRisk {
  _id: string;
  contractNumber: string;
  title: string;
  status: string;
  value: number;
  currency: string;
  startDate: string;
  endDate: string;
  renewalType: string;
  renewalNoticeDays: number;
  department: string;
  vendorId?: {
    name: string;
    code: string;
    category: string;
  };
  ownerId?: {
    name: string;
    email: string;
    role: string;
  };
  complianceItems?: IComplianceItem[];
  riskReason: string;
  urgency: 'critical' | 'high' | 'medium' | 'low';
}

export interface RadarMetrics {
  totalActive: number;
  expiringIn30Days: number;
  expiringIn60Days: number;
  expiringIn90Days: number;
  expiredContracts: number;
  totalComplianceItems: number;
  compliantItems: number;
  nonCompliantItems: number;
  pendingReviewItems: number;
  complianceRate: number;
  contractsAtRisk: ContractAtRisk[];
}

export interface RadarSweepResult {
  timestamp: string;
  contractsEvaluated: number;
  transitionedToExpiringSoon: string[];
  transitionedToExpired: string[];
  notificationsGenerated: number;
  complianceAlertsGenerated: number;
}
