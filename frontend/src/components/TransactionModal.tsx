import React from 'react';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  Clock,
  Cpu,
  Smartphone,
  UserCheck,
  TrendingUp,
  MapPin,
  CheckCircle,
  XCircle,
  FileText
} from 'lucide-react';
import { Transaction } from '../types';

interface TransactionModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  onVerifyAction?: (transactionId: string, action: 'APPROVE' | 'REJECT') => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  transaction,
  onClose,
  onVerifyAction
}) => {
  if (!transaction) return null;

  const decisionStyles = {
    APPROVE: {
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      icon: ShieldCheck,
      badge: 'bg-emerald-500 text-white',
      desc: 'Passed all safety checks. Legitimate baseline matched.'
    },
    VERIFY: {
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: AlertTriangle,
      badge: 'bg-amber-500 text-white',
      desc: 'Borderline anomaly detected. Elevated authentication required.'
    },
    BLOCK: {
      bg: 'bg-rose-50 text-rose-800 border-rose-200',
      icon: ShieldAlert,
      badge: 'bg-rose-600 text-white',
      desc: 'High-confidence fraud pattern detected. Automated block enforced.'
    }
  };

  const style = decisionStyles[transaction.decision] || decisionStyles.APPROVE;
  const DecisionIcon = style.icon;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#090b14]/95 rounded-2xl shadow-2xl border border-white/20 text-bone w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 ${style.badge}`}>
              <DecisionIcon className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm sm:text-base font-bold text-slate-900">{transaction.transaction_id}</span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${style.badge}`}>
                  {transaction.decision}
                </span>
                {transaction.verification_status !== 'NONE' && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    Status: {transaction.verification_status}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Timestamp: {new Date(transaction.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[11px] font-medium text-slate-400 uppercase">Amount</span>
              <div className="text-lg font-bold text-slate-900 mt-0.5 font-mono">
                ${transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[11px] font-medium text-slate-400 uppercase">Risk Score</span>
              <div className="text-lg font-bold text-slate-900 mt-0.5 font-mono">
                {transaction.risk_score} <span className="text-xs text-slate-400 font-normal">/ 100</span>
              </div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[11px] font-medium text-slate-400 uppercase">Risk Level</span>
              <div className={`text-base font-bold mt-0.5 ${
                transaction.risk_level === 'HIGH' ? 'text-rose-600' :
                transaction.risk_level === 'MEDIUM' ? 'text-amber-600' : 'text-emerald-600'
              }`}>
                {transaction.risk_level}
              </div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[11px] font-medium text-slate-400 uppercase">Inference Time</span>
              <div className="text-lg font-bold text-slate-900 mt-0.5 font-mono">
                {transaction.inference_time_ms} <span className="text-xs text-slate-400 font-normal">ms</span>
              </div>
            </div>
          </div>

          {/* Model Decision & Explainability Reasons */}
          <div className={`p-4 rounded-xl border ${style.bg}`}>
            <h4 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileText className="w-4 h-4" /> AI Risk Assessment & Explainability
            </h4>
            <p className="text-xs font-medium mb-3">{style.desc}</p>
            <div className="space-y-1.5">
              {transaction.reasons.map((r, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                  <span className="text-slate-800">{r}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Feature Matrix */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Engine Feature Telemetry
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-slate-400" /> Device Fingerprint:
                </span>
                <span className={`font-semibold ${transaction.is_new_device ? 'text-amber-600' : 'text-slate-700'}`}>
                  {transaction.is_new_device ? 'New Device' : 'Recognized Device'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400" /> Beneficiary Recipient:
                </span>
                <span className={`font-semibold ${transaction.is_new_beneficiary ? 'text-amber-600' : 'text-slate-700'}`}>
                  {transaction.is_new_beneficiary ? 'New Beneficiary' : 'Known Recipient'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-slate-400" /> Amount Deviation Ratio:
                </span>
                <span className="font-mono font-semibold text-slate-800">
                  {transaction.amount_deviation_score.toFixed(1)}x baseline
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> Geo / IP Anomaly Score:
                </span>
                <span className="font-mono font-semibold text-slate-800">
                  {transaction.location_risk_score.toFixed(2)} / 1.00
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> Transaction Hour:
                </span>
                <span className="font-mono font-semibold text-slate-800">
                  {transaction.transaction_hour.toString().padStart(2, '0')}:00
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-slate-400" /> 24h Velocity Count:
                </span>
                <span className="font-mono font-semibold text-slate-800">
                  {transaction.transaction_frequency_24h} transactions
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 rounded-b-2xl flex items-center justify-between">
          <div className="text-[11px] text-slate-500 font-mono">
            Model: RF-Ensemble | P(fraud) = {(transaction.fraud_probability * 100).toFixed(1)}%
          </div>

          <div className="flex items-center gap-2">
            {transaction.decision === 'VERIFY' && onVerifyAction && transaction.verification_status !== 'VERIFIED' && (
              <>
                <button
                  onClick={() => onVerifyAction(transaction.transaction_id, 'REJECT')}
                  className="px-3.5 py-2 text-xs font-semibold text-rose-300 bg-rose-950/40 border border-rose-500/40 rounded-xl hover:bg-rose-900/60 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </button>
                <button
                  onClick={() => onVerifyAction(transaction.transaction_id, 'APPROVE')}
                  className="px-3.5 py-2 text-xs font-semibold text-emerald-200 bg-emerald-950/60 border border-emerald-500/40 rounded-xl hover:bg-emerald-900/60 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Approve in Review
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-white bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-colors cursor-pointer shadow-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
