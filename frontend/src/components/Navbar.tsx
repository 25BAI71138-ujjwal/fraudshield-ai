import React, { useState, useEffect } from 'react';
import {
  Clock,
  Database,
  RotateCcw,
  User,
  Shield,
  Search,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Menu,
  Lock
} from 'lucide-react';
import { NavTab } from './Sidebar';

interface NavbarProps {
  activeTab: NavTab;
  onSeedDemo: () => void;
  onResetDemo: () => void;
  isSeeding: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  systemStatus: string;
  onOpenChat?: () => void;
  onToggleMobileMenu?: () => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSeedDemo,
  onResetDemo,
  isSeeding,
  searchQuery,
  onSearchChange,
  systemStatus,
  onOpenChat,
  onToggleMobileMenu,
  onLogout
}) => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const titles: Record<NavTab, { title: string; subtitle: string }> = {
    overview: {
      title: 'Executive Risk Dashboard',
      subtitle: 'Real-time telemetry and decision distribution across payment channels'
    },
    live: {
      title: 'Live Transaction Stream',
      subtitle: 'Continuous fraud scoring, policy decisions, and audit trail'
    },
    analysis: {
      title: 'Fraud Forensics & Pattern Analytics',
      subtitle: 'Deep-dive risk distributions, anomalous hours, and rule triggers'
    },
    simulator: {
      title: 'Transaction Risk Simulator',
      subtitle: 'Interactive machine learning test bench with explainable AI reason codes'
    },
    performance: {
      title: 'Model Evaluation & Metrics',
      subtitle: 'Held-out test set performance, confusion matrix, and feature importances'
    },
    settings: {
      title: 'Policy Thresholds & Settings',
      subtitle: 'Customizable risk boundaries for APPROVE, VERIFY, and BLOCK decisions'
    }
  };

  const curr = titles[activeTab] || { title: 'Dashboard', subtitle: '' };

  return (
    <header className="h-16 bg-[#080910]/85 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-md z-10 text-white">
      {/* Title & Mobile Menu Button */}
      <div className="flex items-center gap-3 min-w-0">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 -ml-1 text-zinc-300 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
            title="Open navigation menu"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight truncate">
              {curr.title}
            </h1>
            <span className="hidden sm:inline-block text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-violet-950/70 text-cyan-300 border border-violet-500/40 font-semibold shrink-0 shadow-sm">
              Prod-Sim
            </span>
          </div>
          <p className="text-xs text-zinc-300 font-medium hidden md:block truncate">{curr.subtitle}</p>
        </div>
      </div>

      {/* Center/Right Controls */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search TXN-ID or channel..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs bg-black/60 border border-white/20 rounded-full text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-violet-400 focus:border-violet-400 w-52 transition-all shadow-inner"
          />
        </div>

        {/* Live Clock */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-400/30 text-cyan-300 text-xs font-mono shadow-sm">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>{timeStr || '12:00:00 PM'}</span>
        </div>

        {/* Action: Seed Demo Data */}
        <button
          onClick={onSeedDemo}
          disabled={isSeeding}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-white/10 border border-white/20 rounded-full hover:bg-white/20 hover:border-white/30 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
          title="Populate 30 varied simulated transactions"
        >
          <Database className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">{isSeeding ? 'Seeding...' : 'Seed Demo Data'}</span>
        </button>

        {/* Action: Reset */}
        <button
          onClick={onResetDemo}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-300 bg-white/10 border border-white/20 rounded-full hover:bg-rose-950/50 hover:text-rose-200 hover:border-rose-500/40 transition-all shadow-sm cursor-pointer"
          title="Clear all stored transactions"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>

        {/* Action: Gemini AI Copilot */}
        {onOpenChat && (
          <button
            onClick={onOpenChat}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-full shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all cursor-pointer"
            title="Open Gemini AI Assistant"
          >
            <Sparkles className="w-3.5 h-3.5 fill-white/20 text-cyan-300" />
            <span className="hidden sm:inline">AI Copilot</span>
          </button>
        )}

        {/* Profile Avatar & Lock Session */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-white/15">
          <div className="w-8 h-8 rounded-full bg-violet-950 text-cyan-300 flex items-center justify-center text-xs font-bold ring-1 ring-violet-500/40 shadow-sm">
            FS
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-xs font-bold text-white leading-tight">Risk Specialist</div>
            <div className="text-[10px] text-zinc-400 font-mono">SecOps #401</div>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              className="px-2.5 py-1 ml-1 text-violet-300 hover:text-white bg-white/10 hover:bg-violet-950/70 border border-white/15 hover:border-violet-400/40 rounded-full transition-all flex items-center gap-1 text-[11px] font-semibold cursor-pointer shadow-sm"
              title="Lock Session (GlassLock 3D)"
            >
              <Lock className="w-3 h-3 text-cyan-300" />
              <span className="hidden sm:inline">Lock</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
