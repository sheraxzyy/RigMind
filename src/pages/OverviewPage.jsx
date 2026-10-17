import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Cpu,
  Tv,
  HardDrive,
  Layers,
  ArrowRight,
  FlaskConical,
  Gamepad2,
  Wrench,
  Database,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CPU_DATABASE, GPU_DATABASE } from '../data/hardware';
import { GAMES_CATALOG } from '../data/games';
import { BENCHMARKS_DATABASE } from '../data/benchmarks';
import { GameSearchBar } from '../components/games/GameSearchBar';

export const OverviewPage = () => {
  const navigate = useNavigate();
  const { activeProfile } = useApp();

  const currentCpu = CPU_DATABASE.find((c) => c.id === activeProfile?.cpuId);
  const currentGpu = GPU_DATABASE.find((g) => g.id === activeProfile?.gpuId);

  // Calculate coverage stats
  const verifiedCount = BENCHMARKS_DATABASE.filter((b) => b.verificationStatus === 'verified').length;
  const communityCount = BENCHMARKS_DATABASE.filter((b) => b.verificationStatus === 'community').length;
  const demoCount = BENCHMARKS_DATABASE.filter((b) => b.verificationStatus === 'demonstration').length;

  const quickTools = [
    {
      title: 'Performance Lab',
      desc: 'Simulate gaming FPS and uncover bottlenecks before downloading',
      path: '/lab',
      icon: FlaskConical,
      accent: '#E53945'
    },
    {
      title: 'Game Explorer',
      desc: 'Inspect verified requirements for modern titles and check fit',
      path: '/games',
      icon: Gamepad2,
      accent: '#38BDF8'
    },
    {
      title: 'Upgrade Advisor',
      desc: 'Calculate budget-friendly component upgrades for your rig',
      path: '/upgrade',
      icon: Wrench,
      accent: '#4ADE80'
    },
    {
      title: 'Benchmark Explorer',
      desc: 'Browse verified real-world hardware runs with source citations',
      path: '/benchmarks',
      icon: Database,
      accent: '#FBBF24'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Welcome Banner */}
      <div
        className="rm-card"
        style={{
          background: 'linear-gradient(135deg, rgba(229, 57, 69, 0.08) 0%, rgba(20, 20, 20, 0.95) 100%)',
          border: '1px solid rgba(229, 57, 69, 0.25)',
          overflow: 'visible',
          position: 'relative',
          zIndex: 60
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
              <span className="rm-badge rm-badge-crimson">
                <Sparkles size={13} />
                PC Gaming Intelligence
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                RigMind Core v1.2
              </span>
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>
              Know Your Rig. Own Your Performance.
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '640px', fontSize: '0.95rem', marginBottom: '1.25rem' }}>
              Welcome to RigMind. Explore honest gaming performance estimates, cross-reference empirical benchmarks,
              and check verified PC hardware requirements across thousands of titles.
            </p>

            <div style={{ maxWidth: '620px' }}>
              <GameSearchBar placeholder="Search PC games database or discover on Steam (e.g. Cyberpunk, Witcher, Elden Ring)..." />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button className="rm-btn rm-btn-primary" onClick={() => navigate('/lab')}>
              <FlaskConical size={16} />
              <span>Launch Lab Test</span>
            </button>
            <button className="rm-btn rm-btn-secondary" onClick={() => navigate('/games')}>
              <Gamepad2 size={16} />
              <span>Explore All Games</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active PC Spec Grid */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
              Active Configuration: {activeProfile?.name}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Hardware specifications saved locally in your browser profile (No fabricated telemetry)
            </p>
          </div>
          <button
            className="rm-btn rm-btn-secondary rm-btn-sm"
            onClick={() => navigate('/my-pc')}
          >
            Edit Profile
          </button>
        </div>

        <div className="grid-4">
          {/* CPU Card */}
          <div className="rm-card rm-card-glow">
            <div className="rm-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ padding: '0.45rem', borderRadius: '8px', background: 'rgba(229, 57, 69, 0.12)', color: '#E53945' }}>
                  <Cpu size={18} />
                </div>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Processor (CPU)</span>
              </div>
              <span className="rm-badge" style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}>
                {currentCpu?.formFactor || activeProfile?.formFactor}
              </span>
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              {currentCpu?.name || activeProfile?.cpuCustom || 'Intel Core i7-1335U'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <span>Cores/Threads: {currentCpu?.cores || '10 Cores'} ({currentCpu?.threads || 12} Threads)</span>
              <span>Architecture: {currentCpu?.architecture || 'Hybrid'} ({currentCpu?.tdpWatts || 15}W TDP)</span>
            </div>
          </div>

          {/* GPU Card */}
          <div className="rm-card rm-card-glow">
            <div className="rm-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ padding: '0.45rem', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.12)', color: '#38BDF8' }}>
                  <Tv size={18} />
                </div>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Graphics (GPU)</span>
              </div>
              <span className="rm-badge" style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}>
                {currentGpu?.formFactor || 'iGPU'}
              </span>
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              {currentGpu?.name || activeProfile?.gpuCustom || 'Intel Iris Xe'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <span>VRAM: {currentGpu?.vramGb || 'Shared System RAM'}</span>
              <span>Ray Tracing: {currentGpu?.rayTracing ? 'Supported (HW)' : 'Unsupported'}</span>
            </div>
          </div>

          {/* RAM Card */}
          <div className="rm-card rm-card-glow">
            <div className="rm-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ padding: '0.45rem', borderRadius: '8px', background: 'rgba(74, 222, 128, 0.12)', color: '#4ADE80' }}>
                  <Layers size={18} />
                </div>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>System Memory (RAM)</span>
              </div>
              <span className="rm-badge rm-badge-verified">
                {activeProfile?.ramCapacityGb} GB
              </span>
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              {activeProfile?.ramCapacityGb} GB Installed
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <span>Config: {activeProfile?.ramConfiguration || 'Dual Channel'}</span>
              <span>Gaming Fit: {activeProfile?.ramCapacityGb >= 16 ? 'Standard Sweet Spot' : 'Capacity Constrained'}</span>
            </div>
          </div>

          {/* Storage & OS Card */}
          <div className="rm-card rm-card-glow">
            <div className="rm-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ padding: '0.45rem', borderRadius: '8px', background: 'rgba(251, 191, 36, 0.12)', color: '#FBBF24' }}>
                  <HardDrive size={18} />
                </div>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Storage & Display</span>
              </div>
              <span className="rm-badge" style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}>
                {activeProfile?.operatingSystem ? 'Win 10/11' : 'OS'}
              </span>
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              {activeProfile?.storageCapacityGb || 512} GB {activeProfile?.storageType || 'NVMe SSD'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <span>Target Res: {activeProfile?.displayResolution || '1080p'} ({activeProfile?.refreshRateHz || 60}Hz)</span>
              <span>OS: {activeProfile?.operatingSystem || 'Windows 10 64-bit'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Core Tools Grid */}
      <div>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem' }}>
          RigMind Diagnostic Tools
        </h3>
        <div className="grid-4">
          {quickTools.map((tool) => {
            const IconComp = tool.icon;
            return (
              <div
                key={tool.title}
                className="rm-card rm-card-glow"
                style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                onClick={() => navigate(tool.path)}
              >
                <div>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: tool.accent, marginBottom: '1rem' }}>
                    <IconComp size={22} />
                  </div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    {tool.title}
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    {tool.desc}
                  </p>
                </div>
                <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-hover)', fontSize: '0.85rem', fontWeight: 600 }}>
                  <span>Launch Tool</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Section: Recent Analyses & Coverage Status */}
      <div className="grid-2">
        {/* Left: Recently Checked Games */}
        <div className="rm-card">
          <div className="rm-card-header">
            <div>
              <div className="rm-card-title">
                <Gamepad2 size={18} style={{ color: 'var(--accent-primary)' }} />
                <span>Popular Verified Games</span>
              </div>
              <div className="rm-card-subtitle">Quick benchmark check with your active rig</div>
            </div>
            <button className="rm-btn rm-btn-secondary rm-btn-sm" onClick={() => navigate('/games')}>
              View All
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {GAMES_CATALOG.slice(0, 4).map((game) => (
              <div
                key={game.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{game.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {game.genre} • {game.tier}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    className="rm-btn rm-btn-secondary rm-btn-sm"
                    onClick={() => navigate(`/games/${game.id}`)}
                  >
                    Specs
                  </button>
                  <button
                    className="rm-btn rm-btn-primary rm-btn-sm"
                    onClick={() => navigate(`/lab?game=${game.id}`)}
                  >
                    Analyze
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Data Transparency & Coverage Indicator */}
        <div className="rm-card">
          <div className="rm-card-header">
            <div>
              <div className="rm-card-title">
                <ShieldCheck size={18} style={{ color: 'var(--color-success)' }} />
                <span>Benchmark Data Provenance</span>
              </div>
              <div className="rm-card-subtitle">RigMind strict data transparency ledger</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span className="rm-badge rm-badge-verified">Verified</span>
                <span style={{ fontSize: '0.85rem' }}>Empirical Reviewer Runs</span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{verifiedCount} records</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span className="rm-badge rm-badge-community">Community</span>
                <span style={{ fontSize: '0.85rem' }}>Pending Peer Moderation</span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{communityCount} records</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span className="rm-badge rm-badge-demonstration">Calibration</span>
                <span style={{ fontSize: '0.85rem' }}>Demonstration Scenarios</span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{demoCount} records</span>
            </div>

            <div style={{ padding: '0.85rem', background: 'rgba(229, 57, 69, 0.06)', border: '1px solid rgba(229, 57, 69, 0.2)', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--accent-hover)' }}>Honest Performance Promise:</strong>
              {' '}RigMind never fabricates real-time GPU thermals, CPU load, or synthetic live benchmarks.
              When an exact match is missing, the estimator explicitly marks results as an architectural heuristic approximation.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
