import React, { useState } from 'react';
import {
  Database,
  Search,
  ExternalLink,
  ShieldCheck,
  Users,
  Sparkles,
  Info,
  Plus
} from 'lucide-react';
import { BENCHMARKS_DATABASE, BENCHMARK_CATEGORIES } from '../data/benchmarks';
import { useApp } from '../context/AppContext';

export const BenchmarkDatabasePage = () => {
  const { addToast } = useApp();

  const [records, setRecords] = useState(BENCHMARKS_DATABASE);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [resolutionFilter, setResolutionFilter] = useState('all');
  const [sortBy, setSortBy] = useState('avgFps'); // 'avgFps' | 'testDate'
  const [selectedBenchmark, setSelectedBenchmark] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Community submission form state
  const [submittingGame, setSubmittingGame] = useState('');
  const [submittingGpu, setSubmittingGpu] = useState('');
  const [submittingFps, setSubmittingFps] = useState('');
  const [submittingProvenance, setSubmittingProvenance] = useState('');

  const handleCommunitySubmit = (e) => {
    e.preventDefault();
    if (!submittingGame || !submittingGpu || !submittingFps) {
      addToast('Please fill out all required benchmark fields.', 'error');
      return;
    }

    const newRecord = {
      id: `bm-comm-${Date.now()}`,
      gameTitle: submittingGame,
      gpuName: submittingGpu,
      cpuName: 'User System (Unverified)',
      ram: '16GB (Unverified)',
      resolution: '1920x1080',
      graphicsPreset: 'High',
      avgFps: Number(submittingFps),
      onePercentLowFps: Math.round(Number(submittingFps) * 0.72),
      testDate: new Date().toISOString().split('T')[0],
      provenance: submittingProvenance || 'Community Self-Reported Run',
      sourceUrl: '#',
      verificationStatus: BENCHMARK_CATEGORIES.COMMUNITY,
      notes: 'Community submitted record. Placed in review queue for peer validation.'
    };

    setRecords([newRecord, ...records]);
    setShowSubmitModal(false);
    setSubmittingGame('');
    setSubmittingGpu('');
    setSubmittingFps('');
    setSubmittingProvenance('');
    addToast('Benchmark submitted to community moderation queue!', 'success');
  };

  const filteredRecords = records
    .filter((bm) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        bm.gameTitle.toLowerCase().includes(q) ||
        bm.gpuName.toLowerCase().includes(q) ||
        bm.cpuName.toLowerCase().includes(q) ||
        bm.provenance.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === 'all' || bm.verificationStatus === statusFilter;
      const matchesResolution =
        resolutionFilter === 'all' || bm.resolution === resolutionFilter;

      return matchesSearch && matchesStatus && matchesResolution;
    })
    .sort((a, b) => {
      if (sortBy === 'avgFps') return b.avgFps - a.avgFps;
      if (sortBy === 'testDate') return new Date(b.testDate) - new Date(a.testDate);
      return 0;
    });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header Banner */}
      <div className="rm-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'var(--accent-subtle)', color: 'var(--accent-primary)' }}>
              <Database size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Benchmark Database</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Verified hardware telemetry with complete reviewer attribution and peer-moderation tracking.
              </p>
            </div>
          </div>

          <button className="rm-btn rm-btn-secondary" onClick={() => setShowSubmitModal(true)}>
            <Plus size={16} />
            <span>Submit Benchmark Run</span>
          </button>
        </div>
      </div>

      {/* Origin Classification Explanation Strip */}
      <div className="grid-4">
        <div style={{ padding: '0.75rem 1rem', background: 'var(--color-success-bg)', border: '1px solid rgba(74, 222, 128, 0.25)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-success)', fontWeight: 700, fontSize: '0.85rem' }}>
            <ShieldCheck size={16} />
            <span>Verified Runs</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Empirically measured by independent testing outlets (Gamers Nexus, Hardware Unboxed, etc.)
          </div>
        </div>

        <div style={{ padding: '0.75rem 1rem', background: 'var(--color-info-bg)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-info)', fontWeight: 700, fontSize: '0.85rem' }}>
            <Users size={16} />
            <span>Community Telemetry</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            User submitted logs pending editorial replication.
          </div>
        </div>

        <div style={{ padding: '0.75rem 1rem', background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.25)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#C084FC', fontWeight: 700, fontSize: '0.85rem' }}>
            <Sparkles size={16} />
            <span>Model Estimates</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Derived from architectural shader/IPC simulation algorithms.
          </div>
        </div>

        <div style={{ padding: '0.75rem 1rem', background: 'var(--color-warning-bg)', border: '1px solid rgba(251, 191, 36, 0.25)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-warning)', fontWeight: 700, fontSize: '0.85rem' }}>
            <Info size={16} />
            <span>Demonstration</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Clearly marked illustrative baseline calibration scenarios.
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="rm-card" style={{ padding: '1rem 1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ position: 'relative', flex: '1 1 280px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="rm-input"
              style={{ paddingLeft: '2.4rem' }}
              placeholder="Search by game, GPU, CPU, or reviewer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <select
              className="rm-select"
              style={{ width: 'auto' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Verification Statuses</option>
              <option value="verified">Verified Records Only</option>
              <option value="community">Community Submissions</option>
              <option value="demonstration">Demonstration Records</option>
            </select>

            <select
              className="rm-select"
              style={{ width: 'auto' }}
              value={resolutionFilter}
              onChange={(e) => setResolutionFilter(e.target.value)}
            >
              <option value="all">All Resolutions</option>
              <option value="1280x720">720p HD</option>
              <option value="1920x1080">1080p FHD</option>
              <option value="2560x1440">1440p QHD</option>
              <option value="3840x2160">4K UHD</option>
            </select>

            <select
              className="rm-select"
              style={{ width: 'auto' }}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="avgFps">Sort: Highest Average FPS</option>
              <option value="testDate">Sort: Most Recent Test Date</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table of Records */}
      <div className="rm-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-input)', borderBottom: '1px solid var(--border-main)', textAlign: 'left' }}>
                <th style={{ padding: '0.85rem 1.25rem', color: 'var(--text-muted)' }}>Game & Settings</th>
                <th style={{ padding: '0.85rem 1.25rem', color: 'var(--text-muted)' }}>Hardware Specification</th>
                <th style={{ padding: '0.85rem 1.25rem', color: 'var(--text-muted)' }}>Average FPS</th>
                <th style={{ padding: '0.85rem 1.25rem', color: 'var(--text-muted)' }}>1% Low FPS</th>
                <th style={{ padding: '0.85rem 1.25rem', color: 'var(--text-muted)' }}>Origin & Verification</th>
                <th style={{ padding: '0.85rem 1.25rem', color: 'var(--text-muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((bm) => (
                <tr key={bm.id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background var(--transition-fast)' }} className="table-row-hover">
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ fontWeight: 700 }}>{bm.gameTitle}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      {bm.resolution} • {bm.graphicsPreset} Preset
                      {bm.upscaling && ` • ${bm.upscaling}`}
                    </div>
                  </td>

                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ fontWeight: 600 }}>{bm.gpuName}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {bm.cpuName} • {bm.ram}
                    </div>
                  </td>

                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>
                      {bm.avgFps} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>FPS</span>
                    </div>
                  </td>

                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-warning)' }}>
                      {bm.onePercentLowFps ? `${bm.onePercentLowFps} FPS` : 'N/A'}
                    </div>
                  </td>

                  <td style={{ padding: '1rem 1.25rem' }}>
                    {bm.verificationStatus === 'verified' && (
                      <span className="rm-badge rm-badge-verified">Verified</span>
                    )}
                    {bm.verificationStatus === 'community' && (
                      <span className="rm-badge rm-badge-community">Community</span>
                    )}
                    {bm.verificationStatus === 'demonstration' && (
                      <span className="rm-badge rm-badge-demonstration">Demo</span>
                    )}
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      {bm.provenance}
                    </div>
                  </td>

                  <td style={{ padding: '1rem 1.25rem' }}>
                    <button
                      className="rm-btn rm-btn-secondary rm-btn-sm"
                      onClick={() => setSelectedBenchmark(bm)}
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Benchmark Detail View Modal */}
      {selectedBenchmark && (
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
          onClick={() => setSelectedBenchmark(null)}
        >
          <div
            className="rm-card"
            style={{ maxWidth: '640px', width: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rm-card-header">
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{selectedBenchmark.gameTitle}</h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Tested on {selectedBenchmark.testDate}
                </div>
              </div>
              <button
                className="rm-btn rm-btn-secondary rm-btn-sm"
                onClick={() => setSelectedBenchmark(null)}
              >
                Close
              </button>
            </div>

            <div style={{ display: 'flex', gap: '1rem', margin: '1rem 0' }}>
              <div style={{ flex: 1, padding: '1rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Average FPS</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                  {selectedBenchmark.avgFps}
                </div>
              </div>

              <div style={{ flex: 1, padding: '1rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>1% Low FPS</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--color-warning)' }}>
                  {selectedBenchmark.onePercentLowFps || 'N/A'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              <div><strong>Processor:</strong> {selectedBenchmark.cpuName}</div>
              <div><strong>Graphics Card:</strong> {selectedBenchmark.gpuName}</div>
              <div><strong>System RAM:</strong> {selectedBenchmark.ram}</div>
              <div><strong>Resolution & Preset:</strong> {selectedBenchmark.resolution} ({selectedBenchmark.graphicsPreset})</div>
              {selectedBenchmark.driverVersion && (
                <div><strong>Driver Version:</strong> {selectedBenchmark.driverVersion}</div>
              )}
              {selectedBenchmark.notes && (
                <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)' }}>
                  <strong>Reviewer Notes:</strong> {selectedBenchmark.notes}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Provenance: {selectedBenchmark.provenance}
              </div>
              {selectedBenchmark.sourceUrl && selectedBenchmark.sourceUrl !== '#' && (
                <a
                  href={selectedBenchmark.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rm-btn rm-btn-secondary rm-btn-sm"
                >
                  <span>Visit Source</span>
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Community Submission Modal */}
      {showSubmitModal && (
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
          onClick={() => setShowSubmitModal(false)}
        >
          <div
            className="rm-card"
            style={{ maxWidth: '540px', width: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rm-card-header">
              <div className="rm-card-title">
                <Users size={18} style={{ color: 'var(--color-info)' }} />
                <span>Submit Community Benchmark Run</span>
              </div>
              <button
                className="rm-btn rm-btn-secondary rm-btn-sm"
                onClick={() => setShowSubmitModal(false)}
              >
                Cancel
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Submissions enter our peer-review queue and are clearly tagged as community telemetry
              until verified by editorial reproduction.
            </p>

            <form onSubmit={handleCommunitySubmit}>
              <div className="rm-form-group">
                <label className="rm-form-label" htmlFor="sub-game-title">Game Title</label>
                <input
                  id="sub-game-title"
                  type="text"
                  className="rm-input"
                  placeholder="e.g. Cyberpunk 2077"
                  value={submittingGame}
                  onChange={(e) => setSubmittingGame(e.target.value)}
                  required
                />
              </div>

              <div className="rm-form-group">
                <label className="rm-form-label" htmlFor="sub-gpu-model">Graphics Card (GPU)</label>
                <input
                  id="sub-gpu-model"
                  type="text"
                  className="rm-input"
                  placeholder="e.g. GeForce RTX 4060 8GB"
                  value={submittingGpu}
                  onChange={(e) => setSubmittingGpu(e.target.value)}
                  required
                />
              </div>

              <div className="rm-form-group">
                <label className="rm-form-label" htmlFor="sub-avg-fps">Measured Average FPS</label>
                <input
                  id="sub-avg-fps"
                  type="number"
                  step="0.1"
                  className="rm-input"
                  placeholder="e.g. 74.5"
                  value={submittingFps}
                  onChange={(e) => setSubmittingFps(e.target.value)}
                  required
                />
              </div>

              <div className="rm-form-group">
                <label className="rm-form-label" htmlFor="sub-source-tool">Telemetry Tool / Log Source</label>
                <input
                  id="sub-source-tool"
                  type="text"
                  className="rm-input"
                  placeholder="e.g. CapFrameX / MSI Afterburner log file"
                  value={submittingProvenance}
                  onChange={(e) => setSubmittingProvenance(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="rm-btn rm-btn-secondary"
                  onClick={() => setShowSubmitModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="rm-btn rm-btn-primary">
                  Submit Benchmark
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
