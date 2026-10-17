import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FlaskConical,
  Gauge,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Zap,
  Sliders,
  ExternalLink,
  RefreshCw,
  Search,
  Globe,
  Gamepad2,
  Loader2,
  Layers,
  Award,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CPU_DATABASE, GPU_DATABASE, RESOLUTION_PRESETS, GRAPHICS_PRESETS } from '../data/hardware';
import { GAMES_CATALOG } from '../data/games';
import { performanceEstimator } from '../services/performanceEstimator';
import { apiService } from '../services/apiService';
import { parseSearchRegex } from '../utils/regexHelper';

export const PerformanceLabPage = () => {
  const [searchParams] = useSearchParams();
  const { activeProfile, recordAnalysis, addToast } = useApp();

  // Inputs
  const [selectedCpuId, setSelectedCpuId] = useState(activeProfile?.cpuId || CPU_DATABASE[0].id);
  const [selectedGpuId, setSelectedGpuId] = useState(activeProfile?.gpuId || GPU_DATABASE[0].id);
  const [ramCapacity, setRamCapacity] = useState(activeProfile?.ramCapacityGb || 16);
  const [selectedGame, setSelectedGame] = useState(GAMES_CATALOG[0]);
  const [selectedGameId, setSelectedGameId] = useState(GAMES_CATALOG[0].id);
  const [resolution, setResolution] = useState('1920x1080');
  const [graphicsPreset, setGraphicsPreset] = useState('High');
  const [upscaling, setUpscaling] = useState('none');

  // Game Search States for Target Game
  const [isSearchingGame, setIsSearchingGame] = useState(false);
  const [gameSearchQuery, setGameSearchQuery] = useState('');
  const [gameSearchResults, setGameSearchResults] = useState(GAMES_CATALOG.slice(0, 8));
  const [isLiveSearching, setIsLiveSearching] = useState(false);

  // Results State
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Initialize from active profile or query param
  useEffect(() => {
    if (activeProfile) {
      if (activeProfile.cpuId) setSelectedCpuId(activeProfile.cpuId);
      if (activeProfile.gpuId) setSelectedGpuId(activeProfile.gpuId);
      if (activeProfile.ramCapacityGb) setRamCapacity(activeProfile.ramCapacityGb);
    }

    const gameParam = searchParams.get('game');
    if (gameParam) {
      const local = GAMES_CATALOG.find((g) => g.id === gameParam || g.slug === gameParam);
      if (local) {
        setSelectedGame(local);
        setSelectedGameId(local.id);
      } else {
        apiService.getGameById(gameParam)
          .then((fetched) => {
            if (fetched) {
              setSelectedGame(fetched);
              setSelectedGameId(fetched.id);
            }
          })
          .catch(() => {
            addToast('Could not load this game’s published specs. Search and select a verified game instead.', 'error');
          });
      }
    } else {
      apiService.getGameById(GAMES_CATALOG[0].id)
        .then((loadedGame) => {
          if (loadedGame) {
            setSelectedGame(loadedGame);
            setSelectedGameId(loadedGame.id);
          }
        })
        .catch(() => {
          addToast('Could not refresh publisher requirements. Only exact measured FPS runs can be analyzed.', 'info');
        });
    }
  }, [activeProfile, searchParams, addToast]);

  // Live search for target game across entire world catalog (Local, Steam, IGDB) with Regex handling
  useEffect(() => {
    if (!gameSearchQuery.trim()) {
      setGameSearchResults(GAMES_CATALOG.slice(0, 8));
      return;
    }

    setIsLiveSearching(true);
    const timer = setTimeout(async () => {
      try {
        const parsedRegex = parseSearchRegex(gameSearchQuery);
        const local = await apiService.getGames({
          search: gameSearchQuery,
          limit: 6,
          useRegex: parsedRegex.isRegex
        });
        const localResults = local.games || [];
        const ext = await apiService.searchExternal(parsedRegex.cleanQuery || gameSearchQuery);
        let externalResults = ext.results || [];

        if (parsedRegex.isRegex && parsedRegex.isValid && parsedRegex.regex) {
          externalResults = externalResults.filter((e) => parsedRegex.regex.test(e.title));
        }

        const seenIds = new Set(localResults.map(g => g.id));
        const combined = [...localResults];
        for (const e of externalResults) {
          if (!seenIds.has(e.externalId) && !seenIds.has(e.id)) {
            combined.push({
              ...e,
              id: e.externalId || e.id,
              isExternal: true
            });
          }
        }
        setGameSearchResults(combined.slice(0, 10));
      } catch (err) {
        console.warn('[PerformanceLab] Error searching games:', err);
      } finally {
        setIsLiveSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [gameSearchQuery]);

  const handleSelectTargetGame = async (game) => {
    let fullGame = game;
    if (game.isExternal && (game.steamAppId || game.igdbId)) {
      try {
        const imported = await apiService.importGame({
          steamAppId: game.steamAppId,
          igdbId: game.igdbId,
          externalId: game.id || game.externalId
        });
        if (imported?.game) {
          fullGame = imported.game;
        }
      } catch {
        // Fallback to game object
      }
    } else if (game.id) {
      try {
        fullGame = await apiService.getGameById(game.id);
      } catch {
        addToast('Could not load the publisher game record.', 'error');
        return;
      }
    }
    setSelectedGame(fullGame);
    setSelectedGameId(fullGame.id);
    setIsSearchingGame(false);
    addToast(`Target Game set to "${fullGame.title}"`, 'success');
  };

  const handleRunAnalysis = (e) => {
    e?.preventDefault();
    setIsAnalyzing(true);

    setTimeout(() => {
      try {
        const result = performanceEstimator.analyzePerformance({
          cpuId: selectedCpuId,
          gpuId: selectedGpuId,
          ramCapacityGb: Number(ramCapacity),
          gameId: selectedGame?.id || selectedGameId,
          game: selectedGame,
          resolution,
          graphicsPreset,
          upscaling
        });

        setAnalysisResult(result);

        if (result.success) {
          recordAnalysis({
            gameId: selectedGame?.id || selectedGameId,
            gameTitle: selectedGame?.title || 'Game',
            resolution,
            preset: graphicsPreset,
            avgFps: result.fpsRange.avg,
            category: result.category.label,
            mode: result.mode
          });
          addToast('Performance analysis generated successfully.', 'success');
        } else {
          addToast(result.error || 'Insufficient data to compute estimate.', 'error');
        }
      } catch (err) {
        console.error('[PerformanceLab] Simulation execution error:', err);
        addToast(`Simulation error: ${err.message}`, 'error');
      } finally {
        setIsAnalyzing(false);
      }
    }, 250);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header Banner */}
      <div className="rm-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
          <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'var(--accent-subtle)', color: 'var(--accent-primary)' }}>
            <FlaskConical size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Gaming Performance Lab</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Simulate framerates, check resolution suitability, and uncover hardware limitations across any PC game in the world.
            </p>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'flex-start' }}>
        {/* Input Parameters Form */}
        <div className="rm-card" style={{ position: 'relative', zIndex: 60, overflow: 'visible' }}>
          <form onSubmit={handleRunAnalysis}>
            <div className="rm-card-header">
              <div className="rm-card-title">
                <Sliders size={18} style={{ color: 'var(--accent-primary)' }} />
                <span>Simulation Parameters</span>
              </div>
              <button
                type="button"
                className="rm-btn rm-btn-secondary rm-btn-sm"
                onClick={() => {
                  if (activeProfile) {
                    setSelectedCpuId(activeProfile.cpuId || '');
                    setSelectedGpuId(activeProfile.gpuId || '');
                    setRamCapacity(activeProfile.ramCapacityGb || 16);
                    addToast('Loaded Active PC Profile parameters', 'info');
                  }
                }}
              >
                <RefreshCw size={12} />
                <span>Sync with Active Rig</span>
              </button>
            </div>

            {/* Target Game Selector with Global Search */}
            <div className="rm-form-group" style={{ position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                <label className="rm-form-label" style={{ marginBottom: 0 }}>Target Game</label>
                <button
                  type="button"
                  className="rm-btn rm-btn-secondary rm-btn-sm"
                  style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', gap: '0.35rem' }}
                  onClick={() => setIsSearchingGame(!isSearchingGame)}
                >
                  <Search size={13} />
                  <span>{isSearchingGame ? 'Close Search' : 'Search Steam / IGDB Catalog'}</span>
                </button>
              </div>

              {/* Selected Game Display Card */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  padding: '0.75rem 1rem',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-main)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '0.6rem'
                }}
              >
                {selectedGame?.coverImage ? (
                  <img
                    src={selectedGame.coverImage}
                    alt={selectedGame.title}
                    style={{ width: '56px', height: '34px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }}
                  />
                ) : (
                  <div style={{ width: '56px', height: '34px', background: 'var(--bg-elevated)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Gamepad2 size={16} style={{ color: 'var(--text-muted)' }} />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {selectedGame?.title || 'Selected Target Game'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <span className="rm-badge" style={{ padding: '0.1rem 0.45rem', fontSize: '0.68rem', background: 'var(--bg-card)' }}>
                      {selectedGame?.genre || selectedGame?.genres?.[0] || 'Game'}
                    </span>
                    <span>•</span>
                    <span>Rec RAM: {selectedGame?.recommended?.ram || (selectedGame?.recommended?.ramGb ? `${selectedGame.recommended.ramGb} GB` : 'Not published')}</span>
                    {selectedGame?.minimum?.gpu && <span>• Min GPU: {selectedGame.minimum.gpu}</span>}
                  </div>
                </div>
              </div>

              {/* Live Game Search Panel */}
              {isSearchingGame && (
                <div
                  style={{
                    marginBottom: '0.75rem',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-main)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem',
                    boxShadow: 'var(--shadow-md)'
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.6rem' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <input
                        type="text"
                        className="rm-input"
                        placeholder="Search connected catalogs (e.g. Witcher, GTA V, Valorant, Elden Ring, Minecraft)..."
                        value={gameSearchQuery}
                        onChange={(e) => setGameSearchQuery(e.target.value)}
                        style={{ paddingLeft: '2.2rem', fontSize: '0.88rem' }}
                        autoFocus
                      />
                      <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      {isLiveSearching && (
                        <Loader2 size={16} className="spin-animation" style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-primary)' }} />
                      )}
                    </div>
                  </div>

                  {/* Suggestions List */}
                  {gameSearchResults.length > 0 && (
                    <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      {gameSearchResults.map((game) => (
                        <div
                          key={game.externalId || game.id}
                          onClick={() => handleSelectTargetGame(game)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.5rem 0.65rem',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                            background: selectedGame?.id === game.id ? 'var(--bg-card-hover)' : 'transparent',
                            transition: 'background var(--transition-fast)'
                          }}
                          className="game-picker-item"
                        >
                          {game.coverImage ? (
                            <img src={game.coverImage} alt={game.title} style={{ width: '40px', height: '24px', objectFit: 'cover', borderRadius: '3px' }} />
                          ) : (
                            <div style={{ width: '40px', height: '24px', background: 'var(--bg-input)', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Globe size={12} style={{ color: 'var(--text-muted)' }} />
                            </div>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {game.title}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              {game.source || 'PC Database'} {game.genre ? `• ${game.genre}` : ''}
                            </div>
                          </div>
                          <span className="rm-btn rm-btn-secondary rm-btn-sm" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}>
                            Select
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quick preset titles */}
                  <div style={{ marginTop: '0.6rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Popular Simulation Benchmarks:</div>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      {['Cyberpunk 2077', 'Valorant', 'Grand Theft Auto V', 'Elden Ring', 'Minecraft', 'Black Myth: Wukong', 'Counter-Strike 2', 'Fortnite'].map((title) => (
                        <button
                          key={title}
                          type="button"
                          className="rm-badge"
                          style={{ cursor: 'pointer', background: 'var(--bg-input)', color: 'var(--text-secondary)', border: '1px solid var(--border-main)', fontSize: '0.72rem' }}
                          onClick={() => {
                            setGameSearchQuery(title);
                          }}
                        >
                          {title}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Hardware Selectors */}
            <div className="grid-2">
              <div className="rm-form-group">
                <label className="rm-form-label" htmlFor="cpu-select">Processor (CPU)</label>
                <select
                  id="cpu-select"
                  className="rm-select"
                  value={selectedCpuId}
                  onChange={(e) => setSelectedCpuId(e.target.value)}
                  required
                >
                  <option value="">Select CPU...</option>
                  {CPU_DATABASE.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.cores})
                    </option>
                  ))}
                </select>
              </div>

              <div className="rm-form-group">
                <label className="rm-form-label" htmlFor="gpu-select">Graphics Card (GPU)</label>
                <select
                  id="gpu-select"
                  className="rm-select"
                  value={selectedGpuId}
                  onChange={(e) => setSelectedGpuId(e.target.value)}
                  required
                >
                  <option value="">Select GPU...</option>
                  {GPU_DATABASE.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* RAM Capacity */}
            <div className="rm-form-group">
              <label className="rm-form-label" htmlFor="ram-select">Installed System Memory (RAM)</label>
              <select
                id="ram-select"
                className="rm-select"
                value={ramCapacity}
                onChange={(e) => setRamCapacity(Number(e.target.value))}
              >
                <option value={8}>8 GB (Budget / Minimum for AAA)</option>
                <option value={16}>16 GB (Recommended Gaming Baseline)</option>
                <option value={32}>32 GB (High-End & Multitasking)</option>
                <option value={64}>64 GB (Extreme / Flight Sim)</option>
              </select>
            </div>

            {/* Resolution and Preset */}
            <div className="grid-2">
              <div className="rm-form-group">
                <label className="rm-form-label" htmlFor="res-select">Target Display Resolution</label>
                <select
                  id="res-select"
                  className="rm-select"
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                >
                  {RESOLUTION_PRESETS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="rm-form-group">
                <label className="rm-form-label" htmlFor="preset-select">Graphics Quality Preset</label>
                <select
                  id="preset-select"
                  className="rm-select"
                  value={graphicsPreset}
                  onChange={(e) => setGraphicsPreset(e.target.value)}
                >
                  {GRAPHICS_PRESETS.map((g) => (
                    <option key={g.id} value={g.name}>
                      {g.name} Preset
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Upscaling Option */}
            <div className="rm-form-group">
              <label className="rm-form-label" htmlFor="upscale-select">Upscaling / Resolution Scaling</label>
              <select
                id="upscale-select"
                className="rm-select"
                value={upscaling}
                onChange={(e) => setUpscaling(e.target.value)}
              >
                <option value="none">None (Native Resolution)</option>
                <option value="quality">Quality Mode (DLSS / FSR / XeSS Quality)</option>
                <option value="balanced">Balanced Mode</option>
                <option value="performance">Performance Mode (Sub-1080p Internal Render)</option>
                <option value="frame-gen">DLSS 3 / FSR 3 Frame Generation</option>
              </select>
            </div>

            <button
              type="submit"
              className="rm-btn rm-btn-primary"
              style={{ width: '100%', marginTop: '0.5rem', padding: '0.85rem' }}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw size={16} className="spin-animation" />
                  <span>Computing Workload Model...</span>
                </>
              ) : (
                <>
                  <Gauge size={18} />
                  <span>Analyze Gaming Performance</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results Area */}
        <div>
          {!analysisResult && (
            <div
              className="rm-card"
              style={{
                textAlign: 'center',
                padding: '3rem 2rem',
                borderStyle: 'dashed'
              }}
            >
              <FlaskConical size={40} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                Awaiting Simulation Run
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', maxWidth: '420px', margin: '0 auto' }}>
                Select your hardware specs, game, and display resolution on the left, then click
                <strong> "Analyze Gaming Performance"</strong> to evaluate potential framerates and constraints.
              </p>
            </div>
          )}

          {analysisResult && !analysisResult.success && (
            <div className="rm-card" style={{ borderLeft: '4px solid var(--color-danger)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--color-danger)', marginBottom: '0.75rem' }}>
                <AlertTriangle size={20} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                  {analysisResult.title || 'Analysis Error'}
                </h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                {analysisResult.error}
              </p>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                No substitute FPS value is shown. The requested configuration is {CPU_DATABASE.find((cpu) => cpu.id === selectedCpuId)?.name || 'unrecognized CPU'} + {GPU_DATABASE.find((gpu) => gpu.id === selectedGpuId)?.name || 'unrecognized GPU'}, {ramCapacity} GB RAM, {resolution}, {graphicsPreset}, {upscaling} upscaling.
              </div>
              {analysisResult.gameSpecs && (
                <div style={{ marginTop: '1rem', padding: '0.85rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-input)' }}>
                  <strong>Publisher requirements ({analysisResult.gameSpecs.verification}):</strong>
                  <div style={{ marginTop: '0.4rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    Minimum: CPU {analysisResult.gameSpecs.minimum?.cpu || 'Not published'} · GPU {analysisResult.gameSpecs.minimum?.gpu || 'Not published'} · RAM {analysisResult.gameSpecs.minimum?.ram || (analysisResult.gameSpecs.minimum?.ramGb ? `${analysisResult.gameSpecs.minimum.ramGb} GB` : 'Not published')}
                  </div>
                  <div style={{ marginTop: '0.3rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    Recommended: CPU {analysisResult.gameSpecs.recommended?.cpu || 'Not published'} · GPU {analysisResult.gameSpecs.recommended?.gpu || 'Not published'} · RAM {analysisResult.gameSpecs.recommended?.ram || (analysisResult.gameSpecs.recommended?.ramGb ? `${analysisResult.gameSpecs.recommended.ramGb} GB` : 'Not published')}
                  </div>
                  <div style={{ marginTop: '0.35rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Source: {analysisResult.gameSpecs.source || 'Not verified'}
                    {analysisResult.gameSpecs.sourceUrl && <> · <a href={analysisResult.gameSpecs.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-hover)' }}>Open source</a></>}
                  </div>
                </div>
              )}
              {analysisResult.referenceBenchmarks?.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <strong>Verified runs for this game (reference only; not your configuration):</strong>
                  {analysisResult.referenceBenchmarks.map((benchmark) => (
                    <div key={benchmark.id} style={{ marginTop: '0.45rem', padding: '0.65rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', fontSize: '0.8rem' }}>
                      {benchmark.cpuName} + {benchmark.gpuName} · {benchmark.resolution} · {benchmark.graphicsPreset} · {benchmark.upscaling}: {benchmark.avgFps} average FPS · {benchmark.provenance}
                      {benchmark.sourceUrl && <> · <a href={benchmark.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-hover)' }}>Source</a></>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {analysisResult && analysisResult.success && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Primary Scorecard */}
              <div
                className="rm-card"
                style={{
                  borderLeft: `4px solid ${analysisResult.category.color}`,
                  background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.98) 0%, rgba(15, 15, 15, 0.98) 100%)'
                }}
              >
                <div className="rm-card-header">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span
                        className="rm-badge"
                        style={{
                          background: `${analysisResult.category.color}20`,
                          color: analysisResult.category.color,
                          border: `1px solid ${analysisResult.category.color}40`
                        }}
                      >
                        {analysisResult.category.label}
                      </span>
                      {analysisResult.isEmpirical ? (
                        <span className="rm-badge rm-badge-verified">Verified Empirical Run</span>
                      ) : (
                        <span className="rm-badge rm-badge-model">Architectural Estimate</span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                      {selectedGame?.title} @ {resolution} ({graphicsPreset} Preset)
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Data Coverage</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-main)' }}>
                      {analysisResult.dataCoverage}
                    </div>
                  </div>
                </div>

                {/* Framerate Display */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', margin: '1rem 0' }}>
                  <div style={{ fontSize: '3rem', fontWeight: 800, fontFamily: 'var(--font-mono)', letterSpacing: '-0.03em', color: '#FFFFFF' }}>
                    {analysisResult.fpsRange.avg}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>AVERAGE FPS</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {analysisResult.fpsRange.min != null && analysisResult.fpsRange.max != null
                        ? `Measured range: ${analysisResult.fpsRange.min} – ${analysisResult.fpsRange.max} FPS`
                        : 'Measured average; source did not report a run-to-run range'}
                    </span>
                  </div>
                </div>

                {/* 1% Low Frametime Stability */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Zap size={16} style={{ color: 'var(--color-warning)' }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Estimated 1% Low Frametime</span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-warning)' }}>
                    {analysisResult.fpsRange.onePercentLow == null ? 'Not recorded' : `${analysisResult.fpsRange.onePercentLow} FPS`}
                  </span>
                </div>

                {/* Limitations and Recommendations */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <div>
                    <strong style={{ color: 'var(--text-main)' }}>Resolution Suitability:</strong>{' '}
                    <span style={{ color: 'var(--text-secondary)' }}>{analysisResult.resolutionSuitability}</span>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--text-main)' }}>Recommended Preset:</strong>{' '}
                    <span style={{ color: 'var(--text-secondary)' }}>{analysisResult.recommendedPreset}</span>
                  </div>
                  {analysisResult.primaryBottleneck && (
                    <div>
                      <strong style={{ color: 'var(--text-main)' }}>Primary Bottleneck:</strong>{' '}
                      <span style={{ color: 'var(--accent-hover)' }}>{analysisResult.primaryBottleneck}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Target Game Real Technical Specifications */}
              {analysisResult.gameSpecs && (analysisResult.gameSpecs.minimum || analysisResult.gameSpecs.recommended) && (
                <div className="rm-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div className="rm-card-title" style={{ margin: 0 }}>
                      <Layers size={18} style={{ color: 'var(--accent-hover)' }} />
                      <span>Verified Game Specifications</span>
                    </div>
                    <span className={`rm-badge ${analysisResult.gameSpecs.verification === 'Official' ? 'rm-badge-verified' : 'rm-badge-demonstration'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <ShieldCheck size={12} />
                      <span>{analysisResult.gameSpecs.verification || 'Unverified'}</span>
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    Requirements source: {analysisResult.gameSpecs.source || 'Not verified'}
                    {analysisResult.gameSpecs.sourceUrl && (
                      <> · <a href={analysisResult.gameSpecs.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-hover)' }}>Open source</a></>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                    {/* Minimum Specs */}
                    {analysisResult.gameSpecs.minimum && (
                      <div style={{ padding: '0.85rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-main)' }}>
                        <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.6rem' }}>
                          MINIMUM REQUIREMENTS
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.82rem' }}>
                          <div><strong style={{ color: 'var(--text-main)' }}>CPU:</strong> <span style={{ color: 'var(--text-secondary)' }}>{analysisResult.gameSpecs.minimum.cpu || 'Not published'}</span></div>
                          <div><strong style={{ color: 'var(--text-main)' }}>GPU:</strong> <span style={{ color: 'var(--text-secondary)' }}>{analysisResult.gameSpecs.minimum.gpu || 'Not published'}</span></div>
                          <div><strong style={{ color: 'var(--text-main)' }}>RAM:</strong> <span style={{ color: 'var(--text-secondary)' }}>{analysisResult.gameSpecs.minimum.ram || (analysisResult.gameSpecs.minimum.ramGb ? `${analysisResult.gameSpecs.minimum.ramGb} GB` : 'Not published')}</span></div>
                          <div><strong style={{ color: 'var(--text-main)' }}>Storage:</strong> <span style={{ color: 'var(--text-secondary)' }}>{analysisResult.gameSpecs.minimum.storage || (analysisResult.gameSpecs.minimum.storageGb ? `${analysisResult.gameSpecs.minimum.storageGb} GB` : 'Not published')}</span></div>
                          {analysisResult.gameSpecs.minimum.target && (
                            <div style={{ marginTop: '0.3rem', color: 'var(--color-warning)', fontSize: '0.78rem' }}>Target: {analysisResult.gameSpecs.minimum.target}</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Recommended Specs */}
                    {analysisResult.gameSpecs.recommended && (
                      <div style={{ padding: '0.85rem', background: 'rgba(34, 197, 94, 0.04)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                        <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-success)', fontWeight: 700, marginBottom: '0.6rem' }}>
                          RECOMMENDED (60 FPS TARGET)
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.82rem' }}>
                          <div><strong style={{ color: 'var(--text-main)' }}>CPU:</strong> <span style={{ color: 'var(--text-secondary)' }}>{analysisResult.gameSpecs.recommended.cpu || 'Not published'}</span></div>
                          <div><strong style={{ color: 'var(--text-main)' }}>GPU:</strong> <span style={{ color: 'var(--text-secondary)' }}>{analysisResult.gameSpecs.recommended.gpu || 'Not published'}</span></div>
                          <div><strong style={{ color: 'var(--text-main)' }}>RAM:</strong> <span style={{ color: 'var(--text-secondary)' }}>{analysisResult.gameSpecs.recommended.ram || (analysisResult.gameSpecs.recommended.ramGb ? `${analysisResult.gameSpecs.recommended.ramGb} GB` : 'Not published')}</span></div>
                          <div><strong style={{ color: 'var(--text-main)' }}>Storage:</strong> <span style={{ color: 'var(--text-secondary)' }}>{analysisResult.gameSpecs.recommended.storage || (analysisResult.gameSpecs.recommended.storageGb ? `${analysisResult.gameSpecs.recommended.storageGb} GB` : 'Not published')}</span></div>
                          {analysisResult.gameSpecs.recommended.target && (
                            <div style={{ marginTop: '0.3rem', color: 'var(--color-success)', fontSize: '0.78rem' }}>Target: {analysisResult.gameSpecs.recommended.target}</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Real Empirical Reference Benchmarks */}
              {analysisResult.referenceBenchmarks && analysisResult.referenceBenchmarks.length > 0 && (
                <div className="rm-card">
                  <div className="rm-card-title" style={{ marginBottom: '0.75rem' }}>
                    <Award size={18} style={{ color: 'var(--accent-hover)' }} />
                    <span>Empirical Benchmarks & Reference Hardware Runs</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {analysisResult.referenceBenchmarks.map((bm, i) => (
                      <div
                        key={i}
                        style={{
                          padding: '0.75rem',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--bg-input)',
                          border: '1px solid var(--border-main)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '0.75rem'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                            {bm.gpuName} + {bm.cpuName}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                            {bm.gameTitle} · {bm.resolution} {bm.graphicsPreset} Preset · {bm.provenance}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#FFFFFF' }}>
                            {bm.avgFps} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)' }}>FPS</span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--color-warning)' }}>
                            1% Low: {bm.onePercentLowFps} FPS
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hardware Constraints Detected */}
              {analysisResult.constraints && analysisResult.constraints.length > 0 && (
                <div className="rm-card">
                  <div className="rm-card-title" style={{ marginBottom: '0.75rem' }}>
                    <AlertTriangle size={18} style={{ color: 'var(--color-warning)' }} />
                    <span>Identified Hardware Bottlenecks</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {analysisResult.constraints.map((c, i) => (
                      <div
                        key={i}
                        style={{
                          padding: '0.75rem',
                          borderRadius: 'var(--radius-md)',
                          background: c.severity === 'critical' ? 'var(--color-danger-bg)' : 'var(--color-warning-bg)',
                          border: `1px solid ${c.severity === 'critical' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(251, 191, 36, 0.25)'}`
                        }}
                      >
                        <div style={{ fontWeight: 600, fontSize: '0.88rem', color: c.severity === 'critical' ? 'var(--color-danger)' : 'var(--color-warning)' }}>
                          {c.type}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                          {c.detail}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Practical Optimization Suggestions */}
              {analysisResult.optimizations && analysisResult.optimizations.length > 0 && (
                <div className="rm-card">
                  <div className="rm-card-title" style={{ marginBottom: '0.75rem' }}>
                    <CheckCircle2 size={18} style={{ color: 'var(--color-success)' }} />
                    <span>Actionable Optimization Advice</span>
                  </div>
                  <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {analysisResult.optimizations.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Methodology & Heuristics Breakdown */}
              <div className="rm-card" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                  <HelpCircle size={14} />
                  <strong>Estimation Transparency & Heuristics</strong>
                </div>
                <p style={{ marginBottom: '0.5rem' }}>{analysisResult.methodologyNote}</p>
                {analysisResult.heuristicsUsed && (
                  <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {analysisResult.heuristicsUsed.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                )}
                {analysisResult.sourceUrl && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <a
                      href={analysisResult.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--accent-hover)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <span>Verify source test run ({analysisResult.provenance})</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
