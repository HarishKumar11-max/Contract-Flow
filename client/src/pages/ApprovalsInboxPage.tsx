import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { approvalService } from '../services/approval.service';
import { IApprovalWorkflow, IApprovalStep, IContractRef } from '../types/approval.types';
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Inbox,
  ChevronRight,
  DollarSign,
  User,
  Shield,
  FileText,
  CheckCheck,
  Ban,
} from 'lucide-react';

const formatCurrency = (value: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);

const getRoleColor = (role: string) => {
  switch (role) {
    case 'Legal':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'Finance':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Approver':
      return 'bg-rose-100 text-rose-800 border-rose-200';
    case 'Admin':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

const getStepStatusIcon = (status: IApprovalStep['status']) => {
  switch (status) {
    case 'Approved':
      return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    case 'Rejected':
      return <XCircle className="w-4 h-4 text-red-500" />;
    case 'Pending':
      return <Clock className="w-4 h-4 text-amber-500 animate-pulse" />;
    default:
      return <Clock className="w-4 h-4 text-slate-400" />;
  }
};

// ─── Action Modal ─────────────────────────────────────────────────────────────
interface ActionModalProps {
  workflow: IApprovalWorkflow;
  actionType: 'Approve' | 'Reject';
  onConfirm: (comments: string) => void;
  onCancel: () => void;
  submitting: boolean;
}

const ActionModal: React.FC<ActionModalProps> = ({ workflow, actionType, onConfirm, onCancel, submitting }) => {
  const [comments, setComments] = useState('');
  const contract = workflow.contractId as IContractRef;
  const isReject = actionType === 'Reject';
  const canSubmit = isReject ? comments.trim().length > 0 : true;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg">
        {/* Header */}
        <div
          className={`px-6 py-4 border-b rounded-t-2xl ${
            isReject ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'
          }`}
        >
          <div className="flex items-center gap-3">
            {isReject ? (
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Ban className="w-5 h-5 text-red-600" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCheck className="w-5 h-5 text-emerald-600" />
              </div>
            )}
            <div>
              <h2 className={`text-base font-bold ${isReject ? 'text-red-900' : 'text-emerald-900'}`}>
                {isReject ? 'Reject Approval Step' : 'Approve Current Step'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Contract:{' '}
                <span className="font-semibold text-slate-700">
                  {typeof contract === 'object' ? contract.contractNumber : 'N/A'}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {typeof contract === 'object' && (
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 text-xs space-y-1">
              <div className="font-semibold text-slate-800 text-sm">{contract.title}</div>
              <div className="flex items-center gap-4 text-slate-500 mt-1">
                <span>{formatCurrency(contract.value, contract.currency)}</span>
                <span className="text-slate-300">•</span>
                <span>Step {workflow.currentStepIndex + 1} of {workflow.steps.length}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {isReject ? (
                <span>
                  Rejection Rationale{' '}
                  <span className="text-red-600 font-bold">* Required</span>
                </span>
              ) : (
                <span>Approval Comments (optional)</span>
              )}
            </label>
            <textarea
              className={`w-full px-3 py-2.5 text-xs border rounded-lg resize-none focus:outline-none focus:ring-2 ${
                isReject
                  ? 'border-red-200 focus:ring-red-500/20 focus:border-red-400 placeholder-red-300'
                  : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-400'
              }`}
              rows={4}
              placeholder={
                isReject
                  ? 'Mandatory: Provide a clear rationale for rejection. This will be recorded in the audit trail.'
                  : 'Add any approval comments or conditions...'
              }
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            />
            {isReject && comments.trim().length === 0 && (
              <p className="text-red-500 text-[10px] mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Rejection rationale is mandatory and cannot be empty.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={submitting}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(comments)}
            disabled={!canSubmit || submitting}
            className={`px-5 py-2 text-xs font-semibold text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5 ${
              isReject
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {submitting ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin" />
                Processing...
              </>
            ) : isReject ? (
              <>
                <XCircle className="w-3.5 h-3.5" />
                Reject Step
              </>
            ) : (
              <>
                <CheckCheck className="w-3.5 h-3.5" />
                Confirm Approval
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Workflow Card ─────────────────────────────────────────────────────────────
interface WorkflowCardProps {
  workflow: IApprovalWorkflow;
  onAction: (wf: IApprovalWorkflow, action: 'Approve' | 'Reject') => void;
}

const WorkflowCard: React.FC<WorkflowCardProps> = ({ workflow, onAction }) => {
  const contract = workflow.contractId as IContractRef;
  const currentStep = workflow.steps[workflow.currentStepIndex];

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* Card Header */}
      <div className="p-5 pb-4 border-b border-slate-100">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {typeof contract === 'object' ? contract.contractNumber : 'N/A'}
              </span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${getRoleColor(currentStep?.roleRequired || '')}`}>
                Requires {currentStep?.roleRequired}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-slate-800 mt-2 truncate">
              {typeof contract === 'object' ? contract.title : 'Unknown Contract'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {typeof contract === 'object' ? `${contract.type} • ${contract.department}` : ''}
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-sm font-bold text-slate-800">
              {typeof contract === 'object'
                ? formatCurrency(contract.value, contract.currency)
                : '—'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Contract Value</div>
          </div>
        </div>
      </div>

      {/* Step Timeline */}
      <div className="px-5 py-3 bg-slate-50/50 border-b border-slate-100">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2.5 font-medium">
          <Shield className="w-3.5 h-3.5" />
          Approval Timeline ({workflow.steps.length}-step workflow)
        </div>
        <div className="flex items-center gap-0">
          {workflow.steps.map((step, idx) => {
            const isActive = idx === workflow.currentStepIndex && step.status === 'Pending';
            const isCompleted = step.status === 'Approved';
            const isRejected = step.status === 'Rejected';
            return (
              <React.Fragment key={step._id || idx}>
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border ${
                    isActive
                      ? 'bg-amber-50 border-amber-300 text-amber-800'
                      : isCompleted
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : isRejected
                      ? 'bg-red-50 border-red-200 text-red-700'
                      : 'bg-slate-100 border-slate-200 text-slate-500'
                  }`}
                >
                  {getStepStatusIcon(step.status)}
                  <span>
                    Step {step.stepNumber}: {step.roleRequired}
                  </span>
                </div>
                {idx < workflow.steps.length - 1 && (
                  <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
        {currentStep?.actedBy && (
          <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-1">
            <User className="w-3 h-3" />
            Last actioned by:{' '}
            <span className="font-medium text-slate-600">
              {typeof currentStep.actedBy === 'object' ? currentStep.actedBy.name : 'N/A'}
            </span>
          </div>
        )}
      </div>

      {/* Initiated By + Actions */}
      <div className="px-5 py-4 flex items-center justify-between gap-3">
        <div className="text-xs text-slate-500">
          {workflow.initiatedBy && typeof workflow.initiatedBy === 'object' ? (
            <span>
              Initiated by{' '}
              <span className="font-semibold text-slate-700">{workflow.initiatedBy.name}</span>
            </span>
          ) : (
            <span>Workflow active</span>
          )}
          <span className="text-slate-300 mx-1.5">•</span>
          <span className="font-mono text-[10px]">
            {new Date(workflow.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onAction(workflow, 'Reject')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
          >
            <XCircle className="w-3.5 h-3.5" />
            Reject
          </button>
          <button
            onClick={() => onAction(workflow, 'Approve')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Approve
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export const ApprovalsInboxPage: React.FC = () => {
  const { user } = useAuth();
  const [workflows, setWorkflows] = useState<IApprovalWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<{
    workflow: IApprovalWorkflow;
    actionType: 'Approve' | 'Reject';
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadInbox = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await approvalService.getMyInbox();
      setWorkflows(data.workflows);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load approvals inbox');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInbox();
  }, [loadInbox]);

  const handleAction = (workflow: IApprovalWorkflow, actionType: 'Approve' | 'Reject') => {
    setActiveModal({ workflow, actionType });
  };

  const handleConfirm = async (comments: string) => {
    if (!activeModal) return;
    setSubmitting(true);
    try {
      await approvalService.takeAction(activeModal.workflow._id, {
        action: activeModal.actionType,
        comments,
      });
      showToast(
        'success',
        `Step ${activeModal.actionType}d successfully. Contract status updated.`
      );
      setActiveModal(null);
      await loadInbox();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || err.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-xs font-medium transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          {toastMessage.text}
        </div>
      )}

      {/* Page Header */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center">
                <Inbox className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Approvals Inbox</h2>
                <p className="text-xs text-slate-500">
                  Role:{' '}
                  <span className="font-semibold text-blue-700">{user?.role}</span> •{' '}
                  {loading
                    ? 'Loading...'
                    : `${workflows.length} pending action${workflows.length !== 1 ? 's' : ''} awaiting your review`}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={loadInbox}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Actions</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-800">{loading ? '—' : workflows.length}</div>
          <p className="text-[10px] text-slate-400 mt-0.5">Workflows requiring {user?.role} action</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Contract Value</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-800">
            {loading
              ? '—'
              : formatCurrency(
                  workflows.reduce((sum, wf) => {
                    const c = wf.contractId as IContractRef;
                    return sum + (typeof c === 'object' ? c.value : 0);
                  }, 0)
                )}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Combined value under review</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Role Authorization</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
              <Shield className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-800">{user?.role}</div>
          <p className="text-[10px] text-slate-400 mt-0.5">RBAC-enforced approval authority</p>
        </div>
      </div>

      {/* Inbox Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex items-center gap-3 text-slate-500">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
            <span className="text-sm">Loading approvals inbox...</span>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-800">Failed to load inbox</p>
            <p className="text-xs text-red-600 mt-0.5">{error}</p>
          </div>
        </div>
      ) : workflows.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/80 p-16 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h3 className="text-sm font-semibold text-slate-700 mb-1">All Caught Up!</h3>
          <p className="text-xs text-slate-400 max-w-xs">
            No pending approvals for your role ({user?.role}). New workflows will appear here when contracts are
            submitted for approval.
          </p>
          <div className="mt-5 flex items-center gap-2 text-xs text-slate-500">
            <FileText className="w-3.5 h-3.5" />
            <span>Initiate workflows from the Contracts Registry</span>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {workflows.map((wf) => (
            <WorkflowCard key={wf._id} workflow={wf} onAction={handleAction} />
          ))}
        </div>
      )}

      {/* Action Modal */}
      {activeModal && (
        <ActionModal
          workflow={activeModal.workflow}
          actionType={activeModal.actionType}
          onConfirm={handleConfirm}
          onCancel={() => setActiveModal(null)}
          submitting={submitting}
        />
      )}
    </div>
  );
};
