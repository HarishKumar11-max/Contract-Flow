import React, { useState } from 'react';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext';
import { FileCheck2, Lock, Mail, ShieldAlert, ArrowRight, UserCheck } from 'lucide-react';
import { UserRole } from '../types/auth.types';

interface LoginPageProps {
  onSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const { login, quickSwitchRole, loading } = useAuth();
  const [email, setEmail] = useState('admin@clm.local');
  const [password, setPassword] = useState('Admin123!');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);
    try {
      await login(email, password);
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectDemo = async (role: UserRole) => {
    setErrorMsg(null);
    const demo = DEMO_ACCOUNTS.find((d) => d.role === role);
    if (demo) {
      setEmail(demo.email);
      setPassword(demo.password);
      try {
        await quickSwitchRole(role);
        onSuccess();
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to switch demo account');
      }
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'Admin': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Legal': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Procurement': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Finance': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Approver': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'Viewer': return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
          <FileCheck2 className="w-6 h-6" />
        </div>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">
          ContractFlow Portal
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Contract Lifecycle Management — Enterprise RBAC Suite
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-slate-200">
          {/* 1-Click Demo Accounts Quick-Select */}
          <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-700">
              <UserCheck className="w-4 h-4 text-blue-600" />
              <span>Instant Demo Account Switcher (Click to sign in immediately)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              {DEMO_ACCOUNTS.map((demo) => (
                <button
                  key={demo.role}
                  type="button"
                  onClick={() => handleSelectDemo(demo.role)}
                  className="flex flex-col items-start p-2.5 rounded-lg border border-slate-200 bg-white hover:border-blue-500 hover:shadow-xs transition-all text-left group"
                >
                  <div className="w-full flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getRoleBadgeColor(demo.role)}`}>
                      {demo.role}
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <span className="text-xs font-semibold text-slate-800 truncate w-full">{demo.name.split(' ')[0]}</span>
                  <span className="text-[10px] text-slate-400 truncate w-full">{demo.email}</span>
                </button>
              ))}
            </div>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-xs">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Email Address</label>
              <div className="mt-1 relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Password</label>
              <div className="mt-1 relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50"
            >
              {submitting ? 'Authenticating...' : 'Sign In to Portal'}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-200 pt-4 text-center">
            <span className="text-[11px] text-slate-400">
              ContractFlow SaaS — Protected by JWT authentication and Role-Based Access Control
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
