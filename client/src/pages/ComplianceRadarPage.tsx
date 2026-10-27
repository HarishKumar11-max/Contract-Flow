import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { complianceService } from '../services/compliance.service';
import {
  RadarMetrics,
  RadarSweepResult,
  ContractAtRisk,
  IComplianceItem,
  ComplianceItemStatus,
} from '../types/compliance.types';
import {
  ShieldAlert,
  ShieldCheck,
  Clock,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Calendar,
  Building2,
  DollarSign,
  ChevronRight,
  CheckCircle2,
  XCircle,
  FileText,
  Radar,
  ArrowUpRight,
  Filter,
} from 'lucide-react';

interface ComplianceRadarPageProps {
  onSelectContract?: (contractId: string) => void;
}

const formatCurrency = (val: number, cur = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(val);

export const ComplianceRadarPage: React.FC<ComplianceRadarPageProps> = ({ onSelectContract }) => {
  const { user, hasPermission } = useAuth();
  const canRunSweep = hasPermission('reminder-jobs', 'run-job');
  const canManageCompliance = hasPermission('compliance', 'update');
  const [metrics, setMetrics] = useState<RadarMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sweeping, setSweeping] = useState(false);
  const [sweepResult, setSweepResult] = useState<RadarSweepResult | null>(null);

  // Selected contract compliance item verification modal state
  const [verifyModal, setVerifyModal] = useState<{
    contract: ContractAtRisk;
    item: IComplianceItem;
  } | null>(null);
  const [updatingItem, setUpdatingItem] = useState(false);
  const [modalStatus, setModalStatus] = useState<ComplianceItemStatus>('Compliant');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadRadar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await complianceService.getRadarMetrics();
      setMetrics(data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load compliance radar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRadar();
  }, [loadRadar]);

  const handleRunSweep = async () => {
    setSweeping(true);
    setSweepResult(null);
    try {
      const res = await complianceService.triggerSweep();
      setSweepResult(res);
      showToast('success', 'Radar sweep complete. Contract states and notifications refreshed.');
      await loadRadar();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Sweep execution failed');
    } finally {
      setSweeping(false);
    }
  };

  const handleUpdateComplianceItem = async () => {
    if (!verifyModal) return;
    setUpdatingItem(true);
    try {
      await complianceService.updateComplianceStatus(
        verifyModal.contract._id,
        verifyModal.item.id,
        modalStatus
      );
      showToast('success', `Compliance status updated to '${modalStatus}'`);
      setVerifyModal(null);
      await loadRadar();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Update failed');
    } finally {
      setUpdatingItem(false);
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-xs font-medium transition-all ${
            toastMessage.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          {toastMessage.text}
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shadow-xs">
              <Radar className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Compliance & Expiry Radar</h2>
              <p className="text-xs text-slate-500">
                Automated continuous horizon monitoring • 30/60/90-day renewal windows • Regulatory governance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunSweep}
              disabled={sweeping || !canRunSweep}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50"
              title={canRunSweep ? 'Run automated expiry and compliance sweep' : 'Admin/Legal/Procurement only'}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${sweeping ? 'animate-spin' : ''}`} />
              <span>{sweeping ? 'Sweeping Radar...' : 'Execute Live Radar Sweep'}</span>
            </button>
            <button
              onClick={loadRadar}
              disabled={loading}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Sweep Result Banner */}
        {sweepResult && (
          <div className="mt-4 p-4 bg-blue-50/70 border border-blue-200 rounded-xl text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                Radar Sweep Execution Summary
              </span>
              <span className="text-blue-500 font-mono text-[10px]">
                {new Date(sweepResult.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-700 pt-1">
              <div className="p-2 bg-white rounded-lg border border-blue-100">
                <span className="text-[10px] text-slate-400 block">Evaluated</span>
                <span className="font-bold text-slate-800">{sweepResult.contractsEvaluated} Contracts</span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-blue-100">
                <span className="text-[10px] text-slate-400 block">Expiring Soon</span>
                <span className="font-bold text-orange-600">
                  {sweepResult.transitionedToExpiringSoon.length} Transitioned
                </span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-blue-100">
                <span className="text-[10px] text-slate-400 block">Expired</span>
                <span className="font-bold text-red-600">{sweepResult.transitionedToExpired.length} Transitioned</span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-blue-100">
                <span className="text-[10px] text-slate-400 block">Notifications Emitted</span>
                <span className="font-bold text-blue-700">{sweepResult.notificationsGenerated} Alerts</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Monitored</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-800">
            {loading ? '—' : metrics?.totalActive || 0}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Contracts in Active portfolio</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">&lt; 30-Day Window</span>
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-red-600">
            {loading ? '—' : metrics?.expiringIn30Days || 0}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Urgent expiration attention</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">60-Day Horizon</span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-orange-600">
            {loading ? '—' : metrics?.expiringIn60Days || 0}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Entering renewal window</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">90-Day Horizon</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-800">
            {loading ? '—' : metrics?.expiringIn90Days || 0}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Scheduled for review</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Compliance Rate</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-blue-600">
            {loading ? '—' : `${metrics?.complianceRate || 100}%`}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {metrics?.compliantItems || 0} of {metrics?.totalComplianceItems || 0} verified
          </p>
        </div>
      </div>

      {/* Main Content Area: Contracts At Risk & Compliance Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Contracts Requiring Radar Attention */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-orange-600" />
                  Contracts Requiring Immediate Action
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Contracts entering renewal notice window or with compliance item alerts
                </p>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                {metrics?.contractsAtRisk.length || 0} flagged
              </span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                <span className="text-xs">Analyzing radar telemetry...</span>
              </div>
            ) : !metrics || metrics.contractsAtRisk.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-xs font-semibold text-slate-700">Radar Clear</p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  No contracts are currently within the critical 30/60/90-day expiry window or in compliance breach.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {metrics.contractsAtRisk.map((c) => (
                  <div key={c._id} className="p-5 hover:bg-slate-50/60 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {c.contractNumber}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getUrgencyBadge(
                              c.urgency
                            )}`}
                          >
                            {c.riskReason}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {c.status}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-slate-800 truncate">{c.title}</h4>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            {c.vendorId?.name || 'Counterparty'}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="font-semibold text-slate-700">
                            {formatCurrency(c.value, c.currency)}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span>Notice: {c.renewalNoticeDays}d</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-bold text-slate-800">
                          End: {new Date(c.endDate).toLocaleDateString()}
                        </div>
                        {onSelectContract && (
                          <button
                            onClick={() => onSelectContract(c._id)}
                            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <span>Open Contract</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Associated Compliance Items */}
                    {c.complianceItems && c.complianceItems.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-100/80">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                          Compliance Items
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {c.complianceItems.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => {
                                if (canRunSweep) {
                                  setVerifyModal({ contract: c, item });
                                  setModalStatus(item.status);
                                }
                              }}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all ${
                                item.status === 'Compliant'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : item.status === 'Non-Compliant'
                                  ? 'bg-red-50 text-red-700 border-red-200 cursor-pointer hover:ring-2 hover:ring-red-400'
                                  : 'bg-amber-50 text-amber-700 border-amber-200 cursor-pointer hover:ring-2 hover:ring-amber-400'
                              }`}
                            >
                              {item.status === 'Compliant' ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              ) : item.status === 'Non-Compliant' ? (
                                <XCircle className="w-3.5 h-3.5 text-red-600" />
                              ) : (
                                <Clock className="w-3.5 h-3.5 text-amber-600" />
                              )}
                              <span>{item.title}</span>
                              <span className="text-[9px] font-mono opacity-80">({item.status})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Compliance Health & Radar Schedule */}
        <div className="space-y-6">
          {/* Regulatory Breakdown Card */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              Compliance Health Breakdown
            </h3>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600">Compliant</span>
                  <span className="font-bold text-emerald-600">{metrics?.compliantItems || 0}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${
                        metrics?.totalComplianceItems
                          ? (metrics.compliantItems / metrics.totalComplianceItems) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600">Pending Review</span>
                  <span className="font-bold text-amber-600">{metrics?.pendingReviewItems || 0}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-amber-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${
                        metrics?.totalComplianceItems
                          ? (metrics.pendingReviewItems / metrics.totalComplianceItems) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600">Non-Compliant</span>
                  <span className="font-bold text-red-600">{metrics?.nonCompliantItems || 0}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${
                        metrics?.totalComplianceItems
                          ? (metrics.nonCompliantItems / metrics.totalComplianceItems) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Total Tracked Requirements</span>
              <span className="font-bold text-slate-800">{metrics?.totalComplianceItems || 0}</span>
            </div>
          </div>

          {/* Autonomous Radar Engine Info */}
          <div className="bg-slate-900 rounded-xl p-5 text-white shadow-md space-y-3">
            <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
              <Clock className="w-4 h-4" />
              Autonomous Daemon Sweep
            </div>
            <h4 className="text-sm font-bold">Daily Scheduled Cron Radar</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              System background daemon sweeps all contracts daily at midnight (<code>0 0 * * *</code>). Contracts entering the notice threshold (<code>endDate - renewalNoticeDays</code>) automatically transition to <code>Expiring Soon</code> and emit high-priority alert notifications to contract owners and administrators.
            </p>
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>Schedule: Daily at 00:00 UTC</span>
              <span className="inline-flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Item Verification Modal */}
      {verifyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
              <h3 className="text-sm font-bold text-slate-800">Verify Regulatory Compliance Item</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Contract: <span className="font-semibold text-slate-700">{verifyModal.contract.contractNumber}</span>
              </p>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Requirement</span>
                <span className="text-sm font-bold text-slate-800 block mt-0.5">{verifyModal.item.title}</span>
                {verifyModal.item.description && (
                  <p className="text-slate-500 text-[11px] mt-1">{verifyModal.item.description}</p>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-2">Update Verification Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Compliant', 'Non-Compliant', 'Pending Review'] as ComplianceItemStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setModalStatus(st)}
                      className={`py-2 px-2 rounded-lg border text-center font-semibold text-[11px] transition-all ${
                        modalStatus === st
                          ? st === 'Compliant'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : st === 'Non-Compliant'
                            ? 'bg-red-600 text-white border-red-600 shadow-sm'
                            : 'bg-amber-600 text-white border-amber-600 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setVerifyModal(null)}
                disabled={updatingItem}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateComplianceItem}
                disabled={updatingItem}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                {updatingItem ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Confirm Verification
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
