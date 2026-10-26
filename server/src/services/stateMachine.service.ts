import { ContractStatus, IContract } from '../models/contract.model';

export const VALID_TRANSITIONS: Record<ContractStatus, ContractStatus[]> = {
  Draft: ['In Review'],
  'In Review': ['Draft', 'Pending Approval'],
  'Pending Approval': ['Approved', 'Rejected'],
  Approved: ['Active'],
  Active: ['Expiring Soon', 'Terminated', 'Amended'],
  'Expiring Soon': ['Active', 'Expired'],
  Expired: [],
  Terminated: [],
  Rejected: ['Draft'],
  Amended: ['In Review'],
};

export class StateMachineError extends Error {
  statusCode: number;
  constructor(message: string) {
    super(message);
    this.name = 'StateMachineError';
    this.statusCode = 400;
  }
}

export const stateMachineService = {
  isValidTransition: (from: ContractStatus, to: ContractStatus): boolean => {
    const allowed = VALID_TRANSITIONS[from] || [];
    return allowed.includes(to);
  },

  getAllowedTransitions: (from: ContractStatus): ContractStatus[] => {
    return VALID_TRANSITIONS[from] || [];
  },

  validateAndExecute: async (
    contract: IContract,
    targetStatus: ContractStatus
  ): Promise<IContract> => {
    const fromStatus = contract.status;

    if (!stateMachineService.isValidTransition(fromStatus, targetStatus)) {
      const allowed = stateMachineService.getAllowedTransitions(fromStatus);
      const allowedStr = allowed.length > 0 ? `[${allowed.join(', ')}]` : 'None (Terminal state)';
      throw new StateMachineError(
        `Invalid contract status transition from '${fromStatus}' to '${targetStatus}'. Allowed transitions: ${allowedStr}`
      );
    }

    contract.status = targetStatus;
    return contract.save();
  },
};
