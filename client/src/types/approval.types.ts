export type ApprovalStepRole = 'Legal' | 'Finance' | 'Procurement' | 'Admin' | 'Approver';
export type ApprovalStepStatus = 'Pending' | 'Approved' | 'Rejected' | 'Skipped';
export type WorkflowStatus = 'In Progress' | 'Approved' | 'Rejected';

export interface IApprovalStep {
  _id: string;
  stepNumber: number;
  roleRequired: ApprovalStepRole;
  status: ApprovalStepStatus;
  comments?: string;
  actionDate?: string;
  actedBy?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface IContractRef {
  _id: string;
  contractNumber: string;
  title: string;
  value: number;
  currency: string;
  status: string;
  type: string;
  department: string;
}

export interface IApprovalWorkflow {
  _id: string;
  contractId: IContractRef | string;
  currentStepIndex: number;
  status: WorkflowStatus;
  steps: IApprovalStep[];
  initiatedBy?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface InboxResponse {
  count: number;
  workflows: IApprovalWorkflow[];
}

export interface WorkflowHistoryResponse {
  workflows: IApprovalWorkflow[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TakeActionRequest {
  action: 'Approve' | 'Reject';
  comments?: string;
}
