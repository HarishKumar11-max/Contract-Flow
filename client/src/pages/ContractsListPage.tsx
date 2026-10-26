import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { contractService } from '../services/contract.service';
import { Contract, ContractStatus, ContractType } from '../types/contract.types';
import { CreateContractModal } from '../components/contracts/CreateContractModal';
import {
  FileText,
  Plus,
  Search,
  Filter,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Trash2,
  ExternalLink,
  ShieldAlert,
  Loader2,
  Calendar,
  Building2,
  Tag
} from 'lucide-react';

interface ContractsListPageProps {
  onSelectContract: (contractId: string) => void;
}

export const ContractsListPage: React.FC<ContractsListPageProps> = ({ onSelectContract }) => {
  const { user, hasPermission, isAdmin } = useAuth();
  const canCreateContract = hasPermission('contracts', 'create');
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [metrics, setMetrics] = useState({
    totalContracts: 0,
    activeContracts: 0,
    inReviewContracts: 0,
    expiringSoonContracts: 0,
    totalContractValue: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const res = await contractService.getContracts({
        search: search || undefined,
        status: statusFilter || undefined,
        type: typeFilter || undefined,
      });
      setContracts(res.contracts);
      if (res.metrics) {
        setMetrics(res.metrics);
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to load contracts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [search, statusFilter, typeFilter]);

  const handleDeleteDraft = async (id: string, contractNumber: string) => {
    if (!window.confirm(`Are you sure you want to delete draft agreement ${contractNumber}?`)) {
      return;
    }
    setActionError(null);
    try {
      await contractService.deleteContract(id);
      await fetchContracts();
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to delete draft contract');
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getStatusBadge = (status: ContractStatus) => {
    switch (status) {
      case 'Draft':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'In Review':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Pending Approval':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Approved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Active':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Expiring Soon':
        return 'bg-orange-50 text-orange-700 border-orange-200 animate-pulse';
      case 'Expired':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'Terminated':
        return 'bg-slate-100 text-slate-500 line-through border-slate-200';
      case 'Rejected':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Amended':
        return 'bg-purple-50 text-purple-700 border-purple-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-800">Contract Lifecycle Registry</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Authoritative registry of commercial agreements, finite state transitions, SLAs, and document versions.
          </p>
        </div>
        {canCreateContract && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            Draft Contract
          </button>
        )}
      </div>

      {actionError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-xs">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Value</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-800">
            {formatCurrency(metrics.totalContractValue)}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{metrics.totalContracts} total active agreements</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Execution</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-blue-600">{metrics.activeContracts}</div>
          <p className="text-xs text-slate-400 mt-0.5">Enforceable active contracts</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Review & Approvals</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600">{metrics.inReviewContracts}</div>
          <p className="text-xs text-slate-400 mt-0.5">Pending legal or finance review</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Renewal Watch</span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-orange-600">{metrics.expiringSoonContracts}</div>
          <p className="text-xs text-slate-400 mt-0.5">Expiring within notice window</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, contract number, tags, or description..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="In Review">In Review</option>
          <option value="Pending Approval">Pending Approval</option>
          <option value="Approved">Approved</option>
          <option value="Active">Active</option>
          <option value="Expiring Soon">Expiring Soon</option>
          <option value="Expired">Expired</option>
          <option value="Terminated">Terminated</option>
          <option value="Rejected">Rejected</option>
          <option value="Amended">Amended</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="">All Types</option>
          <option value="MSA">MSA</option>
          <option value="NDA">NDA</option>
          <option value="SOW">SOW</option>
          <option value="SLA">SLA</option>
          <option value="Vendor Agreement">Vendor Agreement</option>
          <option value="License">License</option>
          <option value="Employment">Employment</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {/* Contracts Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-xs">Loading contract registry...</span>
          </div>
        ) : contracts.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <p className="text-xs">No contracts match your search and filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-6 py-3.5">Contract & Code</th>
                  <th className="px-6 py-3.5">Counterparty Vendor</th>
                  <th className="px-6 py-3.5">Value</th>
                  <th className="px-6 py-3.5">Type</th>
                  <th className="px-6 py-3.5">Lifecycle Status</th>
                  <th className="px-6 py-3.5">Expiration</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {contracts.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <button
                          onClick={() => onSelectContract(c._id)}
                          className="font-bold text-slate-900 hover:text-blue-600 text-left transition-colors block"
                        >
                          {c.title}
                        </button>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 font-semibold">
                            {c.contractNumber}
                          </span>
                          {c.tags && c.tags.length > 0 && (
                            <span className="text-[10px] text-slate-400 truncate max-w-[150px]">
                              #{c.tags.join(', #')}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div>
                        <span className="font-medium text-slate-800 block">
                          {c.vendorId?.name || 'Unassigned Vendor'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {c.vendorId?.code}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900">
                        {formatCurrency(c.value)}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-slate-700 font-medium">{c.type}</span>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(
                          c.status
                        )}`}
                      >
                        {c.status}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div>
                        <span className="text-slate-700 block">
                          {new Date(c.endDate).toLocaleDateString()}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {c.renewalType} ({c.renewalNoticeDays}d notice)
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => onSelectContract(c._id)}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 font-medium transition-colors border border-slate-200"
                        >
                          View Details
                        </button>

                        {isAdmin && c.status === 'Draft' && (
                          <button
                            onClick={() => handleDeleteDraft(c._id, c.contractNumber)}
                            title="Delete Draft"
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Creation Modal */}
      <CreateContractModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={(newContract) => {
          fetchContracts();
          onSelectContract(newContract._id);
        }}
      />
    </div>
  );
};
