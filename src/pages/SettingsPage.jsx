import React, { useState } from 'react';
import {
  Settings,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Save,
  Zap
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { RESOLUTION_PRESETS, GRAPHICS_PRESETS } from '../data/hardware';

export const SettingsPage = () => {
  const {
    settings,
    saveSettings,
    resetAllData,
    profiles,
    activeProfile,
    setActiveProfile
  } = useApp();

  const [localSettings, setLocalSettings] = useState({ ...settings });
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    saveSettings(localSettings);
  };

  const handleConfirmReset = () => {
    resetAllData();
    setShowResetConfirm(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header Banner */}
      <div className="rm-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
          <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'var(--accent-subtle)', color: 'var(--accent-primary)' }}>
            <Settings size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Settings & Methodology</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Configure application defaults, motion preferences, and review RigMind's estimation philosophy.
            </p>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Settings Form */}
        <div className="rm-card">
          <form onSubmit={handleSave}>
            <div className="rm-card-header">
              <div className="rm-card-title">
                <Settings size={18} style={{ color: 'var(--accent-primary)' }} />
                <span>Application Preferences</span>
              </div>
            </div>

            {/* Default Profile */}
            <div className="rm-form-group">
              <label className="rm-form-label" htmlFor="set-default-profile">Default Active PC Profile</label>
              <select
                id="set-default-profile"
                className="rm-select"
                value={activeProfile?.id || ''}
                onChange={(e) => setActiveProfile(e.target.value)}
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.formFactor})
                  </option>
                ))}
              </select>
            </div>

            {/* Default Resolution */}
            <div className="rm-form-group">
              <label className="rm-form-label" htmlFor="set-default-res">Default Target Resolution</label>
              <select
                id="set-default-res"
                className="rm-select"
                value={localSettings.defaultResolution || '1920x1080'}
                onChange={(e) => setLocalSettings({ ...localSettings, defaultResolution: e.target.value })}
              >
                {RESOLUTION_PRESETS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.id})
                  </option>
                ))}
              </select>
            </div>

            {/* Default Preset */}
            <div className="rm-form-group">
              <label className="rm-form-label" htmlFor="set-default-preset">Default Graphics Quality Preset</label>
              <select
                id="set-default-preset"
                className="rm-select"
                value={localSettings.defaultPreset || 'High'}
                onChange={(e) => setLocalSettings({ ...localSettings, defaultPreset: e.target.value })}
              >
                {GRAPHICS_PRESETS.map((g) => (
                  <option key={g.id} value={g.name}>
                    {g.name} Preset
                  </option>
                ))}
              </select>
            </div>

            {/* Motion Preference */}
            <div className="rm-form-group">
              <label className="rm-form-label" htmlFor="set-motion-pref">Motion & Animation Behavior</label>
              <select
                id="set-motion-pref"
                className="rm-select"
                value={localSettings.motionPreference || 'normal'}
                onChange={(e) => setLocalSettings({ ...localSettings, motionPreference: e.target.value })}
              >
                <option value="normal">Full Dynamic Micro-Animations</option>
                <option value="reduced">Reduced Motion (Respect System Accessibility)</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button type="submit" className="rm-btn rm-btn-primary">
                <Save size={16} />
                <span>Save Preferences</span>
              </button>
            </div>
          </form>
        </div>

        {/* Data Reset & Storage Management */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Cinematic Boot Sequence Preview */}
          <div className="rm-card" style={{ borderLeft: '4px solid #00D9FF' }}>
            <div className="rm-card-header">
              <div className="rm-card-title">
                <Zap size={18} style={{ color: '#00D9FF' }} />
                <span>Cinematic Gaming Boot Experience</span>
              </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.5' }}>
              RigMind features a futuristic PC gaming boot sequence with real-time telemetry, neon progress,
              hardware architecture verifications, and HUD scanning effects.
            </p>

            <button
              type="button"
              className="rm-btn rm-btn-secondary"
              onClick={() => {
                sessionStorage.removeItem('rigmind_boot_completed');
                window.location.reload();
              }}
            >
              <Zap size={14} style={{ color: '#00D9FF' }} />
              <span>Replay Cinematic Boot Sequence</span>
            </button>
          </div>

          <div className="rm-card" style={{ borderLeft: '4px solid var(--color-danger)' }}>
            <div className="rm-card-header">
              <div className="rm-card-title">
                <RotateCcw size={18} style={{ color: 'var(--color-danger)' }} />
                <span>Reset Local Data</span>
              </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Clear all locally stored PC configurations, wishlists, simulation history, and custom settings.
              This will restore the factory sample profile (Intel Core i7-1335U + Iris Xe).
            </p>

            <button
              type="button"
              className="rm-btn rm-btn-danger"
              onClick={() => setShowResetConfirm(true)}
            >
              Reset Application Storage
            </button>
          </div>

          {/* About RigMind Box */}
          <div className="rm-card">
            <div className="rm-card-header">
              <div className="rm-card-title">
                <ShieldCheck size={18} style={{ color: 'var(--color-success)' }} />
                <span>About RigMind Engine</span>
              </div>
              <span className="rm-badge rm-badge-verified">v1.2 Production</span>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.85rem', lineHeight: '1.5' }}>
              RigMind was designed to solve the rampant issue of manufactured performance benchmarks and misleading FPS calculators online.
            </p>

            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div>
                <strong style={{ color: 'var(--text-main)' }}>1. Separation of Verified Data:</strong>{' '}
                Independent empirical testing runs are never conflated with mathematical predictions.
              </div>
              <div>
                <strong style={{ color: 'var(--text-main)' }}>2. Transparent Heuristics:</strong>{' '}
                When extrapolations are computed, every scaling factor (resolution, presets, upscalers, memory bandwidth) is explicitly documented.
              </div>
              <div>
                <strong style={{ color: 'var(--text-main)' }}>3. Defensive Ranges:</strong>{' '}
                We present realistic confidence intervals rather than illusory single-decimal point precision.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showResetConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem'
          }}
          onClick={() => setShowResetConfirm(false)}
        >
          <div
            className="rm-card"
            style={{ maxWidth: '440px', width: '100%', border: '1px solid var(--color-danger)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--color-danger)', marginBottom: '0.75rem' }}>
              <AlertTriangle size={20} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Confirm Storage Reset</h3>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Are you sure you want to reset all profiles and wishlists? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="rm-btn rm-btn-secondary"
                onClick={() => setShowResetConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rm-btn rm-btn-danger"
                onClick={handleConfirmReset}
              >
                Yes, Reset All Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
