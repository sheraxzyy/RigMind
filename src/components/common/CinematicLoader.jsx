import React, { useState, useEffect, useRef } from 'react';
import { Cpu, Zap, ShieldCheck, Terminal, Disc3 } from 'lucide-react';
import './CinematicLoader.css';

const BOOT_STAGES = [
  { timeMs: 200, pct: 15, msg: 'INITIALIZING RIGMIND CORE...' },
  { timeMs: 800, pct: 38, msg: 'VERIFYING HARDWARE ARCHITECTURES...' },
  { timeMs: 1600, pct: 68, msg: 'LOADING GAME DATABASE & SPEC ENGINE...' },
  { timeMs: 2300, pct: 90, msg: 'CALIBRATING PERFORMANCE TELEMETRY...' },
  { timeMs: 2800, pct: 100, msg: 'SYSTEM READY // ALL SUBSYSTEMS NOMINAL' }
];

export const CinematicLoader = ({ onComplete, forcePlay = false }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('INITIALIZING RIGMIND CORE...');
  const [clockTime, setClockTime] = useState('');

  const timersRef = useRef([]);

  // Check reduced motion or previous session boot
  useEffect(() => {
    // Clock timestamp
    const now = new Date();
    setClockTime(
      `${now.getHours().toString().padStart(2, '0')}:${now
        .getMinutes()
        .toString()
        .padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
    );

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const hasBooted =
      typeof window !== 'undefined' &&
      sessionStorage.getItem('rigmind_boot_completed');

    if (!forcePlay && (prefersReducedMotion || hasBooted)) {
      setIsVisible(false);
      if (onComplete) onComplete();
      return;
    }

    // Schedule boot stages
    BOOT_STAGES.forEach((stage) => {
      const t = setTimeout(() => {
        setProgress(stage.pct);
        setStatusMessage(stage.msg);
      }, stage.timeMs);
      timersRef.current.push(t);
    });

    // Initiate exit transition at 3.2s
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, 3200);
    timersRef.current.push(exitTimer);

    // Unmount and notify completion at 3.7s
    const completeTimer = setTimeout(() => {
      sessionStorage.setItem('rigmind_boot_completed', 'true');
      setIsVisible(false);
      if (onComplete) onComplete();
    }, 3750);
    timersRef.current.push(completeTimer);

    // Absolute fallback watchdog (max 4.8s) so user is never trapped
    const watchdog = setTimeout(() => {
      sessionStorage.setItem('rigmind_boot_completed', 'true');
      setIsVisible(false);
      if (onComplete) onComplete();
    }, 4800);
    timersRef.current.push(watchdog);

    // ESC key listener for instant skip
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        dismissLoader();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [forcePlay, onComplete]);

  const dismissLoader = () => {
    timersRef.current.forEach((t) => clearTimeout(t));
    setIsExiting(true);
    setTimeout(() => {
      sessionStorage.setItem('rigmind_boot_completed', 'true');
      setIsVisible(false);
      if (onComplete) onComplete();
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div
      className={`rm-boot-overlay ${isExiting ? 'rm-boot-exiting' : ''}`}
      role="status"
      aria-live="polite"
      aria-label="RigMind system booting"
    >
      {/* Background Ambience & Grid */}
      <div className="rm-boot-ambient" />
      <div className="rm-boot-grid" />
      <div className="rm-boot-scanlines" />
      <div className="rm-boot-scanner-beam" />

      {/* Sci-Fi Corner Brackets */}
      <div className="rm-boot-hud-corner rm-boot-hud-tl" />
      <div className="rm-boot-hud-corner rm-boot-hud-tr" />
      <div className="rm-boot-hud-corner rm-boot-hud-bl" />
      <div className="rm-boot-hud-corner rm-boot-hud-br" />

      {/* Top Telemetry Bar */}
      <div className="rm-boot-telemetry-top">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="rm-boot-dot" />
          <span>RIGMIND_OS // BOOT_LOADER [V1.2.0]</span>
        </div>
        <div className="rm-boot-pill">
          <Zap size={11} />
          <span>HARDWARE ENGINE ONLINE</span>
        </div>
        <div>TIME: {clockTime || '00:00:00'}</div>
      </div>

      {/* Central Cinematic Stage */}
      <div className="rm-boot-stage">
        {/* Emblem & Reticle */}
        <div className="rm-boot-emblem-wrap">
          <div className="rm-boot-reticle" />
          <div className="rm-boot-reticle-inner" />
          <div className="rm-boot-core-badge">
            <Cpu size={36} />
          </div>
        </div>

        {/* Brand Title & Typographic Treatment */}
        <h1 className="rm-boot-title">
          RIG<span className="rm-boot-title-accent">MIND</span>
        </h1>
        <div className="rm-boot-subtitle">PC Gaming Intelligence Platform</div>

        {/* Neon Progress Bar */}
        <div className="rm-boot-progress-wrap">
          <div className="rm-boot-progress-meta">
            <span>SYSTEM INITIALIZATION</span>
            <span className="rm-boot-progress-pct">{progress}%</span>
          </div>
          <div className="rm-boot-progress-track">
            <div
              className="rm-boot-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Status Terminal Panel */}
        <div className="rm-boot-status-panel">
          <div className="rm-boot-status-text">
            <span>&gt; {statusMessage}</span>
            <span className="rm-boot-status-cursor" />
          </div>
        </div>
      </div>

      {/* Bottom Telemetry Bar & Skip Button */}
      <div className="rm-boot-telemetry-bottom">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="rm-boot-dot rm-boot-dot-cyan" />
          <span>SECURITY: ISOLATED LOCAL STORAGE</span>
        </div>
        <button
          className="rm-boot-skip-btn"
          onClick={dismissLoader}
          title="Skip cinematic boot sequence"
        >
          SKIP SEQUENCE [ESC]
        </button>
      </div>
    </div>
  );
};

export default CinematicLoader;
