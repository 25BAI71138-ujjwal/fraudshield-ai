import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Info,
  CheckCircle2,
  RefreshCw,
  PieChart as PieIcon,
  Layers
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend
} from 'recharts';
import { AnalyticsData, DashboardSummary } from '../types';
import { fetchAnalytics, fetchDashboardSummary } from '../services/api';

export const FraudAnalysis: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [anaRes, sumRes] = await Promise.all([
        fetchAnalytics(),
        fetchDashboardSummary()
      ]);
      setAnalytics(anaRes);
      setSummary(sumRes);
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading && !analytics) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  const channelColors: Record<string, string> = {
    UPI: '#3b82f6',
    CREDIT_CARD: '#8b5cf6',
    DEBIT_CARD: '#06b6d4',
    NET_BANKING: '#f97316'
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Notice Banner: Scientific / Analytical Context */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3 text-blue-900 text-xs">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold">Analytical Distinction & Risk Methodology:</span>{' '}
          In financial cybersecurity, a <strong>BLOCK</strong> decision is an automated risk-mitigation policy
          enacted to protect liquidity and prevent chargebacks—it is not definitive evidence of criminal activity.
          These charts reflect real metrics computed from your local transaction database combined with model inference telemetry.
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={loadData} className="font-semibold underline">Retry</button>
        </div>
      )}

      {/* Row 1: Common Reasons and Hourly Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Flagging Reasons */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Top Anomaly & Flagging Triggers</h3>
              <p className="text-xs text-slate-500">Most frequent heuristic and statistical triggers in flagged traffic</p>
            </div>
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[11px]">
              Top 6 Drivers
            </span>
          </div>

          <div className="space-y-3">
            {analytics?.top_reasons && analytics.top_reasons.length > 0 ? (
              analytics.top_reasons.map((r, i) => {
                const maxCount = Math.max(...analytics.top_reasons.map((x) => x.count), 1);
                const pct = Math.round((r.count / maxCount) * 100);
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">{r.reason}</span>
                      <span className="font-mono text-slate-500 font-bold">{r.count} incidents</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-xs text-slate-400 py-8 text-center">
                No high-risk reasons recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Hourly Risk Concentration */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Fraud Propensity by Time of Day</h3>
              <p className="text-xs text-slate-500">Average model risk score plotted across 24 hourly buckets</p>
            </div>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>

          <div className="h-64 w-full">
            {analytics?.hourly_trends ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.hourly_trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="hour" tick={{ fontSize: 9, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="avg_risk" name="Avg Risk Score" radius={[3, 3, 0, 0]}>
                    {analytics.hourly_trends.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.avg_risk >= 60 ? '#ef4444' : entry.avg_risk >= 30 ? '#f59e0b' : '#3b82f6'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </div>
      </div>

      {/* Row 2: Channel Breakdown and Attack Patterns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Channel Analysis */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Channel Security Performance</h3>
              <p className="text-xs text-slate-500">Volume and decision breakdown by payment rail</p>
            </div>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>

          <div className="h-64 w-full">
            {analytics?.payment_channels ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.payment_channels} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="channel" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="approved" name="Approved" stackId="a" fill="#10b981" />
                  <Bar dataKey="verified" name="Verified" stackId="a" fill="#f59e0b" />
                  <Bar dataKey="blocked" name="Blocked" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </div>

        {/* Pattern Fingerprint Summary */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">High-Risk Attack Signatures</h3>
            <p className="text-xs text-slate-500 mb-4">Key behavioral patterns identified by ensemble rules</p>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="font-semibold text-slate-900 flex items-center justify-between">
                  <span>Account Takeover (ATO)</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">Critical</span>
                </div>
                <p className="text-slate-500 mt-1 text-[11px]">
                  New unrecognized device paired with newly created beneficiary and immediate high transfer.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="font-semibold text-slate-900 flex items-center justify-between">
                  <span>Velocity Storms</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">Elevated</span>
                </div>
                <p className="text-slate-500 mt-1 text-[11px]">
                  Rapid automated bursts ({'>'} 12 txns/24h) attempting to drain wallet limits.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="font-semibold text-slate-900 flex items-center justify-between">
                  <span>Credential Fatigue</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">Elevated</span>
                </div>
                <p className="text-slate-500 mt-1 text-[11px]">
                  Multiple recent failed PIN/CVV authentications preceding the current checkout.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400">
            Ensemble Decision Tree depth: 10 levels
          </div>
        </div>
      </div>
    </div>
  );
};
