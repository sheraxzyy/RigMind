import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Cpu,
  Tv,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  ShieldCheck,
  Layers as LayersIcon,
  FlaskConical,
  Heart,
  ChevronLeft,
  Loader2,
  Info,
  Sparkles,
  Zap
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { apiService } from '../services/apiService';
import { CPU_DATABASE, GPU_DATABASE } from '../data/hardware';

export const GameDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeProfile, wishlist, toggleWishlist, addToast } = useApp();

  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Compatibility evaluation state
  const [compatResult, setCompatResult] = useState(null);
  const [isCheckingCompat, setIsCheckingCompat] = useState(false);

  // User spec inputs for compatibility checker
  const [userCpu, setUserCpu] = useState(activeProfile?.cpuId || '');
  const [userGpu, setUserGpu] = useState(activeProfile?.gpuId || '');
  const [userRam, setUserRam] = useState(activeProfile?.ramCapacityGb || 16);
  const userStorage = activeProfile?.storageCapacityGb || 512;
  const userStorageType = activeProfile?.storageType || 'NVMe SSD';
  const userOs = activeProfile?.operatingSystem || 'Windows 10 64-bit';
  const [targetFps, setTargetFps] = useState(60);
  const graphicsPref = 'High';

  const runCompatCheck = useCallback(async (targetGame, overrides = {}) => {
    const activeGame = targetGame;
    if (!activeGame) return;
    setIsCheckingCompat(true);

    const cpuVal = overrides.userCpu !== undefined ? overrides.userCpu : userCpu;
    const gpuVal = overrides.userGpu !== undefined ? overrides.userGpu : userGpu;
    const ramVal = overrides.userRam !== undefined ? overrides.userRam : userRam;

    const currentCpuObj = CPU_DATABASE.find((c) => c.id === cpuVal);
    const currentGpuObj = GPU_DATABASE.find((g) => g.id === gpuVal);

    try {
      const result = await apiService.checkCompatibility({
        gameId: activeGame.id || id,
        cpuName: currentCpuObj ? currentCpuObj.name : cpuVal,
        gpuName: currentGpuObj ? currentGpuObj.name : gpuVal,
        ramCapacityGb: Number(ramVal),
        storageGb: Number(userStorage),
        storageType: userStorageType,
        operatingSystem: userOs,
        targetFps: Number(targetFps),
        graphicsPreference: graphicsPref
      });
      setCompatResult(result);
    } catch (err) {
      console.warn('[GameDetailPage] Compatibility evaluation failed:', err);
    } finally {
      setIsCheckingCompat(false);
    }
  }, [userCpu, userGpu, userRam, userStorage, userStorageType, userOs, targetFps, graphicsPref, id]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const loadGame = async () => {
      try {
        const data = await apiService.getGameById(id);
        if (isMounted) {
          setGame(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Game details could not be found.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadGame();
    return () => { isMounted = false; };
  }, [id]);

  useEffect(() => {
    if (game?.id === id) runCompatCheck(game);
  }, [game, id, runCompatCheck]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '1rem' }}>
        <Loader2 size={36} className="spin-animation" style={{ color: 'var(--accent-primary)' }} />
        <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
          Retrieving verified specifications from game database...
        </div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="rm-card" style={{ textAlign: 'center', padding: '3rem 2rem', borderLeft: '4px solid var(--color-danger)' }}>
        <AlertTriangle size={36} style={{ color: 'var(--color-danger)', marginBottom: '1rem' }} />
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Game Not Found</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', maxWidth: '480px', margin: '0 auto 1.5rem auto' }}>
          {error || `The game identifier "${id}" does not exist in the database or could not be retrieved from external sources.`}
        </p>
        <button className="rm-btn rm-btn-secondary" onClick={() => navigate('/games')}>
          <ChevronLeft size={16} />
          <span>Return to Game Explorer</span>
        </button>
      </div>
    );
  }

  const isWishlisted = wishlist.includes(game.id);

  // Verification Badge Helper
  const getVerificationBadge = (status) => {
    switch (status) {
      case 'Official':
        return <span className="rm-badge rm-badge-verified"><ShieldCheck size={13} /> Official Publisher Spec</span>;
      case 'Verified third-party':
        return <span className="rm-badge rm-badge-community"><CheckCircle2 size={13} /> Verified Third-Party</span>;
      case 'Community-reported':
        return <span className="rm-badge rm-badge-model"><Info size={13} /> Community-Reported</span>;
      case 'Not available':
        return <span className="rm-badge rm-badge-demonstration"><Info size={13} /> Publisher specs unavailable</span>;
      default:
        return <span className="rm-badge rm-badge-demonstration"><AlertTriangle size={13} /> Unverified / Preliminary</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Back Link */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          className="rm-btn rm-btn-secondary rm-btn-sm"
          onClick={() => navigate('/games')}
        >
          <ChevronLeft size={16} />
          <span>Back to Game Explorer</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {getVerificationBadge(game.requirementsVerification)}
          <button
            className="sidebar-toggle-btn"
            style={{ width: '34px', height: '34px', color: isWishlisted ? 'var(--accent-primary)' : 'var(--text-secondary)' }}
            onClick={() => toggleWishlist(game.id)}
            title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart size={16} fill={isWishlisted ? 'var(--accent-primary)' : 'none'} />
          </button>
        </div>
      </div>

      {/* Hero Header Card */}
      <div
        className="rm-card"
        style={{
          background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.98) 0%, rgba(12, 12, 12, 0.98) 100%)',
          border: '1px solid var(--border-main)',
          padding: '2rem',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {/* Cover Art */}
          {game.coverImage && (
            <div style={{ position: 'relative', flexShrink: 0, width: '280px', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-subtle)' }}>
              <img
                src={game.coverImage}
                alt={game.title}
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0.6rem 0.8rem', background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {game.steamAppId ? `Steam AppID: ${game.steamAppId}` : 'PC Release'}
              </div>
            </div>
          )}

          {/* Game Metadata */}
          <div style={{ flex: '1 1 340px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              <span className="rm-badge" style={{ background: 'var(--bg-input)', color: 'var(--text-main)' }}>
                {game.releaseDate || 'PC'}
              </span>
              <span className="rm-badge" style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38BDF8', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
                {game.genre || (game.genres && game.genres[0]) || 'PC Game'}
              </span>
              {game.tier && (
                <span className="rm-badge rm-badge-crimson">
                  {game.tier}
                </span>
              )}
            </div>

            <h1 style={{ fontSize: '2.1rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.6rem', lineHeight: '1.2' }}>
              {game.title}
            </h1>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Developer:</span>{' '}
                <strong>{Array.isArray(game.developers) ? game.developers.join(', ') : game.developer || 'Unknown'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Publisher:</span>{' '}
                <strong>{Array.isArray(game.publishers) ? game.publishers.join(', ') : game.publisher || 'Unknown'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Platform:</span>{' '}
                <strong>{Array.isArray(game.platforms) ? game.platforms.join(', ') : 'Windows PC'}</strong>
              </div>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.6', marginBottom: '1.5rem', maxWidth: '750px' }}>
              {game.description}
            </p>

            {/* Store & Source Links */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {game.storeLinks && game.storeLinks.map((store, i) => (
                <a
                  key={i}
                  href={store.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rm-btn rm-btn-secondary rm-btn-sm"
                  style={{ gap: '0.4rem' }}
                >
                  <span>{store.name}</span>
                  <ExternalLink size={12} />
                </a>
              ))}

              <button
                className="rm-btn rm-btn-primary rm-btn-sm"
                onClick={() => navigate(`/lab?game=${game.id}`)}
              >
                <FlaskConical size={14} />
                <span>Simulate FPS in Performance Lab</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RigMind Real Hardware Compatibility Engine Component */}
      <div className="rm-card" style={{ borderLeft: `4px solid ${compatResult?.verdictColor || 'var(--accent-primary)'}` }}>
        <div className="rm-card-header">
          <div>
            <div className="rm-card-title">
              <Sparkles size={18} style={{ color: 'var(--accent-primary)' }} />
              <span>RigMind Real PC Hardware Compatibility Engine</span>
            </div>
            <div className="rm-card-subtitle">
              Comparing your PC components against publisher-documented minimum and recommended requirements
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Evaluating Rig:</span>
            <span className="rm-badge rm-badge-crimson">{activeProfile?.name || 'Custom PC'}</span>
          </div>
        </div>

        {/* Verdict Banner */}
        {compatResult && (
          <div
            style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              background: `${compatResult.verdictColor}12`,
              border: `1px solid ${compatResult.verdictColor}35`,
              marginBottom: '1.5rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
              {compatResult.verdict.includes('recommended') ? (
                <CheckCircle2 size={22} style={{ color: compatResult.verdictColor }} />
              ) : compatResult.verdict.includes('minimum') ? (
                <AlertTriangle size={22} style={{ color: compatResult.verdictColor }} />
              ) : compatResult.verdict.includes('assessment') || compatResult.verdict.includes('unavailable') ? (
                <Info size={22} style={{ color: compatResult.verdictColor }} />
              ) : (
                <XCircle size={22} style={{ color: compatResult.verdictColor }} />
              )}
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: compatResult.verdictColor }}>
                {compatResult.verdict}
              </h3>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              {compatResult.summary}
            </p>
          </div>
        )}

        {/* Component-by-Component Spec Evaluation Matrix */}
        {compatResult?.components && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {Object.entries(compatResult.components).map(([compKey, compData]) => {
              const isPass = compData.status === 'meets_recommended';
              const isMarginal = compData.status === 'meets_minimum';
              const isUnknown = compData.status === 'not_evaluated';
              const statusColor = isPass ? 'var(--color-success)' : isMarginal ? 'var(--color-warning)' : isUnknown ? 'var(--text-muted)' : 'var(--color-danger)';
              const statusBadge = isPass ? 'Meets Recommended' : isMarginal ? 'Meets Minimum' : isUnknown ? 'Not Assessed' : 'Below Minimum';

              return (
                <div
                  key={compKey}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1rem',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    gap: '1rem',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ flex: '1 1 240px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {compKey}
                      </span>
                      <span className="rm-badge" style={{ background: `${statusColor}20`, color: statusColor, border: `1px solid ${statusColor}40`, padding: '0.15rem 0.5rem', fontSize: '0.72rem' }}>
                        {statusBadge}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                      {compData.userSpec}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      {compData.detail}
                    </div>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                    <div><strong>Published Minimum:</strong> {compData.minSpec || 'N/A'}</div>
                    <div style={{ marginTop: '0.2rem' }}><strong>Recommended:</strong> {compData.recSpec || 'N/A'}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Interactive Specs Adjustment Strip */}
        <div style={{ padding: '1rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
            Test with Custom Hardware Parameters
          </div>
          <div className="grid-4" style={{ marginBottom: '1rem' }}>
            <div className="rm-form-group" style={{ marginBottom: 0 }}>
              <label className="rm-form-label" htmlFor="user-cpu-select">Processor (CPU)</label>
              <select
                id="user-cpu-select"
                className="rm-select"
                value={userCpu}
                onChange={(e) => setUserCpu(e.target.value)}
              >
                {CPU_DATABASE.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="rm-form-group" style={{ marginBottom: 0 }}>
              <label className="rm-form-label" htmlFor="user-gpu-select">Graphics Card (GPU)</label>
              <select
                id="user-gpu-select"
                className="rm-select"
                value={userGpu}
                onChange={(e) => setUserGpu(e.target.value)}
              >
                {GPU_DATABASE.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            <div className="rm-form-group" style={{ marginBottom: 0 }}>
              <label className="rm-form-label" htmlFor="user-ram-select">Installed RAM (GB)</label>
              <select
                id="user-ram-select"
                className="rm-select"
                value={userRam}
                onChange={(e) => setUserRam(Number(e.target.value))}
              >
                <option value={8}>8 GB</option>
                <option value={16}>16 GB</option>
                <option value={32}>32 GB</option>
                <option value={64}>64 GB</option>
              </select>
            </div>

            <div className="rm-form-group" style={{ marginBottom: 0 }}>
              <label className="rm-form-label" htmlFor="user-target-fps">Target Framerate</label>
              <select
                id="user-target-fps"
                className="rm-select"
                value={targetFps}
                onChange={(e) => setTargetFps(Number(e.target.value))}
              >
                <option value={30}>30 FPS (Cinematic / Console Target)</option>
                <option value={60}>60 FPS (Smooth PC Standard)</option>
                <option value={120}>120+ FPS (High Refresh / Esports)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              className="rm-btn rm-btn-secondary rm-btn-sm"
              onClick={() => {
                if (activeProfile) {
                  setUserCpu(activeProfile.cpuId || '');
                  setUserGpu(activeProfile.gpuId || '');
                  setUserRam(activeProfile.ramCapacityGb || 16);
                  runCompatCheck(game);
                  addToast('Reset to Active PC Profile hardware', 'info');
                }
              }}
            >
              Reset to Active Rig
            </button>
            <button
              className="rm-btn rm-btn-primary rm-btn-sm"
              onClick={() => runCompatCheck(game)}
              disabled={isCheckingCompat}
            >
              {isCheckingCompat ? <Loader2 size={14} className="spin-animation" /> : <Zap size={14} />}
              <span>Re-check Hardware Fit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Minimum vs Recommended Side-by-Side Comparison */}
      <div className="grid-2">
        {/* Minimum Specs Card */}
        <div className="rm-card" style={{ borderLeft: '4px solid var(--color-warning)' }}>
          <div className="rm-card-header">
            <div className="rm-card-title">
              <AlertTriangle size={18} style={{ color: 'var(--color-warning)' }} />
              <span>Minimum System Requirements</span>
            </div>
            <span className="rm-badge" style={{ background: 'var(--color-warning-bg)', color: 'var(--color-warning)' }}>
              Entry Threshold
            </span>
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Published Target: <strong>{game.minimum?.target || 'Not specified by publisher'}</strong>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.88rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
              <Cpu size={16} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Processor (CPU)</span>
                <div>{game.minimum?.cpu || 'Not documented'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
              <Tv size={16} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Graphics (GPU) & VRAM</span>
                <div>{game.minimum?.gpu || 'Not documented'} {game.minimum?.vram && `(${game.minimum.vram} VRAM)`}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
              <LayersIcon size={16} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Memory (RAM)</span>
                <div>{game.minimum?.ram || (game.minimum?.ramGb ? `${game.minimum.ramGb} GB` : 'Not published')}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
              <HardDrive size={16} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Storage Drive Space</span>
                <div>{game.minimum?.storage || (game.minimum?.storageGb ? `${game.minimum.storageGb} GB` : 'Not published')} {game.minimum?.storageType ? `(${game.minimum.storageType})` : ''}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
              <Info size={16} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Operating System & DirectX</span>
                <div>{game.minimum?.os || 'Not published'}{game.minimum?.directX ? ` • ${game.minimum.directX}` : ''}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recommended Specs Card */}
        <div className="rm-card" style={{ borderLeft: '4px solid var(--color-success)' }}>
          <div className="rm-card-header">
            <div className="rm-card-title">
              <CheckCircle2 size={18} style={{ color: 'var(--color-success)' }} />
              <span>Recommended System Requirements</span>
            </div>
            <span className={`rm-badge ${game.requirementsVerification === 'Official' ? 'rm-badge-verified' : 'rm-badge-demonstration'}`}>
              {game.requirementsVerification === 'Official' ? 'Publisher Published' : 'Unverified'}
            </span>
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Published Target: <strong>{game.recommended?.target || 'Not specified by publisher'}</strong>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.88rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
              <Cpu size={16} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Processor (CPU)</span>
                <div>{game.recommended?.cpu || 'Not documented'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
              <Tv size={16} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Graphics (GPU) & VRAM</span>
                <div>{game.recommended?.gpu || 'Not documented'} {game.recommended?.vram && `(${game.recommended.vram} VRAM)`}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
              <LayersIcon size={16} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Memory (RAM)</span>
                <div>{game.recommended?.ram || (game.recommended?.ramGb ? `${game.recommended.ramGb} GB` : 'Not published')}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
              <HardDrive size={16} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Storage Drive Space</span>
                <div>{game.recommended?.storage || (game.recommended?.storageGb ? `${game.recommended.storageGb} GB` : 'Not published')} {game.recommended?.storageType ? `(${game.recommended.storageType})` : ''}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
              <Info size={16} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Operating System & DirectX</span>
                <div>{game.recommended?.os || 'Not published'}{game.recommended?.directX ? ` • ${game.recommended.directX}` : ''}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Provenance & Source Reference Strip */}
      <div className="rm-card" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <strong>Specification Provenance:</strong> {game.requirementsSource || 'Official Store Technical Release'}
            {game.lastVerified && ` • Last verified on ${game.lastVerified}`}
          </div>
          {game.sourceUrl && (
            <a
              href={game.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--accent-hover)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <span>View Original Publisher Technical Document</span>
              <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
