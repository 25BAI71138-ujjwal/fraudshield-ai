import React, { useState, useRef, useEffect } from 'react';
import { GlassLockCanvas, GlassLockCanvasRef } from './GlassLockCanvas';
import { SynapseParticles } from './SynapseParticles';
import { InterferenceRibbons } from './InterferenceRibbons';
import {
  ShieldCheck,
  Lock,
  Unlock,
  Key,
  Zap,
  AlertCircle,
  ArrowRight
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (userProfile: { name: string; role: string; clearanceLevel: string }) => void;
  initialMode?: 'default' | 'just_locked';
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, initialMode = 'default' }) => {
  const canvasRef = useRef<GlassLockCanvasRef>(null);

  const [clearanceId, setClearanceId] = useState<string>('secops.lead@dhanrakshak.ai');
  const [passcode, setPasscode] = useState<string>('••••••••••••');
  const [role, setRole] = useState<string>('SecOps Lead #401');
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [authStep, setAuthStep] = useState<'idle' | 'inserting_key' | 'turning' | 'unlocked'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Automatically trigger the realistic locking animation when returning from a locked session
  useEffect(() => {
    if (initialMode === 'just_locked') {
      const timer = setTimeout(() => {
        canvasRef.current?.performLockSequence();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [initialMode]);

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isAuthenticating) return;

    if (!clearanceId.trim()) {
      setErrorMessage('Please enter a valid Clearance ID');
      return;
    }

    setErrorMessage(null);
    setIsAuthenticating(true);
    setAuthStep('inserting_key');

    // Trigger the smooth 3D mechanical unlocking sequence
    if (canvasRef.current) {
      setTimeout(() => setAuthStep('turning'), 500);
      setTimeout(() => setAuthStep('unlocked'), 1100);

      canvasRef.current.performLoginSequence(() => {
        setTimeout(() => {
          onLoginSuccess({
            name: 'Risk Specialist',
            role: role,
            clearanceLevel: 'Top Secret / SecOps Tier-1'
          });
        }, 300);
      });
    } else {
      setTimeout(() => {
        onLoginSuccess({
          name: 'Risk Specialist',
          role: role,
          clearanceLevel: 'Top Secret / SecOps Tier-1'
        });
      }, 1000);
    }
  };

  const handleQuickBypass = () => {
    handleLogin();
  };

  return (
    <div className="min-h-screen w-screen bg-ink text-bone font-sans selection:bg-tide/25 selection:text-bone flex flex-col justify-between relative overflow-hidden select-none">
      
      {/* Scrolltide Synapse Ambient Background Field */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {/* Violet & Cyan Atmospheric Tide Glow */}
        <div className="tide-glow absolute inset-0 opacity-80 pointer-events-none" />
        
        {/* Synaptic Neural Particle Connections */}
        <SynapseParticles />
        
        {/* React Bits Pro - Interference Ribbons: Glowing wires drifting & twisting */}
        <InterferenceRibbons
          wireCount={42}
          speed={0.0009}
          twistFactor={3.2}
          amplitude={115}
          opacity={0.65}
          interactive={true}
        />

        {/* Cinematic Film Grain Overlay */}
        <div className="grain absolute inset-0 opacity-20 pointer-events-none" />
        
        {/* Soft Horizon Gradient */}
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-ink pointer-events-none" />
      </div>

      {/* Full-Screen 3D Glassmorphic Lock Mechanism (Synapse Violet Glass) */}
      <div className="fixed inset-0 w-full h-full z-0 pointer-events-none overflow-hidden">
        <GlassLockCanvas
          ref={canvasRef}
          initialTheme="synapse"
          autoLoopOnMount={false}
          showControlsOverlay={false}
          isMouseDriven={true}
          className="w-full h-full pointer-events-none"
        />
      </div>

      {/* Scrolltide Minimal Sticky Header */}
      <header className="sticky top-0 z-40 w-full">
        <div className="border-b border-white/10 bg-[#07080a]/60 backdrop-blur-md">
          <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5 sm:px-6">
            <div className="flex items-center gap-2.5">
              <span className="relative inline-flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-[9px] bg-black ring-1 ring-white/20 shadow-sm">
                <ShieldCheck className="w-4 h-4 stroke-[2.2] text-cyan-300" />
              </span>
              <span className="text-[17px] font-bold tracking-tight text-white font-display">
                dhan<span className="text-violet-400">rakshak</span>
              </span>
              <span className="hidden sm:inline-flex rounded-full border border-cyan-400/40 bg-cyan-950/60 px-2.5 py-0.5 text-[11px] font-mono text-cyan-300 font-semibold shadow-sm">
                Synapse
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-zinc-100 backdrop-blur shadow-sm">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
                <span className="font-mono uppercase tracking-wider text-[11px]">Ambient Session</span>
              </span>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content: Centered Floating Synapse Glass Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 w-full max-w-lg mx-auto">
        <div className="w-full rounded-3xl border border-white/20 bg-[#090b14]/75 backdrop-blur-2xl p-8 sm:p-9 shadow-[0_25px_80px_rgba(0,0,0,0.85),0_0_50px_rgba(139,92,246,0.3)] space-y-6 relative group transition-all duration-500 hover:border-white/30">
          
          {/* Header & Status Indicator */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/50 bg-violet-950/80 px-3.5 py-1 text-xs font-mono uppercase tracking-wider text-cyan-300 font-semibold shadow-sm">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
                <span>SecOps Clearance</span>
              </div>
              <span className="text-xs font-mono text-zinc-300 bg-white/10 px-3 py-1 rounded-full border border-white/15">
                Move cursor to engage
              </span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow-md">
              Clearance Gateway
            </h1>
            <p className="text-sm text-zinc-200 leading-relaxed mt-2 font-sans font-medium">
              Synapse ambient intelligence protecting real-time financial networks.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs font-medium flex items-center gap-2.5 shadow-sm">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-zinc-100 font-bold mb-2">
                Security Clearance ID
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-violet-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={clearanceId}
                  onChange={(e) => setClearanceId(e.target.value)}
                  disabled={isAuthenticating}
                  placeholder="agent.id@dhanrakshak.ai"
                  className="w-full rounded-full border border-white/20 bg-black/60 pl-11 pr-5 py-3.5 text-sm text-white font-mono placeholder:text-zinc-400 outline-none transition focus:border-violet-400 focus:bg-black/90 focus:ring-2 focus:ring-violet-500/40 shadow-inner disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-zinc-100 font-bold mb-2">
                SecOps Token / Passcode
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-violet-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  disabled={isAuthenticating}
                  placeholder="••••••••••••"
                  className="w-full rounded-full border border-white/20 bg-black/60 pl-11 pr-5 py-3.5 text-sm text-white font-mono placeholder:text-zinc-400 outline-none transition focus:border-violet-400 focus:bg-black/90 focus:ring-2 focus:ring-violet-500/40 shadow-inner disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-zinc-100 font-bold mb-2">
                Clearance Tier
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={isAuthenticating}
                className="w-full rounded-full border border-white/20 bg-black/60 px-5 py-3.5 text-sm text-white font-semibold outline-none transition focus:border-violet-400 focus:bg-black/90 focus:ring-2 focus:ring-violet-500/40 shadow-inner disabled:opacity-50 cursor-pointer"
              >
                <option value="SecOps Lead #401" className="bg-[#0b0e17] text-white py-2 font-sans font-medium">SecOps Lead #401 (Full Control & ML Simulation)</option>
                <option value="Senior Fraud Forensics Analyst" className="bg-[#0b0e17] text-white py-2 font-sans font-medium">Senior Fraud Forensics Analyst (Read/Write)</option>
                <option value="Security Operations Officer" className="bg-[#0b0e17] text-white py-2 font-sans font-medium">Security Operations Officer (Audit Trail)</option>
              </select>
            </div>

            {/* Main Submit Button (Scrolltide Go Unlimited Pill) */}
            <button
              type="submit"
              disabled={isAuthenticating}
              className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-white px-6 py-4 text-sm font-bold text-zinc-950 transition hover:bg-zinc-100 shadow-[0_0_35px_rgba(139,92,246,0.6)] cursor-pointer disabled:opacity-60"
            >
              <span className="absolute inset-0 -z-0 opacity-0 blur-lg transition group-hover:opacity-40 bg-violet-500" />
              {isAuthenticating ? (
                <>
                  <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin relative" />
                  <span className="relative">
                    {authStep === 'inserting_key' && 'Inserting Synapse Key...'}
                    {authStep === 'turning' && 'Aligning Cylinder Tumblers...'}
                    {authStep === 'unlocked' && 'Clearance Approved!'}
                    {authStep === 'idle' && 'Unlocking Clearance...'}
                  </span>
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4 relative" />
                  <span className="relative">Authorize & Unlock Session</span>
                  <span className="relative transition group-hover:translate-x-0.5">→</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Actions: Fast Access + Preview Locking Motion */}
          <div className="pt-3 border-t border-white/15 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => canvasRef.current?.performLockSequence()}
              disabled={isAuthenticating}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/20 hover:border-white/30 transition-all cursor-pointer shadow-sm"
              title="Watch the lock execute its mechanical locking sequence"
            >
              <Lock className="w-3.5 h-3.5 text-violet-300" />
              <span>Preview Lock</span>
            </button>

            <button
              type="button"
              onClick={handleQuickBypass}
              disabled={isAuthenticating}
              className="inline-flex items-center gap-2 rounded-full border border-cyan-400/50 bg-cyan-950/70 px-4 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-900/90 hover:border-cyan-300 transition-all cursor-pointer shadow-[0_0_20px_rgba(34,211,238,0.3)]"
            >
              <Zap className="w-3.5 h-3.5 text-cyan-300" />
              <span>Instant Access</span>
            </button>
          </div>
        </div>
      </main>

      {/* Scrolltide Style Footer */}
      <footer className="relative z-10 border-t border-white/10 py-4 px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-300 font-mono gap-2 font-medium">
        <span>© 2026 Dhanrakshak AI • Synapse Ambient Intelligence</span>
        <span className="uppercase tracking-wider text-zinc-300">Made for real-time security</span>
      </footer>
    </div>
  );
};
