import { ApprovalWorkflow, IApprovalWorkflow, IApprovalStep, ApprovalStepRole } from '../models/approval.model';
import { Contract, IContract } from '../models/contract.model';
import { IUser, UserRole } from '../models/user.model';
import { stateMachineService } from './stateMachine.service';
import { recordAuditLog } from '../utils/audit.util';

import { settingsService } from './settings.service';

export class ApprovalError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'ApprovalError';
    this.statusCode = statusCode;
  }
}

export const approvalService = {
  getWorkflowStepsForValue: async (value: number): Promise<IApprovalStep[]> => {
    let t1 = 25000;
    let t2 = 100000;
    try {
      const settings = await settingsService.getSettings();
      t1 = settings.tier1Threshold;
      t2 = settings.tier2Threshold;
    } catch {
      // Use defaults if settings table not yet loaded
    }

    if (value < t1) {
      return [
        {
          stepNumber: 1,
          roleRequired: 'Legal',
          status: 'Pending',
        },
      ];
    } else if (value <= t2) {
      return [
        {
          stepNumber: 1,
          roleRequired: 'Legal',
          status: 'Pending',
        },
        {
          stepNumber: 2,
          roleRequired: 'Finance',
          status: 'Pending',
        },
      ];
    } else {
      return [
        {
          stepNumber: 1,
          roleRequired: 'Legal',
          status: 'Pending',
        },
        {
          stepNumber: 2,
          roleRequired: 'Finance',
          status: 'Pending',
        },
        {
          stepNumber: 3,
          roleRequired: 'Approver',
          status: 'Pending',
        },
      ];
    }
  },

  initiateWorkflow: async (
    contractId: string,
    initiator: IUser
  ): Promise<IApprovalWorkflow> => {
    const contract = await Contract.findById(contractId);
    if (!contract) {
      throw new ApprovalError('Contract not found', 404);
    }

    // Existing in-progress workflow check
    const existingActive = await ApprovalWorkflow.findOne({
      contractId: contract._id,
      status: 'In Progress',
    });
    if (existingActive) {
      throw new ApprovalError('An approval workflow is already in progress for this contract', 409);
    }

    // If contract is in Draft, move to In Review first
    if (contract.status === 'Draft') {
      await stateMachineService.validateAndExecute(contract, 'In Review');
    }

    // Now transition In Review -> Pending Approval
    if (contract.status === 'In Review') {
      await stateMachineService.validateAndExecute(contract, 'Pending Approval');
    } else if (contract.status !== 'Pending Approval') {
      throw new ApprovalError(
        `Cannot initiate approval workflow for contract in '${contract.status}' status. Must be in Draft or In Review.`
      );
    }

    const steps = await approvalService.getWorkflowStepsForValue(contract.value);

    const workflow = await ApprovalWorkflow.create({
      contractId: contract._id,
      currentStepIndex: 0,
      status: 'In Progress',
      steps,
      initiatedBy: initiator._id,
    });

    await recordAuditLog({
      userId: initiator._id.toString(),
      userEmail: initiator.email,
      userRole: initiator.role,
      action: 'STATUS_TRANSITION',
      entityType: 'Approval',
      entityId: workflow._id.toString(),
      changes: {
        after: {
          contractNumber: contract.contractNumber,
          stepCount: steps.length,
          status: 'In Progress',
        },
      },
    });

    return workflow;
  },

  takeAction: async (
    workflowId: string,
    actor: IUser,
    action: 'Approve' | 'Reject',
    comments?: string
  ): Promise<{ workflow: IApprovalWorkflow; contract: IContract }> => {
    const workflow = await ApprovalWorkflow.findById(workflowId);
    if (!workflow) {
      throw new ApprovalError('Approval workflow not found', 404);
    }

    if (workflow.status !== 'In Progress') {
      throw new ApprovalError(
        `This workflow is already completed with status '${workflow.status}'`
      );
    }

    const currentStep = workflow.steps[workflow.currentStepIndex];
    if (!currentStep || currentStep.status !== 'Pending') {
      throw new ApprovalError('No pending step available for action in this workflow');
    }

    // Authorization: User role must match required role OR user must be Admin
    const isAuthorized =
      actor.role === 'Admin' || actor.role === currentStep.roleRequired;

    if (!isAuthorized) {
      throw new ApprovalError(
        `Access denied. Role '${actor.role}' is not authorized to act on this stage. Required: '${currentStep.roleRequired}' (or Admin).`,
        403
      );
    }

    const contract = await Contract.findById(workflow.contractId);
    if (!contract) {
      throw new ApprovalError('Associated contract not found', 404);
    }

    if (action === 'Reject') {
      if (!comments || comments.trim().length === 0) {
        throw new ApprovalError('Rejection rationale comments are strictly mandatory.', 400);
      }

      currentStep.status = 'Rejected';
      currentStep.comments = comments;
      currentStep.actionDate = new Date();
      currentStep.actedBy = actor._id;

      workflow.status = 'Rejected';
      await workflow.save();

      // State machine transition: Pending Approval -> Rejected
      await stateMachineService.validateAndExecute(contract, 'Rejected');

      await recordAuditLog({
        userId: actor._id.toString(),
        userEmail: actor.email,
        userRole: actor.role,
        action: 'REJECT',
        entityType: 'Approval',
        entityId: workflow._id.toString(),
        changes: {
          after: {
            stepNumber: currentStep.stepNumber,
            roleRequired: currentStep.roleRequired,
            comments,
          },
        },
      });

      return { workflow, contract };
    }

    // Action === 'Approve'
    currentStep.status = 'Approved';
    currentStep.comments = comments || 'Approved without additional reservations.';
    currentStep.actionDate = new Date();
    currentStep.actedBy = actor._id;

    await recordAuditLog({
      userId: actor._id.toString(),
      userEmail: actor.email,
      userRole: actor.role,
      action: 'APPROVE',
      entityType: 'Approval',
      entityId: workflow._id.toString(),
      changes: {
        after: {
          stepNumber: currentStep.stepNumber,
          roleRequired: currentStep.roleRequired,
          comments: currentStep.comments,
        },
      },
    });

    const isLastStep = workflow.currentStepIndex === workflow.steps.length - 1;

    if (isLastStep) {
      workflow.status = 'Approved';
      await workflow.save();

      // All stages approved: Pending Approval -> Approved!
      await stateMachineService.validateAndExecute(contract, 'Approved');
    } else {
      // Advance to next step
      workflow.currentStepIndex += 1;
      await workflow.save();
    }

    return { workflow, contract };
  },
};
