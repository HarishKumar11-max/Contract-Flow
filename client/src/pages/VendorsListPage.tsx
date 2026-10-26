import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { vendorService } from '../services/vendor.service';
import { Vendor, VendorCategory, VendorStatus, RiskScore } from '../types/vendor.types';
import {
  Building2,
  Plus,
  Search,
  Star,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  MoreVertical,
  X,
  ExternalLink,
  Edit2,
  Trash2,
  TrendingUp,
  Award,
  Loader2,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';

export const VendorsListPage: React.FC = () => {
  const { user, hasPermission, isAdmin } = useAuth();
  const canManageVendors = hasPermission('vendors', 'create');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [metrics, setMetrics] = useState({
    totalVendors: 0,
    activeVendors: 0,
    highRiskVendors: 0,
    avgPerformanceRating: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [riskFilter, setRiskFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [actionError, setActionError] = useState<string | null>(null);

  // Modal states
  const [vendorModalOpen, setVendorModalOpen] = useState<boolean>(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [profileModalVendor, setProfileModalVendor] = useState<Vendor | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formCategory, setFormCategory] = useState<VendorCategory>('Software/SaaS');
  const [formContactName, setFormContactName] = useState('');
  const [formContactEmail, setFormContactEmail] = useState('');
  const [formContactPhone, setFormContactPhone] = useState('');
  const [formStreet, setFormStreet] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formState, setFormState] = useState('');
  const [formCountry, setFormCountry] = useState('USA');
  const [formPostalCode, setFormPostalCode] = useState('');
  const [formTaxId, setFormTaxId] = useState('');
  const [formStatus, setFormStatus] = useState<VendorStatus>('Active');
  const [formRiskScore, setFormRiskScore] = useState<RiskScore>('Low');
  const [formRating, setFormRating] = useState<number>(3.5);
  const [formNotes, setFormNotes] = useState('');

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const res = await vendorService.getVendors({
        search: search || undefined,
        category: categoryFilter || undefined,
        riskScore: riskFilter || undefined,
        status: statusFilter || undefined,
      });
      setVendors(res.vendors);
      if (res.metrics) {
        setMetrics(res.metrics);
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to load vendor registry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [search, categoryFilter, riskFilter, statusFilter]);

  const openCreateModal = () => {
    setEditingVendor(null);
    setFormName('');
    setFormCode(`VEND-${Math.floor(100 + Math.random() * 900)}`);
    setFormCategory('Software/SaaS');
    setFormContactName('');
    setFormContactEmail('');
    setFormContactPhone('');
    setFormStreet('');
    setFormCity('');
    setFormState('');
    setFormCountry('USA');
    setFormPostalCode('');
    setFormTaxId('');
    setFormStatus('Active');
    setFormRiskScore('Low');
    setFormRating(4.0);
    setFormNotes('');
    setVendorModalOpen(true);
  };

  const openEditModal = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setFormName(vendor.name);
    setFormCode(vendor.code);
    setFormCategory(vendor.category);
    setFormContactName(vendor.contactPerson.name);
    setFormContactEmail(vendor.contactPerson.email);
    setFormContactPhone(vendor.contactPerson.phone || '');
    setFormStreet(vendor.address?.street || '');
    setFormCity(vendor.address?.city || '');
    setFormState(vendor.address?.state || '');
    setFormCountry(vendor.address?.country || 'USA');
    setFormPostalCode(vendor.address?.postalCode || '');
    setFormTaxId(vendor.taxId || '');
    setFormStatus(vendor.status);
    setFormRiskScore(vendor.riskScore);
    setFormRating(vendor.performanceRating);
    setFormNotes(vendor.notes || '');
    setVendorModalOpen(true);
  };

  const handleSaveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setSubmitting(true);
    try {
      const payload: any = {
        name: formName,
        category: formCategory,
        contactPerson: {
          name: formContactName,
          email: formContactEmail,
          phone: formContactPhone,
        },
        address: {
          street: formStreet,
          city: formCity,
          state: formState,
          country: formCountry,
          postalCode: formPostalCode,
        },
        taxId: formTaxId,
        status: formStatus,
        riskScore: formRiskScore,
        performanceRating: Number(formRating),
        notes: formNotes,
      };

      if (editingVendor) {
        await vendorService.updateVendor(editingVendor._id, payload);
      } else {
        payload.code = formCode.toUpperCase().trim();
        await vendorService.createVendor(payload);
      }

      setVendorModalOpen(false);
      await fetchVendors();
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to save vendor details');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVendor = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete vendor "${name}"? This action is audited.`)) {
      return;
    }
    setActionError(null);
    try {
      await vendorService.deleteVendor(id);
      await fetchVendors();
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to delete vendor');
    }
  };

  const handleQuickRatingChange = async (vendorId: string, newRating: number) => {
    try {
      await vendorService.updateRating(vendorId, newRating);
      if (profileModalVendor && profileModalVendor._id === vendorId) {
        setProfileModalVendor({ ...profileModalVendor, performanceRating: newRating });
      }
      await fetchVendors();
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to update rating');
    }
  };

  const getRiskBadge = (risk: RiskScore) => {
    switch (risk) {
      case 'Low':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'High':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Critical':
        return 'bg-red-50 text-red-700 border-red-200';
    }
  };

  const getStatusBadge = (status: VendorStatus) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Under Review':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Suspended':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Terminated':
        return 'bg-red-50 text-red-700 border-red-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-800">Vendor Directory & Risk Governance</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Maintain authorized enterprise suppliers, contact matrices, SLAs, and performance scorecards.
          </p>
        </div>
        {canManageVendors && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            Register Vendor
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
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Suppliers</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-800">{metrics.totalVendors}</div>
          <p className="text-xs text-slate-400 mt-0.5">Enterprise verified vendors</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Suppliers</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600">{metrics.activeVendors}</div>
          <p className="text-xs text-slate-400 mt-0.5">Approved for contract drafting</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">High Risk Watch</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600">{metrics.highRiskVendors}</div>
          <p className="text-xs text-slate-400 mt-0.5">High or Critical risk assessment</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Performance</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-800 flex items-center gap-1.5">
            {metrics.avgPerformanceRating}
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Organization SLA scorecard</p>
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
            placeholder="Search vendor name, code, contact person, or email..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="">All Categories</option>
          <option value="Software/SaaS">Software/SaaS</option>
          <option value="Hardware">Hardware</option>
          <option value="Professional Services">Professional Services</option>
          <option value="Consulting">Consulting</option>
          <option value="Logistics">Logistics</option>
          <option value="Other">Other</option>
        </select>

        <select
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="">All Risk Levels</option>
          <option value="Low">Low Risk</option>
          <option value="Medium">Medium Risk</option>
          <option value="High">High Risk</option>
          <option value="Critical">Critical Risk</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Under Review">Under Review</option>
          <option value="Suspended">Suspended</option>
          <option value="Terminated">Terminated</option>
        </select>
      </div>

      {/* Vendors Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-xs">Loading vendor directory...</span>
          </div>
        ) : vendors.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <p className="text-xs">No vendors matched your filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-6 py-3.5">Vendor & Code</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Primary Contact</th>
                  <th className="px-6 py-3.5">SLA Rating</th>
                  <th className="px-6 py-3.5">Risk Score</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {vendors.map((v) => (
                  <tr key={v._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <button
                          onClick={() => setProfileModalVendor(v)}
                          className="font-bold text-slate-900 hover:text-blue-600 text-left transition-colors flex items-center gap-1.5"
                        >
                          {v.name}
                        </button>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            {v.code}
                          </span>
                          {v.taxId && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              Tax: {v.taxId}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-700 font-medium">{v.category}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <div className="font-medium text-slate-800">{v.contactPerson.name}</div>
                        <div className="text-[11px] text-blue-600 font-mono">{v.contactPerson.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <div className="flex text-amber-400">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3.5 h-3.5 ${
                                star <= Math.round(v.performanceRating)
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="font-semibold text-slate-800 text-[11px]">
                          {v.performanceRating.toFixed(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold border ${getRiskBadge(v.riskScore)}`}>
                        {v.riskScore}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStatusBadge(v.status)}`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => setProfileModalVendor(v)}
                          title="View Profile"
                          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>

                        {canManageVendors && (
                          <button
                            onClick={() => openEditModal(v)}
                            title="Edit Vendor"
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteVendor(v._id, v.name)}
                            title="Delete Vendor (Admin)"
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

      {/* Add / Edit Vendor Modal */}
      {vendorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  {editingVendor ? `Edit Vendor: ${editingVendor.name}` : 'Register New Vendor'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Authorized vendor profile for enterprise contract binding
                </p>
              </div>
              <button
                onClick={() => setVendorModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveVendor} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Acme Corporation"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unique Vendor Code *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingVendor}
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    placeholder="VEND-2026-001"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-800 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as VendorCategory)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="Software/SaaS">Software/SaaS</option>
                    <option value="Hardware">Hardware</option>
                    <option value="Professional Services">Professional Services</option>
                    <option value="Consulting">Consulting</option>
                    <option value="Logistics">Logistics</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as VendorStatus)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="Active">Active</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Terminated">Terminated</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tax ID / EIN</label>
                  <input
                    type="text"
                    value={formTaxId}
                    onChange={(e) => setFormTaxId(e.target.value)}
                    placeholder="US-123456789"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Primary Contact Person */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-700 block">Primary Contact Representative</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Contact Name *</label>
                    <input
                      type="text"
                      required
                      value={formContactName}
                      onChange={(e) => setFormContactName(e.target.value)}
                      placeholder="Jane Foster"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Contact Email *</label>
                    <input
                      type="email"
                      required
                      value={formContactEmail}
                      onChange={(e) => setFormContactEmail(e.target.value)}
                      placeholder="jfoster@acme.com"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={formContactPhone}
                      onChange={(e) => setFormContactPhone(e.target.value)}
                      placeholder="+1 (555) 019-2831"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Performance & Risk */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Risk Score Assessment</label>
                  <select
                    value={formRiskScore}
                    onChange={(e) => setFormRiskScore(e.target.value as RiskScore)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="Low">Low Risk</option>
                    <option value="Medium">Medium Risk</option>
                    <option value="High">High Risk</option>
                    <option value="Critical">Critical Risk</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Performance Score (1.0 to 5.0): <span className="font-bold text-blue-600">{formRating}</span>
                  </label>
                  <input
                    type="range"
                    min="1.0"
                    max="5.0"
                    step="0.1"
                    value={formRating}
                    onChange={(e) => setFormRating(parseFloat(e.target.value))}
                    className="w-full mt-2 accent-blue-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Internal Notes & Scope</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Operational scope, service delivery observations, SLA review notes..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setVendorModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingVendor ? 'Update Vendor' : 'Register Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vendor Detail / Scorecard Modal */}
      {profileModalVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getStatusBadge(profileModalVendor.status)}`}>
                    {profileModalVendor.status}
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getRiskBadge(profileModalVendor.riskScore)}`}>
                    {profileModalVendor.riskScore} Risk
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">{profileModalVendor.name}</h3>
                <span className="font-mono text-xs text-slate-400">ID: {profileModalVendor.code}</span>
              </div>
              <button
                onClick={() => setProfileModalVendor(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Performance Scorecard Interactive Slider */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-purple-600" />
                    Performance SLA Score
                  </span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-bold text-slate-900">
                      {profileModalVendor.performanceRating.toFixed(1)} / 5.0
                    </span>
                  </div>
                </div>

                {canManageVendors ? (
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">
                      Update SLA Rating (Procurement / Admin):
                    </label>
                    <input
                      type="range"
                      min="1.0"
                      max="5.0"
                      step="0.1"
                      value={profileModalVendor.performanceRating}
                      onChange={(e) =>
                        handleQuickRatingChange(profileModalVendor._id, parseFloat(e.target.value))
                      }
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    Rating changes require Procurement or Admin permissions.
                  </p>
                )}
              </div>

              {/* Contact Info */}
              <div className="space-y-1.5">
                <span className="font-bold text-slate-700 block">Contact Information</span>
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{profileModalVendor.contactPerson.name} ({profileModalVendor.contactPerson.email})</span>
                </div>
                {profileModalVendor.contactPerson.phone && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{profileModalVendor.contactPerson.phone}</span>
                  </div>
                )}
              </div>

              {/* Notes */}
              {profileModalVendor.notes && (
                <div>
                  <span className="font-bold text-slate-700 block mb-1">Audit Notes & Scope</span>
                  <p className="p-3 bg-slate-50 rounded-lg text-slate-600 border border-slate-200 leading-relaxed">
                    {profileModalVendor.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setProfileModalVendor(null)}
                className="px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-900"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
