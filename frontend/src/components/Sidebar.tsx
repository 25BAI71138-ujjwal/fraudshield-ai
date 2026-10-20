import React from 'react';
import {
  LayoutDashboard,
  Activity,
  BarChart3,
  SlidersHorizontal,
  Gauge,
  Settings,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Lock,
  X
} from 'lucide-react';

export type NavTab = 'overview' | 'live' | 'analysis' | 'simulator' | 'performance' | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  systemStatus: string;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  systemStatus,
  isMobileOpen = false,
  onCloseMobile,
  onLogout
}) => {
  const navItems = [
    { id: 'overview' as NavTab, label: 'Overview', icon: LayoutDashboard, badge: null },
    { id: 'live' as NavTab, label: 'Live Transactions', icon: Activity, badge: 'Live' },
    { id: 'analysis' as NavTab, label: 'Fraud Analysis', icon: BarChart3, badge: null },
    { id: 'simulator' as NavTab, label: 'Transaction Simulator', icon: SlidersHorizontal, badge: 'ML Lab' },
    { id: 'performance' as NavTab, label: 'Model Performance', icon: Gauge, badge: 'v1.2' },
    { id: 'settings' as NavTab, label: 'Settings', icon: Settings, badge: null },
  ];

  const handleSelectTab = (tab: NavTab) => {
    onTabChange(tab);
    if (onCloseMobile) onCloseMobile();
  };

  const renderContent = (isMobile: boolean = false) => (
    <>
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-base tracking-tight">Dhanrakshak</span>
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">AI</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Intelligent Protection</p>
          </div>
        </div>

        {isMobile && onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 p-3.5 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
          Monitoring & Risk Lab
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-transform group-hover:scale-105 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium ${
                      isActive
                        ? 'bg-blue-700/60 text-blue-100'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                <ChevronRight
                  className={`w-3.5 h-3.5 transition-transform ${
                    isActive ? 'text-white/80 translate-x-0.5' : 'text-slate-600 opacity-0 group-hover:opacity-100'
                  }`}
                />
              </div>
            </button>
          );
        })}
      </nav>

      {/* Engine Status Card */}
      <div className="p-3.5 border-t border-slate-800/80 bg-[#090e1a]/80">
        <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Engine Status</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
              <span className={`w-1.5 h-1.5 rounded-full ${systemStatus === 'Offline' ? 'bg-rose-500' : 'bg-emerald-400 animate-pulse'}`}></span>
              {systemStatus}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Model:</span>
            <span className="font-mono text-slate-300 text-[11px]">RF-Ensemble v1.2</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-1">
            <span>Inference:</span>
            <span className="font-mono text-emerald-400 text-[11px]">~22ms (p95)</span>
          </div>
        </div>

        <div className="mt-3 px-2 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1 text-slate-400">
            <Sparkles className="w-3 h-3 text-blue-400" /> Demo Engine
          </span>
          <span className="font-mono text-[10px] text-slate-400">Port 8000</span>
        </div>

        {onLogout && (
          <button
            onClick={() => {
              if (onCloseMobile) onCloseMobile();
              onLogout();
            }}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-rose-500/20 border border-slate-700/60 hover:border-rose-500/40 transition-all duration-200 group cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-blue-400 group-hover:text-rose-400 transition-colors" />
            <span>Lock Session</span>
          </button>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-64 bg-[#080910]/95 backdrop-blur-2xl text-zinc-300 flex-col border-r border-white/10 shrink-0 select-none">
        {renderContent(false)}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-200"
          />
          {/* Drawer */}
          <aside className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-[#080910]/98 backdrop-blur-2xl text-zinc-300 flex flex-col border-r border-white/10 shadow-2xl z-50 animate-in slide-in-from-left duration-200">
            {renderContent(true)}
          </aside>
        </div>
      )}
    </>
  );
};
