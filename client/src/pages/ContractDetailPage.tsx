import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { contractService } from '../services/contract.service';
import { approvalService } from '../services/approval.service';
import { Contract, ContractStatus, ContractDocument } from '../types/contract.types';
import { IApprovalWorkflow } from '../types/approval.types';
import {
  ArrowLeft,
  FileText,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  Building2,
  Calendar,
  ShieldCheck,
  Tag,
  Loader2,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  FileCheck,
  CheckSquare,
  XCircle,
  UserCheck
} from 'lucide-react';

interface ContractDetailPageProps {
  contractId: string;
  onBack: () => void;
}

export const ContractDetailPage: React.FC<ContractDetailPageProps> = ({ contractId, onBack }) => {
  const { user, hasPermission, isAdmin } = useAuth();
  const canCreateContract = hasPermission('contracts', 'create');
  const canUploadDocument = hasPermission('documents', 'create');
  const [contract, setContract] = useState<Contract | null>(null);
  const [allowedTransitions, setAllowedTransitions] = useState<ContractStatus[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'documents' | 'terms' | 'compliance' | 'approval'>('documents');
  const [workflow, setWorkflow] = useState<IApprovalWorkflow | null>(null);
  const [initiatingApproval, setInitiatingApproval] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Document upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadNotes, setUploadNotes] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);

  // Transition state
  const [transitioning, setTransitioning] = useState<boolean>(false);

  const fetchContract = async () => {
    try {
      setLoading(true);
      const res = await contractService.getContractById(contractId);
      setContract(res.contract);
      setAllowedTransitions(res.allowedTransitions);

      try {
        const wf = await approvalService.getWorkflowByContractId(contractId);
        setWorkflow(wf);
      } catch {
        setWorkflow(null);
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to load contract details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContract();
  }, [contractId]);

  const handleInitiateApproval = async () => {
    if (!contract) return;
    setActionError(null);
    setActionSuccess(null);
    setInitiatingApproval(true);
    try {
      const newWf = await approvalService.initiateWorkflow(contract._id);
      setWorkflow(newWf);
      setActionSuccess('Approval workflow successfully initiated. Contract is now Pending Approval.');
      await fetchContract();
      setActiveTab('approval');
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || 'Failed to initiate approval workflow');
    } finally {
      setInitiatingApproval(false);
    }
  };

  const handleExecuteTransition = async (targetStatus: ContractStatus) => {
    if (!contract) return;
    setActionError(null);
    setActionSuccess(null);
    setTransitioning(true);

    try {
      const res = await contractService.transitionState(
        contract._id,
        targetStatus,
        `Transitioned to ${targetStatus} by ${user?.name} (${user?.role})`
      );
      setContract(res.contract);
      setAllowedTransitions(res.allowedTransitions);
      setActionSuccess(`Contract successfully transitioned to '${targetStatus}'.`);
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Transition rejected by state machine.');
    } finally {
      setTransitioning(false);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !contract) return;

    setActionError(null);
    setActionSuccess(null);
    setUploading(true);

    try {
      const res = await contractService.uploadDocument(contract._id, uploadFile, uploadNotes);
      setActionSuccess(`Document uploaded successfully as Version ${res.currentVersion}.`);
      setUploadFile(null);
      setUploadNotes('');
      await fetchContract();
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to upload document file.');
    } finally {
      setUploading(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusBadge = (status: ContractStatus) => {
    switch (status) {
      case 'Draft': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'In Review': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Pending Approval': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Approved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Active': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Expiring Soon': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Expired': return 'bg-red-50 text-red-700 border-red-200';
      case 'Terminated': return 'bg-slate-100 text-slate-500 line-through border-slate-200';
      case 'Rejected': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Amended': return 'bg-purple-50 text-purple-700 border-purple-200';
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400 flex flex-col items-center gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="text-xs">Loading contract details...</span>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center max-w-lg mx-auto">
        <h3 className="text-sm font-bold text-slate-800">Contract Not Found</h3>
        <p className="text-xs text-slate-500 mt-1">The requested contract could not be loaded.</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg"
        >
          Return to Registry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Back & Header Command Bar */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Contract Registry
          </button>
          <span className="text-xs text-slate-400 font-mono">ID: {contract._id}</span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2 border-t border-slate-100">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {contract.contractNumber}
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${getStatusBadge(contract.status)}`}>
                {contract.status}
              </span>
              <span className="text-xs text-slate-400">Version {contract.currentVersion}.0</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">{contract.title}</h2>
          </div>

          {/* State Machine Transition Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {(contract.status === 'Draft' || contract.status === 'In Review') && canCreateContract && !workflow && (
              <button
                onClick={handleInitiateApproval}
                disabled={initiatingApproval}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50"
              >
                <CheckSquare className="w-3.5 h-3.5 text-indigo-200" />
                <span>{initiatingApproval ? 'Initiating...' : 'Submit for Approval'}</span>
              </button>
            )}

            {allowedTransitions.length > 0 ? (
              allowedTransitions.map((targetStatus) => (
                <button
                  key={targetStatus}
                  onClick={() => handleExecuteTransition(targetStatus)}
                  disabled={transitioning}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                  <span>Advance to {targetStatus}</span>
                </button>
              ))
            ) : (
              <span className="text-xs text-slate-400 italic">No further state transitions (Terminal status)</span>
            )}
          </div>
        </div>

        {/* Notices */}
        {actionError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-xs">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}
        {actionSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-700 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}
      </div>

      {/* Quick Stat Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Contract Value</span>
          <div className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(contract.value)}</div>
          <span className="text-[11px] text-slate-500 font-mono">{contract.currency}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Counterparty Supplier</span>
          <div className="text-sm font-bold text-slate-800 mt-1 truncate">{contract.vendorId?.name || 'Assigned Vendor'}</div>
          <span className="text-[11px] text-slate-400 font-mono">{contract.vendorId?.code}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Effective Period</span>
          <div className="text-xs font-semibold text-slate-800 mt-1">
            {new Date(contract.startDate).toLocaleDateString()} — {new Date(contract.endDate).toLocaleDateString()}
          </div>
          <span className="text-[10px] text-slate-400">{contract.renewalType}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Internal Department</span>
          <div className="text-sm font-bold text-slate-800 mt-1">{contract.department}</div>
          <span className="text-[10px] text-slate-400">Owner: {contract.ownerId?.name}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-4 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('documents')}
          className={`pb-3 px-1 border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'documents'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Documents & Versions ({contract.documents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('approval')}
          className={`pb-3 px-1 border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'approval'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Approval Workflow {workflow ? `(${workflow.status})` : ''}</span>
        </button>

        <button
          onClick={() => setActiveTab('terms')}
          className={`pb-3 px-1 border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'terms'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Terms & Renewal Policy</span>
        </button>

        <button
          onClick={() => setActiveTab('compliance')}
          className={`pb-3 px-1 border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'compliance'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Compliance Checklist ({contract.complianceItems.length})</span>
        </button>
      </div>

      {/* Tab 1: Documents & Version Manager */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          {/* Document Upload Area */}
          {canCreateContract && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2 mb-3">
                <Upload className="w-4 h-4 text-blue-600" />
                Upload New Document Revision (PDF, DOCX, TXT)
              </h3>
              <form onSubmit={handleUploadDocument} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Select File (Max 25MB)</label>
                    <input
                      type="file"
                      required
                      accept=".pdf,.docx,.doc,.txt"
                      onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Revision Notes</label>
                    <input
                      type="text"
                      value={uploadNotes}
                      onChange={(e) => setUploadNotes(e.target.value)}
                      placeholder="e.g. Countersigned amendment with redlines accepted"
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={uploading || !uploadFile}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Commit Version {contract.documents.length + 1}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Document Version History */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Document Version History</span>
              <span className="text-[11px] text-slate-400 font-mono">
                {contract.documents.length} recorded version(s)
              </span>
            </div>

            {contract.documents.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No formal agreement document uploaded yet. Upload version 1 above.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/50 text-slate-500 text-[10px] uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">Version</th>
                    <th className="px-6 py-3">Original File</th>
                    <th className="px-6 py-3">File Size</th>
                    <th className="px-6 py-3">Uploaded Date</th>
                    <th className="px-6 py-3">Revision Notes</th>
                    <th className="px-6 py-3 text-right">Download</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {contract.documents.map((doc) => (
                    <tr key={doc.docId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-3.5">
                        <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          v{doc.version}.0
                        </span>
                      </td>
                      <td className="px-6 py-3.5 font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          <FileCheck className="w-4 h-4 text-slate-400" />
                          <span>{doc.originalName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-slate-500 font-mono">
                        {formatFileSize(doc.fileSize)}
                      </td>
                      <td className="px-6 py-3.5 text-slate-500">
                        {new Date(doc.uploadedAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-3.5 text-slate-600 italic">
                        {doc.notes || 'No revision notes provided'}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <a
                          href={contractService.getDocumentDownloadUrl(contract._id, doc.docId)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Terms & Renewal Strategy */}
      {activeTab === 'terms' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 text-xs">
          <div>
            <h4 className="font-bold text-slate-800 mb-1">Commercial Scope & Purpose</h4>
            <p className="text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200 leading-relaxed">
              {contract.description || 'No detailed commercial scope specified.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-700 block">Renewal Strategy</span>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Renewal Policy:</span>
                <span className="font-semibold text-slate-800">{contract.renewalType}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Notice Period:</span>
                <span className="font-semibold text-slate-800">{contract.renewalNoticeDays} days before expiry</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Extension Term:</span>
                <span className="font-semibold text-slate-800">{contract.autoRenewTermMonths || 12} months</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-700 block">Governance Tags</span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {contract.tags && contract.tags.length > 0 ? (
                  contract.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 font-medium"
                    >
                      <Tag className="w-3 h-3 text-slate-400" />
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400">No tags assigned.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Approval Workflow */}
      {activeTab === 'approval' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-blue-600" />
                Multi-Stage Tiered Approval Engine
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {contract.value < 25000
                  ? 'Tier 1 (<$25k): Single-stage Legal sign-off required'
                  : contract.value <= 100000
                  ? 'Tier 2 ($25k-$100k): Two-stage Legal → Finance sign-off required'
                  : 'Tier 3 (>$100k): Three-stage Legal → Finance → Executive Approver sign-off required'}
              </p>
            </div>
            {!workflow && (contract.status === 'Draft' || contract.status === 'In Review') && canCreateContract && (
              <button
                onClick={handleInitiateApproval}
                disabled={initiatingApproval}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50"
              >
                {initiatingApproval ? 'Initiating...' : 'Initiate Approval Workflow'}
              </button>
            )}
          </div>

          {!workflow ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs">
              <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">No active approval workflow</p>
              <p className="text-slate-400 mt-1 max-w-sm mx-auto">
                {contract.status === 'Draft' || contract.status === 'In Review'
                  ? 'Initiate the approval workflow to route this contract through required stakeholder sign-offs.'
                  : `This contract is currently in '${contract.status}' status.`}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Overall Status Banner */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  workflow.status === 'Approved'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : workflow.status === 'Rejected'
                    ? 'bg-red-50 border-red-200 text-red-800'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  {workflow.status === 'Approved' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : workflow.status === 'Rejected' ? (
                    <XCircle className="w-5 h-5 text-red-600" />
                  ) : (
                    <Clock className="w-5 h-5 text-amber-600 animate-pulse" />
                  )}
                  <div>
                    <span className="font-bold text-xs uppercase tracking-wider block">
                      Workflow Status: {workflow.status}
                    </span>
                    <span className="text-xs opacity-90">
                      {workflow.status === 'In Progress'
                        ? `Awaiting Step ${workflow.currentStepIndex + 1} (${workflow.steps[workflow.currentStepIndex]?.roleRequired})`
                        : workflow.status === 'Approved'
                        ? 'All required stakeholder approvals granted'
                        : 'Workflow rejected; contract returned to Rejected status'}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-mono font-medium">
                  {workflow.steps.length} Stage{workflow.steps.length > 1 ? 's' : ''}
                </span>
              </div>

              {/* Steps Timeline Grid */}
              <div className="space-y-4">
                <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Required Stages</h5>
                <div className="grid grid-cols-1 gap-3">
                  {workflow.steps.map((step, idx) => {
                    const isPending = step.status === 'Pending';
                    const isCurrent = idx === workflow.currentStepIndex && workflow.status === 'In Progress';
                    const isApproved = step.status === 'Approved';
                    const isRejected = step.status === 'Rejected';

                    return (
                      <div
                        key={step._id || idx}
                        className={`p-4 rounded-xl border text-xs transition-all ${
                          isCurrent
                            ? 'bg-blue-50/50 border-blue-300 ring-2 ring-blue-500/20 shadow-xs'
                            : isApproved
                            ? 'bg-emerald-50/40 border-emerald-200'
                            : isRejected
                            ? 'bg-red-50/40 border-red-200'
                            : 'bg-slate-50 border-slate-200 opacity-70'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                                isApproved
                                  ? 'bg-emerald-600 text-white'
                                  : isRejected
                                  ? 'bg-red-600 text-white'
                                  : isCurrent
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {step.stepNumber}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800">
                                  Stage {step.stepNumber}: {step.roleRequired} Sign-off
                                </span>
                                <span
                                  className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                                    isApproved
                                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                      : isRejected
                                      ? 'bg-red-100 text-red-800 border-red-300'
                                      : isCurrent
                                      ? 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                                      : 'bg-slate-100 text-slate-600 border-slate-200'
                                  }`}
                                >
                                  {step.status}
                                </span>
                              </div>
                              <p className="text-slate-500 text-[11px] mt-0.5">
                                Required Authority: Role '{step.roleRequired}' or Administrator
                              </p>
                            </div>
                          </div>
                          {step.actionDate && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(step.actionDate).toLocaleString()}
                            </span>
                          )}
                        </div>

                        {step.comments && (
                          <div className="mt-3 pl-10">
                            <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-slate-700 text-[11px]">
                              <span className="font-semibold text-slate-500 block mb-0.5">Reviewer Notes:</span>
                              "{step.comments}"
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Compliance Checklist */}
      {activeTab === 'compliance' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-xs">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-slate-800">Compliance & Regulatory Requirements</h4>
              <p className="text-[11px] text-slate-400">Verification checklist for legal and audit enforcement</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {contract.complianceItems.map((item) => (
              <div key={item.id} className="p-5 flex items-center justify-between hover:bg-slate-50/50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">{item.title}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                        item.status === 'Compliant'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  {item.description && <p className="text-slate-500 text-[11px]">{item.description}</p>}
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">Requirement ID</span>
                  <span className="font-mono text-[10px] text-slate-600">{item.id}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
