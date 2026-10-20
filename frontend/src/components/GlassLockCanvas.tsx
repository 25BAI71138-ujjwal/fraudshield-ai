import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { LockScene, CameraPreset } from '../three/LockScene';
import { MaterialTheme, THEMES } from '../three/materials';
import { audioSynth } from '../sound/audioSynth';
import { Volume2, VolumeX, RotateCw, Lock, Unlock, Play, Pause, Sparkles, Eye } from 'lucide-react';

export interface GlassLockCanvasRef {
  performLoginSequence: (onComplete?: () => void) => void;
  performLockSequence: (onComplete?: () => void) => void;
  toggleLockState: () => void;
  setAutoLoop: (enable: boolean) => void;
  setTheme: (theme: MaterialTheme) => void;
  getScene: () => LockScene | null;
}

interface GlassLockCanvasProps {
  initialTheme?: MaterialTheme;
  autoLoopOnMount?: boolean;
  showControlsOverlay?: boolean;
  isMouseDriven?: boolean;
  onStateChange?: (state: {
    isUnlocked: boolean;
    isInserted: boolean;
    keyInsertRatio: number;
    keyRotateRatio: number;
    explodedRatio: number;
    isAutoLooping: boolean;
  }) => void;
  className?: string;
}

export const GlassLockCanvas = forwardRef<GlassLockCanvasRef, GlassLockCanvasProps>(({
  initialTheme = 'synapse',
  autoLoopOnMount = false,
  showControlsOverlay = false,
  isMouseDriven = true,
  onStateChange,
  className = ''
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<LockScene | null>(null);

  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [isAutoLooping, setIsAutoLooping] = useState<boolean>(autoLoopOnMount);
  const [currentTheme, setCurrentTheme] = useState<MaterialTheme>(initialTheme);
  const [activeCamera, setActiveCamera] = useState<CameraPreset>('hero');

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new LockScene(containerRef.current, {
      isMouseDriven,
      isAutoLooping: autoLoopOnMount,
      onStateChange: (state) => {
        setIsUnlocked(state.isUnlocked);
        setIsAutoLooping(state.isAutoLooping);
        if (onStateChange) onStateChange(state);
      }
    });

    scene.setAutoLoop(autoLoopOnMount);
    scene.setTheme(initialTheme);
    sceneRef.current = scene;

    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  useImperativeHandle(ref, () => ({
    performLoginSequence: (onComplete?: () => void) => {
      if (sceneRef.current) {
        sceneRef.current.performLoginSequence(onComplete);
      } else if (onComplete) {
        onComplete();
      }
    },
    performLockSequence: (onComplete?: () => void) => {
      if (sceneRef.current) {
        sceneRef.current.performLockSequence(onComplete);
      } else if (onComplete) {
        onComplete();
      }
    },
    toggleLockState: () => {
      sceneRef.current?.toggleLockState();
    },
    setAutoLoop: (enable: boolean) => {
      setIsAutoLooping(enable);
      sceneRef.current?.setAutoLoop(enable);
    },
    setTheme: (theme: MaterialTheme) => {
      setCurrentTheme(theme);
      sceneRef.current?.setTheme(theme);
    },
    getScene: () => sceneRef.current
  }), []);

  const handleToggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    audioSynth.setMuted(next);
  };

  const handleToggleAutoLoop = () => {
    const next = !isAutoLooping;
    setIsAutoLooping(next);
    sceneRef.current?.setAutoLoop(next);
  };

  const handleToggleLock = () => {
    sceneRef.current?.toggleLockState();
  };

  const handleSelectCamera = (preset: CameraPreset) => {
    setActiveCamera(preset);
    sceneRef.current?.setCameraPreset(preset);
  };

  const handleSelectTheme = (theme: MaterialTheme) => {
    setCurrentTheme(theme);
    sceneRef.current?.setTheme(theme);
  };

  return (
    <div className={`relative w-full h-full overflow-hidden select-none ${className}`}>
      {/* 3D WebGL Canvas Mounting Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating HUD Badges & Interactive Controls */}
      {showControlsOverlay && (
        <>
          {/* Top-Left: Model Badge */}
          <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none z-10">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30 backdrop-blur-md flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
              GLASSLOCK 3D • SAPPHIRE PBR
            </span>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-mono text-slate-400 bg-slate-900/60 border border-slate-800 backdrop-blur-xs">
              Drag to Orbit • Scroll to Zoom
            </span>
          </div>

          {/* Top-Right: Quick Controls (Mute / Auto-Loop / Manual Lock) */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
            {/* Audio Toggle */}
            <button
              onClick={handleToggleSound}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 backdrop-blur-md transition-all shadow-sm"
              title={isMuted ? 'Unmute Mechanical Sound FX' : 'Mute Sound'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-slate-400" /> : <Volume2 className="w-3.5 h-3.5 text-blue-400" />}
            </button>

            {/* Pinterest Animation Cycle Toggle */}
            <button
              onClick={handleToggleAutoLoop}
              className={`px-2.5 py-1.5 rounded-xl border backdrop-blur-md text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                isAutoLooping
                  ? 'bg-blue-600/80 hover:bg-blue-600 text-white border-blue-400/40'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-700/60'
              }`}
              title="Continuous Pinterest Animation Loop"
            >
              {isAutoLooping ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isAutoLooping ? 'Pinterest Loop Active' : 'Play Loop'}</span>
            </button>

            {/* Manual Lock/Unlock Test */}
            <button
              onClick={handleToggleLock}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/60 backdrop-blur-md text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              title="Manually Toggle Lock/Unlock Sequence"
            >
              {isUnlocked ? <Unlock className="w-3.5 h-3.5 text-amber-400" /> : <Lock className="w-3.5 h-3.5 text-emerald-400" />}
              <span className="hidden sm:inline">{isUnlocked ? 'Unlocked' : 'Locked'}</span>
            </button>
          </div>

          {/* Bottom Bar: Camera Presets & Material Themes */}
          <div className="absolute bottom-3 inset-x-3 flex flex-wrap items-center justify-between gap-2 z-10 pointer-events-auto">
            {/* Camera View Angle Buttons */}
            <div className="flex items-center gap-1 bg-slate-950/75 border border-slate-800/80 p-1 rounded-xl backdrop-blur-md">
              <span className="text-[10px] font-mono text-slate-400 px-2 flex items-center gap-1">
                <Eye className="w-3 h-3 text-blue-400" /> Angle:
              </span>
              {(['hero', 'front', 'tumbler', 'top'] as CameraPreset[]).map((cam) => (
                <button
                  key={cam}
                  onClick={() => handleSelectCamera(cam)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-medium capitalize transition-all ${
                    activeCamera === cam
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {cam}
                </button>
              ))}
            </div>

            {/* Material Themes */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-950/75 border border-slate-800/80 p-1 rounded-xl backdrop-blur-md">
              {(Object.keys(THEMES) as MaterialTheme[]).map((tId) => {
                const theme = THEMES[tId];
                const isActive = currentTheme === tId;
                return (
                  <button
                    key={tId}
                    onClick={() => handleSelectTheme(tId)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-medium flex items-center gap-1 transition-all ${
                      isActive
                        ? 'bg-slate-800 text-white ring-1 ring-blue-500/50'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.glowColor }} />
                    <span className="capitalize">{tId}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
});
