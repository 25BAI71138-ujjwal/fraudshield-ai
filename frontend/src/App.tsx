import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Overview } from './pages/Overview';
import { LiveTransactions } from './pages/LiveTransactions';
import { FraudAnalysis } from './pages/FraudAnalysis';
import { Simulator } from './pages/Simulator';
import { ModelPerformance } from './pages/ModelPerformance';
import { SettingsPage } from './pages/SettingsPage';
import { TransactionModal } from './components/TransactionModal';
import { GeminiBotModal } from './components/GeminiBotModal';
import { LoginPage } from './components/LoginPage';
import { InterferenceRibbons } from './components/InterferenceRibbons';
import { Transaction } from './types';
import { fetchHealth, seedDemo, resetDemo, verifyTransaction } from './services/api';
import {
  Sparkles,
  LayoutDashboard,
  Activity,
  SlidersHorizontal,
  BarChart3,
  Menu as MenuIcon,
  AlertTriangle,
  RefreshCw,
  WifiOff
} from 'lucide-react';
import { BASE_URL } from './services/api';

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('fs_authenticated') === 'true';
  });
  const [justLocked, setJustLocked] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [systemStatus, setSystemStatus] = useState<string>('Checking...');
  const [isCheckingHealth, setIsCheckingHealth] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [dataRefreshKey, setDataRefreshKey] = useState<number>(0);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const handleLoginSuccess = () => {
    sessionStorage.setItem('fs_authenticated', 'true');
    setJustLocked(false);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('fs_authenticated');
    setJustLocked(true);
    setIsAuthenticated(false);
  };

  const checkHealth = async () => {
    setIsCheckingHealth(true);
    try {
      const h = await fetchHealth();
      if (h.model_loaded) {
        setSystemStatus('Active');
      } else {
        setSystemStatus('Model Loading');
      }
    } catch {
      setSystemStatus('Offline');
    } finally {
      setIsCheckingHealth(false);
    }
  };

  // Check health on boot
  useEffect(() => {
    checkHealth();
  }, []);

  const handleSeedDemo = async () => {
    try {
      setIsSeeding(true);
      await seedDemo(35);
      setDataRefreshKey((k) => k + 1);
    } catch (err) {
      console.error('Seed demo error:', err);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleResetDemo = async () => {
    if (!window.confirm('Reset all demo transaction history in SQLite?')) return;
    try {
      await resetDemo();
      setDataRefreshKey((k) => k + 1);
    } catch (err) {
      console.error('Reset error:', err);
    }
  };

  const handleVerifyAction = async (transactionId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      const updated = await verifyTransaction(transactionId, action);
      setSelectedTxn(updated);
      setDataRefreshKey((k) => k + 1);
    } catch (err) {
      console.error('Verify error:', err);
    }
  };

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    if (q.trim() && activeTab !== 'live') {
      setActiveTab('live');
    }
  };

  if (!isAuthenticated) {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        initialMode={justLocked ? 'just_locked' : 'default'}
      />
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-ink text-bone font-sans relative select-none">
      {/* Scrolltide Synapse Ambient Background Field with Interference Ribbons */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* Violet & Cyan Atmospheric Tide Glow */}
        <div className="tide-glow absolute inset-0 opacity-70 pointer-events-none" />

        {/* React Bits Pro - Interference Ribbons across entire background */}
        <InterferenceRibbons
          wireCount={36}
          speed={0.0007}
          twistFactor={2.8}
          amplitude={95}
          opacity={0.45}
          interactive={true}
        />

        {/* Cinematic Film Grain Overlay */}
        <div className="grain absolute inset-0 opacity-20 pointer-events-none" />
      </div>

      {/* Sidebar Navigation (Desktop persistent + Mobile Drawer) */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab !== 'live') setSearchQuery('');
        }}
        systemStatus={systemStatus}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        onLogout={handleLogout}
      />

      {/* Main Workspace Area with translucent background so ribbons show through */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10 bg-transparent">
        {/* Top Navbar */}
        <Navbar
          activeTab={activeTab}
          onSeedDemo={handleSeedDemo}
          onResetDemo={handleResetDemo}
          isSeeding={isSeeding}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          systemStatus={systemStatus}
          onOpenChat={() => setIsChatOpen(true)}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          onLogout={handleLogout}
        />

        {/* Backend Disconnected Alert Banner */}
        {systemStatus === 'Offline' && (
          <div className="bg-rose-50 border-b border-rose-200 px-4 py-2 text-rose-800 text-xs flex items-center justify-between z-20 shrink-0">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                <strong>Backend Unreachable:</strong> Could not connect to API at <code className="bg-rose-100 px-1 py-0.5 rounded font-mono text-[11px]">{BASE_URL}</code>. Ensure FastAPI is running on <code>0.0.0.0:8000</code> and phone is on the same Wi-Fi.
              </span>
            </div>
            <button
              onClick={checkHealth}
              disabled={isCheckingHealth}
              className="ml-3 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold text-[11px] flex items-center gap-1.5 shrink-0 transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${isCheckingHealth ? 'animate-spin' : ''}`} />
              {isCheckingHealth ? 'Checking...' : 'Retry'}
            </button>
          </div>
        )}

        {/* Dynamic Content Views */}
        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0" key={dataRefreshKey}>
          {activeTab === 'overview' && (
            <Overview
              onSelectTransaction={(txn) => setSelectedTxn(txn)}
              onNavigateToSimulator={() => setActiveTab('simulator')}
              onNavigateToLive={() => setActiveTab('live')}
            />
          )}

          {activeTab === 'live' && (
            <LiveTransactions
              onSelectTransaction={(txn) => setSelectedTxn(txn)}
              externalSearch={searchQuery}
            />
          )}

          {activeTab === 'analysis' && <FraudAnalysis />}

          {activeTab === 'simulator' && (
            <Simulator onTransactionLogged={() => setDataRefreshKey((k) => k + 1)} />
          )}

          {activeTab === 'performance' && <ModelPerformance />}

          {activeTab === 'settings' && (
            <SettingsPage onRefreshData={() => setDataRefreshKey((k) => k + 1)} />
          )}
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 h-14 bg-white/95 backdrop-blur-md border-t border-slate-200 flex items-center justify-around px-2 z-30 shadow-lg">
          <button
            onClick={() => { setActiveTab('overview'); setSearchQuery(''); }}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10px] font-semibold transition-colors ${
              activeTab === 'overview' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 mb-0.5" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => { setActiveTab('live'); }}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10px] font-semibold transition-colors ${
              activeTab === 'live' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity className="w-4 h-4 mb-0.5" />
            <span>Live Feed</span>
          </button>

          <button
            onClick={() => { setActiveTab('simulator'); setSearchQuery(''); }}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10px] font-semibold transition-colors ${
              activeTab === 'simulator' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className="relative">
              <SlidersHorizontal className="w-4 h-4 mb-0.5" />
              <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-blue-600 animate-ping" />
              <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-blue-600" />
            </div>
            <span>Simulator</span>
          </button>

          <button
            onClick={() => { setActiveTab('analysis'); setSearchQuery(''); }}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10px] font-semibold transition-colors ${
              activeTab === 'analysis' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4 mb-0.5" />
            <span>Analytics</span>
          </button>

          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10px] font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <MenuIcon className="w-4 h-4 mb-0.5" />
            <span>More</span>
          </button>
        </nav>
      </div>

      {/* Floating Gemini Copilot Trigger Button */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-18 lg:bottom-6 right-4 sm:right-6 z-40 px-3.5 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-full shadow-xl shadow-blue-500/30 flex items-center gap-2 font-bold text-xs transition-all transform hover:scale-105 active:scale-95 border border-white/20 select-none group"
          title="Ask Dhanrakshak Gemini AI Copilot"
        >
          <div className="relative">
            <Sparkles className="w-4 h-4 fill-white/20 transition-transform group-hover:rotate-12" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <span className="hidden sm:inline">Ask AI Copilot</span>
          <span className="sm:hidden">Copilot</span>
        </button>
      )}

      {/* Gemini AI Copilot Drawer Modal */}
      <GeminiBotModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />

      {/* Inspect Transaction Detail Drawer/Modal */}
      <TransactionModal
        transaction={selectedTxn}
        onClose={() => setSelectedTxn(null)}
        onVerifyAction={handleVerifyAction}
      />
    </div>
  );
}

export default App;
