import React, { useState, useRef } from 'react';
import {
  SlidersHorizontal,
  Zap,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  Clock,
  Cpu,
  Smartphone,
  UserCheck,
  TrendingUp,
  MapPin,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { PredictPayload, Transaction } from '../types';
import { predictTransaction } from '../services/api';
import { VerificationModal } from '../components/VerificationModal';

interface SimulatorProps {
  onTransactionLogged?: () => void;
}

export const Simulator: React.FC<SimulatorProps> = ({ onTransactionLogged }) => {
  const resultRef = useRef<HTMLDivElement>(null);

  // Form State matching model feature schema
  const [amount, setAmount] = useState<number>(45.0);
  const [transactionHour, setTransactionHour] = useState<number>(14);
  const [frequency24h, setFrequency24h] = useState<number>(2);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [isNewDevice, setIsNewDevice] = useState<number>(0);
  const [isNewBeneficiary, setIsNewBeneficiary] = useState<number>(0);
  const [deviationScore, setDeviationScore] = useState<number>(1.0);
  const [locationRisk, setLocationRisk] = useState<number>(0.05);
  const [paymentMethod, setPaymentMethod] = useState<string>('UPI');
  const [merchantCategory, setMerchantCategory] = useState<string>('Retail');

  // Execution state
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Transaction | null>(null);

  // Verification modal state
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState<boolean>(false);

  // Preset Scenarios
  const presets = [
    {
      id: 'normal',
      title: '1. Normal Transaction',
      desc: 'Routine lunch purchase on familiar device',
      data: {
        amount: 28.5,
        hour: 13,
        freq: 2,
        failed: 0,
        newDev: 0,
        newBene: 0,
        deviation: 0.9,
        loc: 0.05,
        method: 'UPI',
        cat: 'Food & Dining'
      }
    },
    {
      id: 'large_payment',
      title: '2. Unusually Large Payment',
      desc: 'Sudden high ticket item 8.5x normal volume',
      data: {
        amount: 3800.0,
        hour: 16,
        freq: 3,
        failed: 0,
        newDev: 0,
        newBene: 0,
        deviation: 8.5,
        loc: 0.15,
        method: 'CREDIT_CARD',
        cat: 'Electronics'
      }
    },
    {
      id: 'velocity',
      title: '3. Rapid Velocity Burst',
      desc: 'Automated rapid fire transfers (24 in 24h)',
      data: {
        amount: 140.0,
        hour: 21,
        freq: 24,
        failed: 1,
        newDev: 0,
        newBene: 1,
        deviation: 2.2,
        loc: 0.3,
        method: 'UPI',
        cat: 'Gaming'
      }
    },
    {
      id: 'ato',
      title: '4. Account Takeover (ATO)',
      desc: 'Brand new device with new recipient',
      data: {
        amount: 2400.0,
        hour: 23,
        freq: 5,
        failed: 1,
        newDev: 1,
        newBene: 1,
        deviation: 5.0,
        loc: 0.65,
        method: 'NET_BANKING',
        cat: 'Transfer'
      }
    },
    {
      id: 'brute_force',
      title: '5. Multiple Failed Attempts',
      desc: '4 PIN/OTP failures right before checkout',
      data: {
        amount: 650.0,
        hour: 2,
        freq: 6,
        failed: 4,
        newDev: 1,
        newBene: 0,
        deviation: 3.0,
        loc: 0.55,
        method: 'DEBIT_CARD',
        cat: 'Retail'
      }
    },
    {
      id: 'multi_vector',
      title: '6. Suspicious Multi-Vector',
      desc: 'Critical compound attack at 3:00 AM',
      data: {
        amount: 8900.0,
        hour: 3,
        freq: 28,
        failed: 4,
        newDev: 1,
        newBene: 1,
        deviation: 14.0,
        loc: 0.92,
        method: 'NET_BANKING',
        cat: 'Transfer'
      }
    }
  ];

  const applyPreset = (preset: typeof presets[0]) => {
    setAmount(preset.data.amount);
    setTransactionHour(preset.data.hour);
    setFrequency24h(preset.data.freq);
    setFailedAttempts(preset.data.failed);
    setIsNewDevice(preset.data.newDev);
    setIsNewBeneficiary(preset.data.newBene);
    setDeviationScore(preset.data.deviation);
    setLocationRisk(preset.data.loc);
    setPaymentMethod(preset.data.method);
    setMerchantCategory(preset.data.cat);
    setResult(null);
    setError(null);
  };

  const handleReset = () => {
    applyPreset(presets[0]);
    setResult(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    try {
      setLoading(true);
      setError(null);

      const payload: PredictPayload = {
        amount,
        transaction_hour: transactionHour,
        transaction_frequency_24h: frequency24h,
        failed_attempts_24h: failedAttempts,
        is_new_device: isNewDevice,
        is_new_beneficiary: isNewBeneficiary,
        amount_deviation_score: deviationScore,
        location_risk_score: locationRisk,
        payment_method: paymentMethod,
        merchant_category: merchantCategory
      };

      const res = await predictTransaction(payload);
      setResult(res);
      if (onTransactionLogged) onTransactionLogged();
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    } catch (err: any) {
      setError(err.message || 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  const decisionStyles = {
    APPROVE: {
      border: 'border-emerald-300',
      bg: 'bg-emerald-50',
      badge: 'bg-emerald-500 text-white',
      text: 'text-emerald-900',
      icon: ShieldCheck,
      banner: 'Transaction Approved (Safe)'
    },
    VERIFY: {
      border: 'border-amber-300',
      bg: 'bg-amber-50',
      badge: 'bg-amber-500 text-white',
      text: 'text-amber-900',
      icon: AlertTriangle,
      banner: 'Step-Up Verification Required'
    },
    BLOCK: {
      border: 'border-rose-300',
      bg: 'bg-rose-50',
      badge: 'bg-rose-600 text-white',
      text: 'text-rose-900',
      icon: ShieldAlert,
      banner: 'Transaction Intercepted & Blocked'
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Preset Scenario Selector */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Pre-Configured Attack & Baseline Presets</h3>
          </div>
          <span className="text-[11px] text-slate-500">Tap any scenario to populate form telemetry</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {presets.map((p) => (
            <button
              key={p.id}
              onClick={() => applyPreset(p)}
              className="p-2.5 sm:p-3 text-left rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-blue-50/60 hover:border-blue-300 transition-all text-xs group"
            >
              <div className="font-semibold text-slate-900 group-hover:text-blue-700 leading-tight">
                {p.title}
              </div>
              <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                {p.desc}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Form Left, Real-Time Prediction Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Input Form (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Transaction Feature Parameters</h3>
              <p className="text-xs text-slate-500">Direct inputs fed into the active Random Forest classifier</p>
            </div>
            <button
              onClick={handleReset}
              className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1 font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Form
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Amount */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Transaction Amount ($)
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Deviation Score */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Spending Deviation Ratio ({deviationScore.toFixed(1)}x)
              </label>
              <input
                type="range"
                min="0.2"
                max="20.0"
                step="0.1"
                value={deviationScore}
                onChange={(e) => setDeviationScore(parseFloat(e.target.value))}
                className="w-full accent-blue-600 mt-2"
              />
              <span className="text-[10px] text-slate-400">1.0 = normal baseline | &gt;4x = abnormal surge</span>
            </div>

            {/* Transaction Hour */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Hour of Day: {transactionHour.toString().padStart(2, '0')}:00
              </label>
              <input
                type="range"
                min="0"
                max="23"
                value={transactionHour}
                onChange={(e) => setTransactionHour(parseInt(e.target.value))}
                className="w-full accent-blue-600 mt-2"
              />
              <span className="text-[10px] text-slate-400">Night window (0-4 AM) flags elevated risk</span>
            </div>

            {/* 24h Frequency */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                24h Velocity: {frequency24h} transactions
              </label>
              <input
                type="range"
                min="1"
                max="50"
                value={frequency24h}
                onChange={(e) => setFrequency24h(parseInt(e.target.value))}
                className="w-full accent-blue-600 mt-2"
              />
              <span className="text-[10px] text-slate-400">&gt; 12 txns in 24h indicates velocity attack</span>
            </div>

            {/* Failed Attempts */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Recent Failed Attempts (24h)
              </label>
              <select
                value={failedAttempts}
                onChange={(e) => setFailedAttempts(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="0">0 (Normal authentication)</option>
                <option value="1">1 (Single typo)</option>
                <option value="2">2 (Repeated failure)</option>
                <option value="3">3 (PIN Lock Warning)</option>
                <option value="4">4+ (Brute force suspect)</option>
              </select>
            </div>

            {/* Location Risk */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Geo / IP Anomaly Score: {locationRisk.toFixed(2)}
              </label>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={locationRisk}
                onChange={(e) => setLocationRisk(parseFloat(e.target.value))}
                className="w-full accent-blue-600 mt-2"
              />
              <span className="text-[10px] text-slate-400">0.0 = Trusted home network | 1.0 = VPN / Distant Proxy</span>
            </div>

            {/* Device Toggle */}
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <span className="font-semibold text-slate-800 block">Novel / Unrecognized Device</span>
                <span className="text-[11px] text-slate-400">Device footprint not in 90-day history</span>
              </div>
              <input
                type="checkbox"
                checked={isNewDevice === 1}
                onChange={(e) => setIsNewDevice(e.target.checked ? 1 : 0)}
                className="w-4 h-4 accent-blue-600 rounded"
              />
            </div>

            {/* Beneficiary Toggle */}
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <span className="font-semibold text-slate-800 block">First-Time Beneficiary</span>
                <span className="text-[11px] text-slate-400">Recipient never transacted with before</span>
              </div>
              <input
                type="checkbox"
                checked={isNewBeneficiary === 1}
                onChange={(e) => setIsNewBeneficiary(e.target.checked ? 1 : 0)}
                className="w-4 h-4 accent-blue-600 rounded"
              />
            </div>

            {/* Payment Method */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="UPI">UPI (Instant Peer-to-Merchant)</option>
                <option value="CREDIT_CARD">Credit Card (EMV / Online 3DS)</option>
                <option value="DEBIT_CARD">Debit Card (PIN Checked)</option>
                <option value="NET_BANKING">Net Banking (Wire / RTGS)</option>
              </select>
            </div>

            {/* Merchant Category */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Merchant Category</label>
              <select
                value={merchantCategory}
                onChange={(e) => setMerchantCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="Retail">Retail & E-Commerce</option>
                <option value="Food & Dining">Food & Dining</option>
                <option value="Electronics">Electronics & Hardware</option>
                <option value="Transfer">P2P Account Transfer</option>
                <option value="Gaming">Online Gaming / Digital Goods</option>
                <option value="Travel">Airlines & Hotels</option>
              </select>
            </div>
          </div>

          <div className="pt-3">
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Computing Real-Time Risk Score...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-white" />
                  <span>Analyse Transaction in Real Time</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <strong className="block font-semibold">Inference / Connection Error:</strong>
                <span className="leading-relaxed">{error}</span>
              </div>
              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-semibold shrink-0 transition-colors flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                Retry
              </button>
            </div>
          )}
        </div>

        {/* Right Prediction Results (5 Cols) */}
        <div ref={resultRef} className="lg:col-span-5 flex flex-col scroll-mt-20">
          {result ? (
            <div className={`bg-white rounded-2xl border-2 ${decisionStyles[result.decision].border} p-6 shadow-sm space-y-5 flex-1 flex flex-col justify-between`}>
              <div>
                {/* Result Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${decisionStyles[result.decision].badge}`}>
                      {result.decision === 'APPROVE' && <ShieldCheck className="w-5 h-5" />}
                      {result.decision === 'VERIFY' && <AlertTriangle className="w-5 h-5" />}
                      {result.decision === 'BLOCK' && <ShieldAlert className="w-5 h-5" />}
                    </div>
                    <div>
                      <span className="font-mono text-xs font-bold text-slate-500">{result.transaction_id}</span>
                      <h4 className="text-sm font-bold text-slate-900">{decisionStyles[result.decision].banner}</h4>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${decisionStyles[result.decision].badge}`}>
                    {result.decision}
                  </span>
                </div>

                {/* Score Gauge / Meter */}
                <div className="my-5 p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Model Risk Probability
                  </span>
                  <div className="text-4xl font-extrabold font-mono text-slate-900 my-1">
                    {result.risk_score} <span className="text-sm font-normal text-slate-400">/ 100</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden my-2">
                    <div
                      className={`h-full transition-all duration-700 ${
                        result.risk_score >= 70 ? 'bg-rose-500' :
                        result.risk_score >= 30 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${result.risk_score}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 font-mono">
                    <span>Safe (&lt;30)</span>
                    <span>Verify (30-69)</span>
                    <span>Block (70+)</span>
                  </div>
                </div>

                {/* Explainability Breakdown */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                    Model Reasoning & Rules Triggered
                  </span>
                  <div className="space-y-1.5">
                    {result.reasons.map((r, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Actions based on Decision */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Inference Latency: <strong>{result.inference_time_ms} ms</strong></span>
                  <span>Ensemble: <strong>v1.2.0</strong></span>
                </div>

                {result.decision === 'VERIFY' && (
                  <button
                    onClick={() => setIsVerifyModalOpen(true)}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5"
                  >
                    <AlertTriangle className="w-4 h-4" /> Trigger Simulated 2FA Verification
                  </button>
                )}

                {result.decision === 'BLOCK' && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Transaction successfully stopped before checkout execution.</span>
                  </div>
                )}

                {result.decision === 'APPROVE' && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Transaction approved with zero friction. Instant settlement permitted.</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
                <SlidersHorizontal className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">Awaiting Transaction Parameters</h4>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                Select a preset scenario above or tune custom parameters, then click{' '}
                <strong>Analyse Transaction</strong> to execute real-time model inference.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Mock Verification Modal */}
      <VerificationModal
        transaction={result}
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        onConfirm={(id) => {
          if (result) {
            setResult({
              ...result,
              verification_status: 'VERIFIED',
              decision: 'APPROVE'
            });
          }
        }}
        onReject={(id) => {
          if (result) {
            setResult({
              ...result,
              verification_status: 'REJECTED',
              decision: 'BLOCK'
            });
          }
        }}
      />
    </div>
  );
};
