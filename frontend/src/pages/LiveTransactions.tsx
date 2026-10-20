import React, { useState, useEffect } from 'react';
import {
  Search,
  Download,
  Filter,
  RefreshCw,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  ArrowUpDown,
  Radio
} from 'lucide-react';
import { Transaction } from '../types';
import { fetchTransactions, getExportCsvUrl } from '../services/api';

interface LiveTransactionsProps {
  onSelectTransaction: (txn: Transaction) => void;
  externalSearch?: string;
}

export const LiveTransactions: React.FC<LiveTransactionsProps> = ({
  onSelectTransaction,
  externalSearch = ''
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(15);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [decisionFilter, setDecisionFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>(externalSearch);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  // Sync external search from navbar
  useEffect(() => {
    if (externalSearch !== search) {
      setSearch(externalSearch);
      setPage(1);
    }
  }, [externalSearch]);

  const loadData = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      setError(null);
      const res = await fetchTransactions({
        decision: decisionFilter,
        risk_level: riskFilter,
        search: search.trim() || undefined,
        page,
        limit
      });
      setTransactions(res.transactions);
      setTotal(res.total);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch transactions');
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, decisionFilter, riskFilter, search]);

  // Auto-refresh interval (polling every 5 seconds)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadData(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, page, decisionFilter, riskFilter, search]);

  const totalPages = Math.ceil(total / limit) || 1;

  const handleExport = () => {
    const url = getExportCsvUrl(decisionFilter, riskFilter, search.trim());
    window.location.href = url;
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Header & Filter Controls */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Live Transaction Telemetry</h2>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className={`w-1.5 h-1.5 rounded-full ${autoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                {autoRefresh ? 'Auto-Polling (5s)' : 'Paused'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspecting {total} simulated transactions recorded in local persistent storage.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 ${
                autoRefresh
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-white text-slate-600 border-slate-300'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>{autoRefresh ? 'Live Feed On' : 'Live Feed Paused'}</span>
            </button>
            <button
              onClick={() => loadData(false)}
              className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              title="Refresh Now"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleExport}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search TXN-ID, channel..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Decision Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500 shrink-0">Decision:</span>
            <select
              value={decisionFilter}
              onChange={(e) => {
                setDecisionFilter(e.target.value);
                setPage(1);
              }}
              className="w-full py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="ALL">All Decisions</option>
              <option value="APPROVE">APPROVE Only</option>
              <option value="VERIFY">VERIFY Only</option>
              <option value="BLOCK">BLOCK Only</option>
            </select>
          </div>

          {/* Risk Level Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500 shrink-0">Risk Level:</span>
            <select
              value={riskFilter}
              onChange={(e) => {
                setRiskFilter(e.target.value);
                setPage(1);
              }}
              className="w-full py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="LOW">LOW Risk</option>
              <option value="MEDIUM">MEDIUM Risk</option>
              <option value="HIGH">HIGH Risk</option>
            </select>
          </div>

          {/* Result Count Info */}
          <div className="flex items-center justify-end text-xs text-slate-500">
            Showing <strong className="text-slate-800 mx-1">{transactions.length}</strong> of{' '}
            <strong className="text-slate-800 ml-1">{total}</strong> records
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => loadData()} className="font-semibold underline">Retry</button>
        </div>
      )}

      {/* Main Container: Mobile Cards (< md) & Desktop Table (>= md) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Mobile Touch-Friendly Card View */}
        <div className="block md:hidden divide-y divide-slate-100">
          {transactions.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              No transactions matching the selected criteria.
            </div>
          ) : (
            transactions.map((txn) => {
              const badgeStyles = {
                APPROVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                VERIFY: 'bg-amber-50 text-amber-700 border-amber-200',
                BLOCK: 'bg-rose-50 text-rose-700 border-rose-200'
              };
              const badgeClass = badgeStyles[txn.decision] || badgeStyles.APPROVE;

              return (
                <div
                  key={txn.transaction_id}
                  onClick={() => onSelectTransaction(txn)}
                  className="p-3.5 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-slate-900">{txn.transaction_id}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-slate-900">${txn.amount.toFixed(2)}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${badgeClass}`}>
                        {txn.decision}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[10px] text-slate-700 border border-slate-200">
                        {txn.payment_method}
                      </span>
                      <span>•</span>
                      <span className="text-slate-600">{txn.merchant_category}</span>
                    </div>
                    <div className="flex items-center gap-1 font-mono">
                      <span className="text-slate-400">Score:</span>
                      <span className={`font-bold ${
                        txn.risk_score >= 70 ? 'text-rose-600' :
                        txn.risk_score >= 30 ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                        {txn.risk_score}
                      </span>
                      <span className="text-slate-400 text-[10px]">({txn.inference_time_ms.toFixed(0)}ms)</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-600 truncate flex items-center justify-between">
                    <span className="truncate pr-2">{txn.reasons[0] || 'Standard baseline purchase'}</span>
                    <span className="text-[10px] font-semibold text-blue-600 shrink-0">Inspect &rarr;</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Data Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Payment Channel</th>
                <th className="py-3 px-4">Risk Score</th>
                <th className="py-3 px-4">Decision</th>
                <th className="py-3 px-4">Model Latency</th>
                <th className="py-3 px-4">Primary Risk Factor</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No transactions matching the selected criteria.
                  </td>
                </tr>
              ) : (
                transactions.map((txn) => {
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
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 group-hover:text-blue-600">
                        {txn.transaction_id}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(txn.timestamp).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        ${txn.amount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[11px] text-slate-700 border border-slate-200">
                          {txn.payment_method}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900">{txn.risk_score}</span>
                          <span className={`text-[10px] font-bold ${
                            txn.risk_level === 'HIGH' ? 'text-rose-600' :
                            txn.risk_level === 'MEDIUM' ? 'text-amber-600' : 'text-emerald-600'
                          }`}>
                            [{txn.risk_level}]
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${badgeClass}`}>
                          {txn.decision}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {txn.inference_time_ms.toFixed(1)} ms
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={txn.reasons[0] || 'Standard activity'}>
                        {txn.reasons[0] || 'Standard activity'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTransaction(txn);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div>
            Page <span className="font-semibold text-slate-900">{page}</span> of{' '}
            <span className="font-semibold text-slate-900">{totalPages}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors flex items-center gap-1 font-medium"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors flex items-center gap-1 font-medium"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
