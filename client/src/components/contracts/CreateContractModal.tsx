import React, { useState, useEffect } from 'react';
import { vendorService } from '../../services/vendor.service';
import { contractService } from '../../services/contract.service';
import { Vendor } from '../../types/vendor.types';
import { ContractType, RenewalType } from '../../types/contract.types';
import { X, FileText, DollarSign, Calendar, ShieldCheck, Loader2 } from 'lucide-react';

interface CreateContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newContract: any) => void;
}

export const CreateContractModal: React.FC<CreateContractModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loadingVendors, setLoadingVendors] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ContractType>('Vendor Agreement');
  const [vendorId, setVendorId] = useState('');
  const [value, setValue] = useState<number>(25000);
  const [currency, setCurrency] = useState('INR');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [renewalType, setRenewalType] = useState<RenewalType>('Manual Review');
  const [renewalNoticeDays, setRenewalNoticeDays] = useState<number>(30);
  const [department, setDepartment] = useState('Operations');
  const [tagsInput, setTagsInput] = useState('Cloud, IT, SaaS');

  useEffect(() => {
    if (isOpen) {
      const loadVendors = async () => {
        try {
          setLoadingVendors(true);
          const res = await vendorService.getVendors({ limit: 100, status: 'Active' });
          setVendors(res.vendors);
          if (res.vendors.length > 0 && !vendorId) {
            setVendorId(res.vendors[0]._id);
          }
        } catch (err: any) {
          setErrorMsg('Failed to load active vendors list.');
        } finally {
          setLoadingVendors(false);
        }
      };
      loadVendors();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorId) {
      setErrorMsg('Please select an active vendor.');
      return;
    }

    setErrorMsg(null);
    setSubmitting(true);

    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const res = await contractService.createContract({
        title,
        description,
        type,
        vendorId,
        value: Number(value),
        currency,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        renewalType,
        renewalNoticeDays: Number(renewalNoticeDays),
        department,
        tags,
      });

      onCreated(res.contract);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to create contract draft.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full overflow-hidden my-8">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Draft New Enterprise Contract</h3>
              <p className="text-[11px] text-slate-400">Initialize contract lifecycle in Draft status</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Title & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contract Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Master Services Agreement for Cloud Infrastructure"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Agreement Type *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ContractType)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="MSA">MSA</option>
                <option value="NDA">NDA</option>
                <option value="SOW">SOW</option>
                <option value="SLA">SLA</option>
                <option value="Vendor Agreement">Vendor Agreement</option>
                <option value="Employment">Employment</option>
                <option value="License">License</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Vendor Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Counterparty Vendor *</label>
              {loadingVendors ? (
                <div className="py-2 text-xs text-slate-400 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Loading suppliers...</span>
                </div>
              ) : (
                <select
                  required
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {vendors.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.name} ({v.code})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Internal Department</label>
              <input
                type="text"
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Engineering, IT, Operations..."
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Financial Value */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Financial Terms
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Monetary Value *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">$</span>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    required
                    value={value}
                    onChange={(e) => setValue(parseFloat(e.target.value))}
                    className="w-full pl-7 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Currency</label>
                <input
                  type="text"
                  readOnly
                  value={currency}
                  className="w-full px-3 py-1.5 text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Dates & Expiration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Effective Start Date *</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End / Expiration Date *</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Renewal Policy */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Renewal Strategy</label>
              <select
                value={renewalType}
                onChange={(e) => setRenewalType(e.target.value as RenewalType)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="Manual Review">Manual Review (Alert before expiry)</option>
                <option value="Auto-Renew">Auto-Renew (Automatic term extension)</option>
                <option value="Do Not Renew">Do Not Renew (Strict termination)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Renewal Notice Period (Days)</label>
              <input
                type="number"
                min="7"
                max="180"
                value={renewalNoticeDays}
                onChange={(e) => setRenewalNoticeDays(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Description & Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Scope & Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Commercial scope, SLA commitments, deliverables..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tags (Comma-separated)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="SaaS, Infrastructure, Critical"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              {submitting ? 'Generating Contract...' : 'Create Contract Draft'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
