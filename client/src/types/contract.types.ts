import { Vendor } from './vendor.types';
import { AuthUser } from './auth.types';

export type ContractType = 
  | 'MSA' 
  | 'NDA' 
  | 'SOW' 
  | 'SLA' 
  | 'Vendor Agreement' 
  | 'Employment' 
  | 'License' 
  | 'Other';

export type ContractStatus = 
  | 'Draft' 
  | 'In Review' 
  | 'Pending Approval' 
  | 'Approved' 
  | 'Active' 
  | 'Expiring Soon' 
  | 'Expired' 
  | 'Terminated' 
  | 'Rejected' 
  | 'Amended';

export type RenewalType = 'Auto-Renew' | 'Manual Review' | 'Do Not Renew';

export interface ContractDocument {
  docId: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  version: number;
  uploadedBy?: AuthUser;
  uploadedAt: string;
  notes?: string;
}

export interface ComplianceItem {
  id: string;
  title: string;
  description?: string;
  status: 'Compliant' | 'Non-Compliant' | 'Pending Review';
  dueDate?: string;
  verifiedAt?: string;
}

export interface Contract {
  _id: string;
  contractNumber: string;
  title: string;
  description: string;
  type: ContractType;
  vendorId: Vendor;
  status: ContractStatus;
  value: number;
  currency: string;
  startDate: string;
  endDate: string;
  renewalType: RenewalType;
  renewalNoticeDays: number;
  autoRenewTermMonths?: number;
  ownerId: AuthUser;
  department: string;
  documents: ContractDocument[];
  currentVersion: number;
  complianceItems: ComplianceItem[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ContractListResponse {
  contracts: Contract[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  metrics: {
    totalContracts: number;
    activeContracts: number;
    inReviewContracts: number;
    expiringSoonContracts: number;
    totalContractValue: number;
  };
}
