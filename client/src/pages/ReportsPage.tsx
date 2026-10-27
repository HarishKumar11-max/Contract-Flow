import React, { useState, useEffect } from 'react';
import {
  reportsService,
  AnalyticsData,
} from '../services/reports.service';
import { useAuth } from '../context/AuthContext';
import {
  BarChart3,
  Download,
  FileText,
  Building2,
  CheckSquare,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  DollarSign,
  PieChart,
  FileSpreadsheet,
  FileCheck,
  Filter,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);

  // Filters for contract export
  const [exportStatus, setExportStatus] = useState<string>('');
  const [exportDept, setExportDept] = useState<string>('');

  const canExport = hasPermission('reports', 'export');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await reportsService.getAnalytics();
      setData(res);
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError(err.response?.data?.message || 'Failed to load report analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleExportContracts = async (format: 'csv' | 'pdf') => {
    try {
      setExporting(`contracts-${format}`);
      await reportsService.exportContracts(format, {
        status: exportStatus || undefined,
        department: exportDept || undefined,
      });
    } catch (err: any) {
      alert(`Export failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setExporting(null);
    }
  };

  const handleExportVendors = async () => {
    try {
      setExporting('vendors');
      await reportsService.exportVendors('csv');
    } catch (err: any) {
      alert(`Export failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setExporting(null);
    }
  };

  const handleExportApprovals = async () => {
    try {
      setExporting('approvals');
      await reportsService.exportApprovals('csv');
    } catch (err: any) {
      alert(`Export failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setExporting(null);
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <span className="text-xs">Generating executive portfolio analytics...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700">
        <div className="font-semibold text-sm mb-1">Failed to Load Reports</div>
        <div className="text-xs">{error}</div>
        <button
          onClick={fetchAnalytics}
          className="mt-3 px-3 py-1.5 bg-red-600 text-white rounded text-xs font-semibold hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const { summary, byStatus, byType, byDepartment } = data;
  const maxDeptSpend = Math.max(...byDepartment.map((d) => d.value), 1);
  const maxStatusCount = Math.max(...byStatus.map((s) => s.count), 1);

  return (
    <div className="space-y-6">
      {/* Page Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-800">Executive Reports & Analytics</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time portfolio intelligence, financial spend allocation, and multi-format exports.
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Metrics
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Contract Value</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800">{formatCurrency(summary.totalSpend)}</div>
          <div className="text-xs text-slate-400 mt-1">{summary.totalContracts} total active agreements</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Active Suppliers</span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800">{summary.activeVendors}</div>
          <div className="text-xs text-slate-400 mt-1">Approved corporate vendors</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Pending Approvals</span>
            <CheckSquare className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800">{summary.pendingApprovals}</div>
          <div className="text-xs text-slate-400 mt-1">
            {summary.approvedWorkflows} approved · {summary.rejectedWorkflows} rejected
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Critical Expirations</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800">{summary.expiringIn30Days}</div>
          <div className="text-xs text-slate-400 mt-1">Expiring within next 30 days</div>
        </div>
      </div>

      {/* Export Action Center */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-slate-800">Export Reports & Data</h3>
          </div>
          {!canExport && (
            <span className="text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
              Read-only mode: Export authority restricted
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Contracts Export Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm mb-1">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Contracts Registry</span>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Export all contracts with values, terms, vendors, and statuses.
              </p>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <select
                  value={exportStatus}
                  onChange={(e) => setExportStatus(e.target.value)}
                  className="text-xs border border-slate-200 rounded px-2 py-1 bg-white"
                >
                  <option value="">All Statuses</option>
                  <option value="Draft">Draft</option>
                  <option value="In Review">In Review</option>
                  <option value="Pending Approval">Pending Approval</option>
                  <option value="Active">Active</option>
                  <option value="Expiring Soon">Expiring Soon</option>
                  <option value="Expired">Expired</option>
                </select>
                <select
                  value={exportDept}
                  onChange={(e) => setExportDept(e.target.value)}
                  className="text-xs border border-slate-200 rounded px-2 py-1 bg-white"
                >
                  <option value="">All Depts</option>
                  {byDepartment.map((d) => (
                    <option key={d.department} value={d.department}>{d.department}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleExportContracts('csv')}
                disabled={!canExport || exporting === 'contracts-csv'}
                className="flex-1 py-1.5 px-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>{exporting === 'contracts-csv' ? 'Exporting...' : 'CSV'}</span>
              </button>
              <button
                onClick={() => handleExportContracts('pdf')}
                disabled={!canExport || exporting === 'contracts-pdf'}
                className="flex-1 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>{exporting === 'contracts-pdf' ? 'Exporting...' : 'PDF'}</span>
              </button>
            </div>
          </div>

          {/* Vendors Export Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm mb-1">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>Vendor Master Directory</span>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Full supplier registry including risk scoring, categories, and contact info.
              </p>
            </div>
            <button
              onClick={handleExportVendors}
              disabled={!canExport || exporting === 'vendors'}
              className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{exporting === 'vendors' ? 'Exporting...' : 'Export Vendors (CSV)'}</span>
            </button>
          </div>

          {/* Approvals Export Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm mb-1">
                <CheckSquare className="w-4 h-4 text-purple-600" />
                <span>Approval Governance Audit</span>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Full multi-stage sign-off trail, approval steps, and timestamps.
              </p>
            </div>
            <button
              onClick={handleExportApprovals}
              disabled={!canExport || exporting === 'approvals'}
              className="w-full py-1.5 px-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{exporting === 'approvals' ? 'Exporting...' : 'Export Approvals (CSV)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Spend Allocation */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-slate-800">Spend by Department</h3>
          </div>
          <div className="space-y-3">
            {byDepartment.length === 0 ? (
              <div className="text-xs text-slate-400 py-4 text-center">No departmental spend recorded</div>
            ) : (
              byDepartment.map((d) => {
                const pct = Math.round((d.value / maxDeptSpend) * 100);
                return (
                  <div key={d.department} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-700">{d.department} ({d.count})</span>
                      <span className="text-slate-900 font-semibold">{formatCurrency(d.value)}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(pct, 4)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Portfolio Status Distribution */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-slate-800">Portfolio Status Distribution</h3>
          </div>
          <div className="space-y-3">
            {byStatus.length === 0 ? (
              <div className="text-xs text-slate-400 py-4 text-center">No contracts available</div>
            ) : (
              byStatus.map((s) => {
                const pct = Math.round((s.count / maxStatusCount) * 100);
                const colorClass =
                  s.status === 'Active' ? 'bg-emerald-500' :
                  s.status === 'Approved' ? 'bg-blue-500' :
                  s.status === 'Pending Approval' ? 'bg-purple-500' :
                  s.status === 'Expiring Soon' ? 'bg-orange-500' :
                  s.status === 'Draft' ? 'bg-slate-400' : 'bg-red-500';

                return (
                  <div key={s.status} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-700 font-semibold">{s.status}</span>
                      <span className="text-slate-500">
                        {s.count} contract{s.count !== 1 ? 's' : ''} ({formatCurrency(s.value)})
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`${colorClass} h-2 rounded-full transition-all duration-500`}
                        style={{ width: `${Math.max(pct, 4)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Contract Types Breakdown Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800 text-sm">Contract Type Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Contract Type</th>
                <th className="px-6 py-3">Count</th>
                <th className="px-6 py-3">Total Value</th>
                <th className="px-6 py-3">Average Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {byType.map((t) => (
                <tr key={t.type} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-3 font-semibold text-slate-800">{t.type}</td>
                  <td className="px-6 py-3 text-slate-600">{t.count}</td>
                  <td className="px-6 py-3 font-semibold text-slate-900">{formatCurrency(t.value)}</td>
                  <td className="px-6 py-3 text-slate-600">
                    {formatCurrency(t.count > 0 ? t.value / t.count : 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
