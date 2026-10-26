import React, { useState, useEffect } from 'react';
import { auditService, AuditLogItem } from '../services/audit.service';
import { useAuth } from '../context/AuthContext';
import {
  Clock,
  Search,
  Filter,
  Download,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  FileSpreadsheet,
  X,
  Code2,
} from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(25);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected changes modal
  const [selectedChanges, setSelectedChanges] = useState<{ log: AuditLogItem } | null>(null);
  const [exporting, setExporting] = useState(false);

  const canExport = hasPermission('audit-logs', 'export');

  const fetchLogs = async (targetPage = page) => {
    try {
      setLoading(true);
      setError(null);
      const res = await auditService.getAuditLogs({
        page: targetPage,
        limit,
        search: search.trim() || undefined,
        action: action || undefined,
        entityType: entityType || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setLogs(res.logs);
      setTotal(res.pagination.total);
      setPage(res.pagination.page);
      setTotalPages(res.pagination.totalPages);
    } catch (err: any) {
      console.error('Error fetching audit logs:', err);
      setError(err.response?.data?.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [action, entityType, startDate, endDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs(1);
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      await auditService.exportAuditLogs({
        action: action || undefined,
        entityType: entityType || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
    } catch (err: any) {
      alert(`Export failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setExporting(false);
    }
  };

  const getActionBadge = (act: string) => {
    switch (act) {
      case 'CREATE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'APPROVE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'UPDATE':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'STATUS_TRANSITION':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'DOCUMENT_UPLOAD':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'DELETE':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'REJECT':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'ACCESS_DENIED':
        return 'bg-red-100 text-red-800 border-red-300 font-bold';
      case 'EXPORT':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'LOGIN':
      case 'LOGOUT':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-800">Immutable Audit Trail</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete cryptographic event telemetry, role transitions, export logging, and denied-access records.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canExport ? (
            <button
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{exporting ? 'Exporting...' : 'Export Audit CSV'}</span>
            </button>
          ) : (
            <span className="text-xs text-slate-500 bg-slate-100 px-3 py-2 rounded-lg border border-slate-200">
              Read-Only Auditor Mode
            </span>
          )}
          <button
            onClick={() => fetchLogs(page)}
            className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by user email, role, entity ID, or keyword..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Search
          </button>
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-100">
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Action</label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-lg p-1.5 bg-slate-50 text-slate-700"
            >
              <option value="">All Actions</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="STATUS_TRANSITION">STATUS_TRANSITION</option>
              <option value="DOCUMENT_UPLOAD">DOCUMENT_UPLOAD</option>
              <option value="APPROVE">APPROVE</option>
              <option value="REJECT">REJECT</option>
              <option value="LOGIN">LOGIN</option>
              <option value="LOGOUT">LOGOUT</option>
              <option value="EXPORT">EXPORT</option>
              <option value="ACCESS_DENIED">ACCESS_DENIED</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Entity Type</label>
            <select
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-lg p-1.5 bg-slate-50 text-slate-700"
            >
              <option value="">All Entity Types</option>
              <option value="Contract">Contract</option>
              <option value="Vendor">Vendor</option>
              <option value="Approval">Approval</option>
              <option value="User">User</option>
              <option value="System">System</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-lg p-1.5 bg-slate-50 text-slate-700"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-lg p-1.5 bg-slate-50 text-slate-700"
            />
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Showing <strong>{logs.length}</strong> of <strong>{total}</strong> log entries</span>
          <span>Page {page} of {totalPages}</span>
        </div>

        {error ? (
          <div className="p-8 text-center text-red-600 text-xs">{error}</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-semibold text-slate-600">No audit events match your query</p>
            <p className="text-xs text-slate-400 mt-1">Try clearing filters or search term</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Actor / Role</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Entity</th>
                  <th className="px-4 py-3">Entity ID</th>
                  <th className="px-4 py-3">Changes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="font-sans font-semibold text-slate-800">{log.userEmail}</div>
                      <span className="text-[10px] text-slate-400">{log.userRole}</span>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-sans font-medium text-slate-700">
                      {log.entityType}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 truncate max-w-[140px]" title={log.entityId}>
                      {log.entityId}
                    </td>
                    <td className="px-4 py-2.5">
                      {log.changes && Object.keys(log.changes).length > 0 ? (
                        <button
                          onClick={() => setSelectedChanges({ log })}
                          className="inline-flex items-center gap-1 text-[10px] font-sans font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded border border-blue-200 transition-colors"
                        >
                          <Code2 className="w-3 h-3" />
                          <span>View Diff</span>
                        </button>
                      ) : (
                        <span className="text-slate-300 font-sans text-[10px]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => fetchLogs(page - 1)}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
            <span className="text-xs text-slate-500">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => fetchLogs(page + 1)}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Changes Diff Modal */}
      {selectedChanges && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Audit Payload Details</h3>
                <span className="text-xs text-slate-400">
                  {selectedChanges.log.action} · {selectedChanges.log.entityType} ({selectedChanges.log.entityId})
                </span>
              </div>
              <button
                onClick={() => setSelectedChanges(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="text-xs">
                <span className="font-semibold text-slate-700">Timestamp: </span>
                <span className="text-slate-500">{new Date(selectedChanges.log.timestamp).toISOString()}</span>
              </div>
              <div className="text-xs">
                <span className="font-semibold text-slate-700">Actor: </span>
                <span className="text-slate-500">{selectedChanges.log.userEmail} ({selectedChanges.log.userRole})</span>
              </div>
              {selectedChanges.log.ipAddress && (
                <div className="text-xs">
                  <span className="font-semibold text-slate-700">IP: </span>
                  <span className="text-slate-500">{selectedChanges.log.ipAddress}</span>
                </div>
              )}

              <div>
                <span className="text-xs font-semibold text-slate-700 block mb-1">State Mutation Changes:</span>
                <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg text-[11px] font-mono overflow-x-auto max-h-72">
                  {JSON.stringify(selectedChanges.log.changes, null, 2)}
                </pre>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedChanges(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
