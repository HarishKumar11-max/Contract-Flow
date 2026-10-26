import apiClient from './api';
import {
  IApprovalWorkflow,
  InboxResponse,
  WorkflowHistoryResponse,
  TakeActionRequest,
} from '../types/approval.types';

export const approvalService = {
  /**
   * Initiates an approval workflow for a contract (moves it from Draft/In Review → Pending Approval)
   */
  initiateWorkflow: async (contractId: string): Promise<IApprovalWorkflow> => {
    const res = await apiClient.post<{ message: string; workflow: IApprovalWorkflow }>('/approvals', {
      contractId,
    });
    return res.data.workflow;
  },

  /**
   * Returns all in-progress workflows where the current user's role is the required role at currentStepIndex
   */
  getMyInbox: async (): Promise<InboxResponse> => {
    const res = await apiClient.get<InboxResponse>('/approvals/inbox');
    return res.data;
  },

  /**
   * Returns the most recent workflow for a specific contract
   */
  getWorkflowByContractId: async (contractId: string): Promise<IApprovalWorkflow | null> => {
    try {
      const res = await apiClient.get<{ workflow: IApprovalWorkflow }>(`/approvals/contract/${contractId}`);
      return res.data.workflow;
    } catch {
      return null;
    }
  },

  /**
   * Returns paginated workflow history (Admin/Legal only)
   */
  getWorkflowHistory: async (params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<WorkflowHistoryResponse> => {
    const res = await apiClient.get<WorkflowHistoryResponse>('/approvals', { params });
    return res.data;
  },

  /**
   * Approve or Reject the current pending step of a workflow
   */
  takeAction: async (
    workflowId: string,
    payload: TakeActionRequest
  ): Promise<{ workflow: IApprovalWorkflow; contract: { _id: string; contractNumber: string; status: string } }> => {
    const res = await apiClient.patch<{
      message: string;
      workflow: IApprovalWorkflow;
      contract: { _id: string; contractNumber: string; status: string };
    }>(`/approvals/${workflowId}/action`, payload);
    return res.data;
  },
};
