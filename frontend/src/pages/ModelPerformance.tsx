import React, { useState, useEffect } from 'react';
import {
  Gauge,
  Award,
  BarChart2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Cpu,
  RefreshCw,
  GitCompare,
  TrendingUp,
  Sliders,
  ShieldCheck
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { ModelMetrics } from '../types';
import { fetchModelMetrics } from '../services/api';

export const ModelPerformance: React.FC = () => {
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchModelMetrics();
      setMetrics(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load model evaluation metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  if (loading && !metrics) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Metrics Unavailable</h3>
        <p className="text-xs text-slate-500">{error || 'Please run model training pipeline first.'}</p>
        <button
          onClick={loadMetrics}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  const evalM = metrics.evaluation_metrics;
  const cm = metrics.confusion_matrix;
  const stats = metrics.dataset_stats;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Model Spec Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-mono">
              {metrics.version}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Algorithm: {metrics.model_type}
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900">{metrics.model_name}</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Trained on {new Date(metrics.trained_at).toLocaleString()} | Held-out stratified 20% test partition
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-semibold text-slate-700">Dataset Source</div>
            <div className="text-[11px] text-slate-400 font-mono">{metrics.dataset_metadata.mode}</div>
          </div>
          <button
            onClick={loadMetrics}
            className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
            title="Reload Metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Primary Test Set Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Precision</span>
          <div className="text-2xl font-extrabold text-blue-600 font-mono mt-1">
            {(evalM.precision * 100).toFixed(1)}%
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Low false alarm rate</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Recall (TPR)</span>
          <div className="text-2xl font-extrabold text-emerald-600 font-mono mt-1">
            {(evalM.recall * 100).toFixed(1)}%
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Frauds successfully caught</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">F1-Score</span>
          <div className="text-2xl font-extrabold text-indigo-600 font-mono mt-1">
            {evalM.f1_score.toFixed(3)}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Harmonic mean</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">ROC-AUC</span>
          <div className="text-2xl font-extrabold text-purple-600 font-mono mt-1">
            {evalM.roc_auc.toFixed(3)}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Discriminative power</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">False Positive Rate</span>
          <div className="text-2xl font-extrabold text-amber-600 font-mono mt-1">
            {(evalM.false_positive_rate * 100).toFixed(2)}%
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Legit txns falsely blocked</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Avg Latency</span>
          <div className="text-2xl font-extrabold text-slate-900 font-mono mt-1">
            {evalM.avg_inference_latency_ms} <span className="text-xs font-normal text-slate-400">ms</span>
          </div>
          <p className="text-[10px] text-emerald-600 font-semibold mt-1">P95: {evalM.p95_inference_latency_ms} ms</p>
        </div>
      </div>

      {/* Confusion Matrix and Feature Importances */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Confusion Matrix (5 Cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Held-Out Confusion Matrix (Test Set)</h3>
            <p className="text-xs text-slate-500">Evaluated on N = {cm.total_test.toLocaleString()} unseen validation records</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center my-4">
            {/* True Negatives */}
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                True Negatives (TN)
              </span>
              <div className="text-2xl font-extrabold font-mono text-emerald-900 my-1">
                {cm.true_negatives.toLocaleString()}
              </div>
              <span className="text-[11px] text-emerald-700">Correctly Approved Legit</span>
            </div>

            {/* False Positives */}
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                False Positives (FP)
              </span>
              <div className="text-2xl font-extrabold font-mono text-amber-900 my-1">
                {cm.false_positives.toLocaleString()}
              </div>
              <span className="text-[11px] text-amber-700">Legit Falsely Intercepted</span>
            </div>

            {/* False Negatives */}
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
              <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">
                False Negatives (FN)
              </span>
              <div className="text-2xl font-extrabold font-mono text-rose-900 my-1">
                {cm.false_negatives.toLocaleString()}
              </div>
              <span className="text-[11px] text-rose-700">Missed Fraud Leakage</span>
            </div>

            {/* True Positives */}
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                True Positives (TP)
              </span>
              <div className="text-2xl font-extrabold font-mono text-blue-900 my-1">
                {cm.true_positives.toLocaleString()}
              </div>
              <span className="text-[11px] text-blue-700">Intercepted Fraud</span>
            </div>
          </div>

          {/* Baseline comparison box */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
            <div className="flex items-center justify-between font-semibold text-slate-800">
              <span className="flex items-center gap-1.5">
                <GitCompare className="w-3.5 h-3.5 text-blue-600" /> Baseline Comparison:
              </span>
              <span className="font-mono text-[11px] text-slate-500">{metrics.baseline_comparison.model}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-1">
              <div>
                <span className="text-slate-400">Baseline Prec:</span>
                <div className="font-mono font-bold text-slate-700">
                  {(metrics.baseline_comparison.metrics.precision * 100).toFixed(1)}%
                </div>
              </div>
              <div>
                <span className="text-slate-400">Baseline Rec:</span>
                <div className="font-mono font-bold text-slate-700">
                  {(metrics.baseline_comparison.metrics.recall * 100).toFixed(1)}%
                </div>
              </div>
              <div>
                <span className="text-slate-400">Baseline F1:</span>
                <div className="font-mono font-bold text-slate-700">
                  {metrics.baseline_comparison.metrics.f1.toFixed(3)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Importance Chart (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Feature Importance Ranking</h3>
              <p className="text-xs text-slate-500">Gini impurity reduction across all decision tree estimators</p>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
              Random Forest
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={metrics.feature_importances}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
              >
                <XAxis type="number" domain={[0, 'dataMax + 0.05']} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis dataKey="feature" type="category" tick={{ fontSize: 10, fill: '#64748b' }} width={120} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  formatter={(val: any) => [`${(Number(val) * 100).toFixed(1)}% importance`, 'Weight']}
                />
                <Bar dataKey="importance" fill="#2563eb" radius={[0, 4, 4, 0]}>
                  {metrics.feature_importances.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 0 ? '#1d4ed8' : index <= 2 ? '#3b82f6' : '#60a5fa'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Engineering & Business Explanations */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Award className="w-4 h-4 text-blue-600" /> Why Precision vs Recall Balance Matters in Payment Fraud
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600 leading-relaxed">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> The Cost of False Positives
            </h4>
            <p>
              Blocking a genuine consumer creates friction, damages brand trust, and forfeits interchange fees.
              Maintaining a sub-0.5% False Positive Rate protects customer checkout conversion rates.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> The Cost of False Negatives
            </h4>
            <p>
              Missing a fraudulent charge incurs direct financial chargeback liability, scheme fines, and card reissuance costs.
              High Recall ensures over 80-90% of sophisticated fraud rings are intercepted instantly.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-600" /> Three-Tier Policy Solution
            </h4>
            <p>
              By inserting an intermediate <strong>VERIFY</strong> tier between Approve and Block, borderline transactions
              are challenged via low-friction 2FA rather than abruptly blocked, maximizing both security and retention.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
