import React, { useState } from 'react';
import { ShieldAlert, CheckCircle2, XCircle, Smartphone, KeyRound, AlertTriangle } from 'lucide-react';
import { Transaction } from '../types';

interface VerificationModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (transactionId: string) => void;
  onReject: (transactionId: string) => void;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  transaction,
  isOpen,
  onClose,
  onConfirm,
  onReject
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [simulatedCode, setSimulatedCode] = useState('482-910');

  if (!isOpen || !transaction) return null;

  const handleApprove = () => {
    setSubmitting(true);
    setTimeout(() => {
      onConfirm(transaction.transaction_id);
      setSubmitting(false);
      onClose();
    }, 600);
  };

  const handleBlock = () => {
    setSubmitting(true);
    setTimeout(() => {
      onReject(transaction.transaction_id);
      setSubmitting(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Banner */}
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-5 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">Step-Up Verification Required</h3>
              <p className="text-xs text-amber-100">Simulated 2-Factor Authentication Flow</p>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="p-6 space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
            <span className="font-semibold block mb-1">Risk Evaluation Notice:</span>
            Transaction <strong>{transaction.transaction_id}</strong> (${transaction.amount.toFixed(2)}) triggered a
            medium-risk threshold (Risk Score: <strong>{transaction.risk_score}/100</strong>).
          </div>

          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-700">Simulated Verification Challenge:</span>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-5 h-5 text-slate-500" />
                <div>
                  <div className="text-xs font-semibold text-slate-800">Push Challenge Sent</div>
                  <div className="text-[11px] text-slate-500">Security Token: {simulatedCode}</div>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-semibold">
                Simulated OK
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
            * Demonstration mode: This is a safe simulated verification flow. No real SMS, OTPs, or financial accounts are used.
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleBlock}
              disabled={submitting}
              className="w-full py-2.5 px-3 rounded-xl border border-rose-300 text-rose-700 font-semibold text-xs hover:bg-rose-50 transition-colors flex items-center justify-center gap-1.5"
            >
              <XCircle className="w-4 h-4" /> Flag & Reject
            </button>
            <button
              onClick={handleApprove}
              disabled={submitting}
              className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-600/30 flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" /> Confirm & Approve
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
