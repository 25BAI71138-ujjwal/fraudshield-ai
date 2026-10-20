import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  Activity,
  Zap,
  TrendingUp,
  ArrowUpRight,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  Layers,
  ChevronRight,
  Database
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';
import { DashboardSummary, Transaction, AnalyticsData } from '../types';
import { fetchDashboardSummary, fetchTransactions, fetchAnalytics, seedDemo } from '../services/api';

interface OverviewProps {
  onSelectTransaction: (txn: Transaction) => void;
  onNavigateToSimulator: () => void;
  onNavigateToLive: () => void;
}

export const Overview: React.FC<OverviewProps> = ({
  onSelectTransaction,
  onNavigateToSimulator,
  onNavigateToLive
}) => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentTxns, setRecentTxns] = useState<Transaction[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [seeding, setSeeding] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [sumRes, txnsRes, anaRes] = await Promise.all([
        fetchDashboardSummary(),
        fetchTransactions({ page: 1, limit: 7 }),
        fetchAnalytics()
      ]);
      setSummary(sumRes);
      setRecentTxns(txnsRes.transactions);
      setAnalytics(anaRes);
    } catch (err: any) {
      setError(err.message || 'Failed to load overview data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSeed = async () => {
    try {
      setSeeding(true);
      await seedDemo(35);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Seeding failed');
    } finally {
      setSeeding(false);
    }
  };

  const DECISION_COLORS = {
    APPROVE: '#10b981',
    VERIFY: '#f59e0b',
    BLOCK: '#ef4444'
  };

  if (loading && !summary) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading telemetry and risk telemetry...</p>
        </div>
      </div>
    );
  }

  const decisionPieData = summary ? [
    { name: 'Approved', value: summary.approved_count, color: DECISION_COLORS.APPROVE },
    { name: 'Flagged (Verify)', value: summary.flagged_count, color: DECISION_COLORS.VERIFY },
    { name: 'Blocked', value: summary.blocked_count, color: DECISION_COLORS.BLOCK }
  ] : [];

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-[#121e36] text-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-blue-500/20 text-blue-400 border border-blue-500/30 font-semibold">
              REAL-TIME PRODUCTION PIPELINE
            </span>
            <span className="text-slate-400 text-xs">• Zero Data Leakage Split</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold mt-1.5 tracking-tight text-white">
            Dhanrakshak AI Control Center
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Live behavioral scoring, adaptive velocity controls, and automated decision policies.
            Simulated payment transactions scored via trained Random Forest ensemble with sub-30ms latency.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onNavigateToSimulator}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-500/30 transition-all flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5" /> Test In Simulator
          </button>
          <button
            onClick={loadData}
            className="p-2 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl border border-slate-700 transition-all"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={loadData} className="font-semibold underline">Retry</button>
        </div>
      )}

      {/* 6 Key Performance Indicator (KPI) Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-3.5">
        {/* Total Transactions */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Scored</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
              {summary ? summary.total_transactions.toLocaleString() : '0'}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              ${summary ? summary.total_volume.toLocaleString() : '0'} vol
            </div>
          </div>
        </div>

        {/* Approved */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">Approved</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-600 font-mono">
              {summary ? summary.approved_count.toLocaleString() : '0'}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {summary && summary.total_transactions > 0
                ? `${((summary.approved_count / summary.total_transactions) * 100).toFixed(1)}% safe`
                : '0%'}
            </div>
          </div>
        </div>

        {/* Flagged / Verify */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">Flagged (Verify)</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-600 font-mono">
              {summary ? summary.flagged_count.toLocaleString() : '0'}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Step-up challenge
            </div>
          </div>
        </div>

        {/* Blocked */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-700">Blocked</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-rose-600 font-mono">
              {summary ? summary.blocked_count.toLocaleString() : '0'}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              High-risk intercepted
            </div>
          </div>
        </div>

        {/* Fraud Detection Rate */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Flag Rate</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {summary ? `${summary.fraud_detection_rate}%` : '0%'}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Verify + Block ratio
            </div>
          </div>
        </div>

        {/* Average Latency */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Avg Latency</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {summary ? `${summary.avg_inference_time_ms}` : '0'} <span className="text-xs font-normal text-slate-400">ms</span>
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1">
              Ultra-fast ML inference
            </div>
          </div>
        </div>
      </div>

      {/* Empty State Handler */}
      {summary && summary.total_transactions === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-4">
            <Database className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Transaction Records Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
            The transaction history is currently empty. Populate realistic multi-channel simulated payments
            to view live telemetry and fraud risk distributions.
          </p>
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all inline-flex items-center gap-2"
          >
            <Database className="w-4 h-4" />
            {seeding ? 'Generating Sample Stream...' : 'Seed 35 Demo Transactions'}
          </button>
        </div>
      ) : (
        <>
          {/* Charts Row: Volume Over Time & Decision Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Volume & Activity Over Time */}
            <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">24-Hour Transaction Volume & Anomaly Trend</h3>
                  <p className="text-xs text-slate-500">Hourly throughput distribution and blocked fraud spikes</p>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  Hourly Feed
                </span>
              </div>
              <div className="h-64 w-full">
                {analytics && analytics.hourly_trends.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.hourly_trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="volGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                        </linearGradient>
                        <linearGradient id="blockGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                      />
                      <Area type="monotone" dataKey="count" name="Total Volume" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#volGradient)" />
                      <Area type="monotone" dataKey="blocked" name="Blocked Attacks" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#blockGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    Awaiting data generation...
                  </div>
                )}
              </div>
            </div>

            {/* Decision Distribution Donut */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Policy Decision Distribution</h3>
                <p className="text-xs text-slate-500">Real-time outcome split across all scored traffic</p>
              </div>

              <div className="h-52 w-full my-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={decisionPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {decisionPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                <div>
                  <div className="text-[11px] text-slate-500">Approve</div>
                  <div className="text-sm font-bold text-emerald-600 font-mono">
                    {summary?.approved_count || 0}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">Verify</div>
                  <div className="text-sm font-bold text-amber-600 font-mono">
                    {summary?.flagged_count || 0}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">Block</div>
                  <div className="text-sm font-bold text-rose-600 font-mono">
                    {summary?.blocked_count || 0}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row 2: Risk Bucket Distribution & Amount Tiers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Risk Distribution */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-1">Fraud Risk Score Distribution (0 - 100)</h3>
              <p className="text-xs text-slate-500 mb-4">Concentration of transactions across risk bands</p>
              <div className="h-52 w-full">
                {analytics && analytics.risk_buckets ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.risk_buckets} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="range" tick={{ fontSize: 10, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                      />
                      <Bar dataKey="count" name="Transactions" radius={[4, 4, 0, 0]}>
                        {analytics.risk_buckets.map((entry, idx) => {
                          const colors = ['#10b981', '#34d399', '#f59e0b', '#f97316', '#ef4444'];
                          return <Cell key={`bar-${idx}`} fill={colors[idx % colors.length]} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : null}
              </div>
            </div>

            {/* Amount Tiers vs Risk */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-1">Transaction Value Tier vs Avg Risk Score</h3>
              <p className="text-xs text-slate-500 mb-4">Higher value payments correlated with elevated security risk</p>
              <div className="h-52 w-full">
                {analytics && analytics.amount_tiers ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.amount_tiers} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="tier" tick={{ fontSize: 10, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                      />
                      <Bar dataKey="avg_risk" name="Average Risk Score" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : null}
              </div>
            </div>
          </div>

          {/* Recent Scored Transactions Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Recent Scored Transactions</h3>
                <p className="text-xs text-slate-500">Latest transactions processed by the AI inference engine</p>
              </div>
              <button
                onClick={onNavigateToLive}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                View All Live Stream <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Transaction ID</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Channel</th>
                    <th className="py-3 px-4">Risk Score</th>
                    <th className="py-3 px-4">Decision</th>
                    <th className="py-3 px-4">Primary Reason</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentTxns.map((txn) => {
                    const badgeStyles = {
                      APPROVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                      VERIFY: 'bg-amber-50 text-amber-700 border-amber-200',
                      BLOCK: 'bg-rose-50 text-rose-700 border-rose-200'
                    };
                    const badgeClass = badgeStyles[txn.decision] || badgeStyles.APPROVE;

                    return (
                      <tr
                        key={txn.transaction_id}
                        onClick={() => onSelectTransaction(txn)}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-4 font-mono font-medium text-slate-900">
                          {txn.transaction_id}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {new Date(txn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                          ${txn.amount.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[11px]">
                            {txn.payment_method}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-800">{txn.risk_score}</span>
                            <div className="w-12 bg-slate-200 h-1.5 rounded-full overflow-hidden hidden sm:block">
                              <div
                                className={`h-full ${
                                  txn.risk_score >= 70 ? 'bg-rose-500' :
                                  txn.risk_score >= 30 ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${txn.risk_score}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${badgeClass}`}>
                            {txn.decision}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={txn.reasons[0] || 'Clean transaction'}>
                          {txn.reasons[0] || 'Clean transaction'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectTransaction(txn);
                            }}
                            className="text-blue-600 hover:text-blue-800 font-medium text-xs"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
