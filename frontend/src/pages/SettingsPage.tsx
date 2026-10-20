import React, { useState, useEffect } from 'react';
import {
  Settings,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Database,
  Shield,
  Save,
  HelpCircle
} from 'lucide-react';
import { PolicySettings } from '../types';
import { fetchSettings, updateSettings, seedDemo, resetDemo } from '../services/api';

interface SettingsPageProps {
  onRefreshData?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onRefreshData }) => {
  const [approveThresh, setApproveThresh] = useState<number>(30);
  const [verifyThresh, setVerifyThresh] = useState<number>(70);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [seedCount, setSeedCount] = useState<number>(40);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchSettings();
      setApproveThresh(res.approve_threshold);
      setVerifyThresh(res.verify_threshold);
    } catch (err: any) {
      setError(err.message || 'Failed to load policy settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSaveSuccess(false);

      if (verifyThresh <= approveThresh) {
        setError('Verify threshold must be strictly greater than Approve threshold.');
        return;
      }

      await updateSettings(approveThresh, verifyThresh);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setError(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSeed = async () => {
    try {
      setActionMessage(null);
      const res = await seedDemo(seedCount);
      setActionMessage(`Success: Injected ${res.count} realistic simulated transactions.`);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setError(err.message || 'Failed to seed demo records');
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to clear all recorded transaction history?')) return;
    try {
      setActionMessage(null);
      await resetDemo();
      setActionMessage('All transaction records cleared from SQLite database.');
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setError(err.message || 'Failed to reset database');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Title */}
      <div>
        <h2 className="text-base font-bold text-slate-900">Risk Policy & Engine Settings</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure decision policy threshold boundaries and manage local demo database state.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="font-semibold underline">Dismiss</button>
        </div>
      )}

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Decision policy thresholds updated successfully in SQLite backend.</span>
        </div>
      )}

      {actionMessage && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-blue-600" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Decision Threshold Policy Settings */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" /> Three-Tier Decision Boundaries
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Adjust the risk score cutoffs (0-100) determining APPROVE, VERIFY, and BLOCK
            </p>
          </div>
        </div>

        {/* Visual Policy Bar */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <span className="text-xs font-semibold text-slate-700 block">Visual Policy Spectrum:</span>
          <div className="h-4 rounded-lg overflow-hidden flex text-[10px] font-bold text-white text-center font-mono">
            <div
              className="bg-emerald-500 flex items-center justify-center transition-all duration-300"
              style={{ width: `${approveThresh}%` }}
              title={`APPROVE: 0 to ${approveThresh - 1}`}
            >
              APPROVE (0 - {approveThresh - 1})
            </div>
            <div
              className="bg-amber-500 flex items-center justify-center transition-all duration-300"
              style={{ width: `${verifyThresh - approveThresh}%` }}
              title={`VERIFY: ${approveThresh} to ${verifyThresh - 1}`}
            >
              VERIFY ({approveThresh} - {verifyThresh - 1})
            </div>
            <div
              className="bg-rose-500 flex items-center justify-center transition-all duration-300"
              style={{ width: `${100 - verifyThresh}%` }}
              title={`BLOCK: ${verifyThresh} to 100`}
            >
              BLOCK ({verifyThresh} - 100)
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Approve Threshold Slider */}
          <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="font-bold text-emerald-800">
                Low-Risk Cutoff (Approve): &lt; {approveThresh}
              </label>
              <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                {approveThresh}
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="50"
              value={approveThresh}
              onChange={(e) => setApproveThresh(parseInt(e.target.value))}
              className="w-full accent-emerald-600"
            />
            <p className="text-[11px] text-slate-500">
              Transactions scoring below {approveThresh} are automatically approved with zero friction.
            </p>
          </div>

          {/* Verify Threshold Slider */}
          <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="font-bold text-rose-800">
                High-Risk Cutoff (Block): &ge; {verifyThresh}
              </label>
              <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                {verifyThresh}
              </span>
            </div>
            <input
              type="range"
              min="55"
              max="95"
              value={verifyThresh}
              onChange={(e) => setVerifyThresh(parseInt(e.target.value))}
              className="w-full accent-rose-600"
            />
            <p className="text-[11px] text-slate-500">
              Transactions scoring {verifyThresh} or higher are immediately blocked from settlement.
            </p>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Policy Settings'}
          </button>
        </div>
      </div>

      {/* Demo Data Management */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-600" /> Demonstration Data Controls
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Seed realistic multi-channel mock payments or reset the local SQLite database.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Seed Card */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3 text-xs">
            <div className="font-bold text-slate-900">Generate Simulated Traffic Stream</div>
            <p className="text-slate-500 text-[11px]">
              Inserts transactions spanning UPI, Cards, and Net Banking across past 48 hours.
            </p>
            <div className="flex items-center gap-2">
              <select
                value={seedCount}
                onChange={(e) => setSeedCount(parseInt(e.target.value))}
                className="py-1.5 px-3 bg-white border border-slate-200 rounded-lg text-xs font-medium"
              >
                <option value="25">25 Transactions</option>
                <option value="50">50 Transactions</option>
                <option value="100">100 Transactions</option>
              </select>
              <button
                onClick={handleSeed}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs transition-colors"
              >
                Generate Data
              </button>
            </div>
          </div>

          {/* Reset Card */}
          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 space-y-3 text-xs flex flex-col justify-between">
            <div>
              <div className="font-bold text-rose-900">Purge Transaction History</div>
              <p className="text-rose-700 text-[11px] mt-1">
                Deletes all recorded transaction rows in SQLite to start fresh demonstration tests.
              </p>
            </div>
            <div>
              <button
                onClick={handleReset}
                className="px-4 py-1.5 bg-white border border-rose-300 hover:bg-rose-100 text-rose-700 font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Clear All Records
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Disclaimer */}
      <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 text-[11px] space-y-1">
        <span className="font-semibold text-slate-700 block">Demonstration Architecture Notice:</span>
        <p>
          Dhanrakshak AI is designed exclusively as an offline educational and hackathon prototype.
          It does not interact with live core-banking APIs, card network gateways, or real customer credentials.
          All predictions and blocks occur strictly within the simulated local environment.
        </p>
      </div>
    </div>
  );
};
