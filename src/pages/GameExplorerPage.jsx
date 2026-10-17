import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Gamepad2,
  Search,
  Heart,
  FlaskConical,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HardDrive,
  Layers,
  Info,
  Globe,
  Database,
  ArrowRight,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { apiService } from '../services/apiService';
import { GameSearchBar } from '../components/games/GameSearchBar';
import { parseSearchRegex } from '../utils/regexHelper';

export const GameExplorerPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { wishlist, toggleWishlist, activeProfile, addToast } = useApp();

  // URL query params & local filters
  const initialQuery = searchParams.get('q') || '';
  const initialRegex = searchParams.get('regex') === 'true';
  const [activeTab, setActiveTab] = useState('indexed'); // 'indexed' | 'external'
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [isRegexMode, setIsRegexMode] = useState(initialRegex);
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedTier, setSelectedTier] = useState('All');
  const [selectedPlatform, setSelectedPlatform] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

  // Synchronize state when URL query changes
  useEffect(() => {
    const q = searchParams.get('q') || '';
    const reg = searchParams.get('regex') === 'true';
    if (q !== searchQuery) {
      setSearchQuery(q);
      setCurrentPage(1);
    }
    if (reg !== isRegexMode) {
      setIsRegexMode(reg);
    }
  }, [searchParams, searchQuery, isRegexMode]);

  // Data states
  const [games, setGames] = useState([]);
  const [totalGames, setTotalGames] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // External live search states
  const [externalResults, setExternalResults] = useState([]);
  const [externalLoading, setExternalLoading] = useState(false);
  const [externalSearched, setExternalSearched] = useState(false);
  const [importingId, setImportingId] = useState(null);

  // Catalog status
  const [catalogStatus, setCatalogStatus] = useState(null);

  // Current PC hardware for quick fit indicator
  const currentRamGb = activeProfile?.ramCapacityGb || 16;

  // Load catalog status
  useEffect(() => {
    apiService.getCatalogStatus().then((status) => setCatalogStatus(status));
  }, []);

  // Fetch indexed games
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const parsedRegex = parseSearchRegex(searchQuery, isRegexMode);

    apiService
      .getGames({
        search: searchQuery,
        genre: selectedGenre,
        tier: selectedTier,
        platform: selectedPlatform,
        page: currentPage,
        limit: 12,
        useRegex: isRegexMode || parsedRegex.isRegex
      })
      .then((res) => {
        if (isMounted) {
          setGames(res.games || []);
          setTotalGames(res.total || 0);
          setTotalPages(res.totalPages || 1);
        }
      })
      .catch((err) => {
        console.warn('[GameExplorer] Error loading games:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [searchQuery, isRegexMode, selectedGenre, selectedTier, selectedPlatform, currentPage]);

  // Handle external search with Regex filtering
  const runExternalSearch = useCallback(async (term = searchQuery) => {
    if (!term || !term.trim()) return;
    setExternalLoading(true);
    setExternalSearched(true);
    try {
      const parsed = parseSearchRegex(term, isRegexMode);
      const res = await apiService.searchExternal(parsed.cleanQuery || term.trim());
      let results = res.results || [];

      if (parsed.isRegex && parsed.isValid && parsed.regex) {
        results = results.filter((g) => parsed.regex.test(g.title));
      }

      setExternalResults(results);
    } catch (err) {
      addToast(`Failed to retrieve external live games: ${err.message}`, 'error');
    } finally {
      setExternalLoading(false);
    }
  }, [searchQuery, isRegexMode, addToast]);

  // Auto-search external games whenever a search query is entered
  useEffect(() => {
    if (!searchQuery.trim()) {
      setExternalResults([]);
      setExternalSearched(false);
      return;
    }

    const timer = setTimeout(() => {
      runExternalSearch(searchQuery);
    }, 320);

    return () => clearTimeout(timer);
  }, [searchQuery, runExternalSearch]);

  const handleImportGame = async (game) => {
    const importKey = game.externalId || game.id || (game.steamAppId ? `steam-${game.steamAppId}` : `igdb-${game.igdbId}`);
    try {
      setImportingId(importKey);
      addToast(`Retrieving verified specifications for "${game.title}"...`, 'info');
      const imported = await apiService.importGame({
        steamAppId: game.steamAppId,
        igdbId: game.igdbId,
        externalId: game.externalId || game.id
      });
      addToast(`Imported "${imported.game.title}" into local database!`, 'success');
      navigate(`/games/${imported.game.id}`);
    } catch (err) {
      addToast(`Could not import game: ${err.message}`, 'error');
    } finally {
      setImportingId(null);
    }
  };

  const checkGameFit = (game) => {
    if (game.steamAppId || !['Official', 'Verified third-party'].includes(game.requirementsVerification)) {
      return { status: 'unknown', reasons: ['Open this title to retrieve current publisher requirements; no cached compatibility verdict is shown.'] };
    }
    if (!game.minimum?.ramGb && !game.minimum?.gpu) {
      return { status: 'unknown', reasons: ['Publisher requirements are not available; compatibility was not assessed.'] };
    }

    let status = 'unknown';
    const reasons = [];

    const minRam = Number(game.minimum?.ramGb) || null;
    const recRam = Number(game.recommended?.ramGb) || null;

    if (minRam && currentRamGb < minRam) {
      status = 'below_minimum';
      reasons.push(`RAM (${currentRamGb}GB) is below minimum requirement (${minRam}GB).`);
    } else if (minRam && recRam && currentRamGb < recRam) {
      status = 'meets_minimum';
      reasons.push(`RAM (${currentRamGb}GB) meets minimum, but recommended is ${recRam}GB.`);
    } else if (minRam && recRam) {
      status = 'meets_recommended';
      reasons.push(`RAM (${currentRamGb}GB) meets the published recommended capacity; CPU/GPU were not ranked.`);
    }

    if (reasons.length === 0 || !minRam) {
      status = 'unknown';
      reasons.push('Requirements are incomplete or CPU/GPU cannot be ranked safely; compatibility was not assessed.');
    }

    return { status, reasons };
  };

  const genres = ['All', 'Action RPG', 'Open-World Action RPG', 'Tactical FPS', 'Classic FPS', 'CRPG', 'Roguelike', 'Racing', 'City Builder', 'Strategy', 'Sci-Fi'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Search Hero Banner */}
      <div
        className="rm-card"
        style={{
          background: 'linear-gradient(135deg, rgba(229, 57, 69, 0.08) 0%, rgba(18, 18, 18, 0.98) 100%)',
          border: '1px solid rgba(229, 57, 69, 0.25)',
          padding: '2rem',
          position: 'relative',
          zIndex: 60,
          overflow: 'visible'
        }}
      >
        <div style={{ maxWidth: '820px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
            <span className="rm-badge rm-badge-crimson">
              <Sparkles size={13} />
              PC Game Catalog & Real Requirements
            </span>
            {catalogStatus && (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {catalogStatus.totalIndexedGames} Indexed Titles • {catalogStatus.verifiedRequirementsCount} Verified Specs
              </span>
            )}
          </div>

          <h2 style={{ fontSize: '1.9rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
            Comprehensive PC Game Database
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
            Search indexed titles and connected Steam / IGDB listings. Requirements appear only when available from
            publisher sources; otherwise they are explicitly marked unavailable.
          </p>

          <GameSearchBar
            initialValue={searchQuery}
            onSearchSubmit={(val) => {
              const trimmed = (val || '').trim();
              setSearchQuery(trimmed);
              setCurrentPage(1);
              if (trimmed) {
                setSearchParams({ q: trimmed });
              } else {
                setSearchParams({});
              }
              if (activeTab === 'external') {
                runExternalSearch(trimmed);
              }
            }}
          />
        </div>
      </div>

      {/* Tabs & Live Provider Status Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-main)', paddingBottom: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className={`rm-btn rm-btn-sm ${activeTab === 'indexed' ? 'rm-btn-primary' : 'rm-btn-secondary'}`}
            onClick={() => setActiveTab('indexed')}
          >
            <Database size={14} />
            <span>Indexed PC Catalog ({totalGames})</span>
          </button>
          <button
            className={`rm-btn rm-btn-sm ${activeTab === 'external' ? 'rm-btn-primary' : 'rm-btn-secondary'}`}
            onClick={() => {
              setActiveTab('external');
              if (!externalSearched && searchQuery) {
                runExternalSearch(searchQuery);
              }
            }}
          >
            <Globe size={14} />
            <span>Live External Discovery (Steam / IGDB)</span>
          </button>
        </div>

        {catalogStatus && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <span className="rm-badge rm-badge-verified" style={{ padding: '0.15rem 0.5rem', fontSize: '0.7rem' }}>
              Steam Store API Active
            </span>
            <span className="rm-badge" style={{ padding: '0.15rem 0.5rem', fontSize: '0.7rem', background: 'var(--bg-input)' }}>
              {catalogStatus.igdbConfigured ? 'IGDB Connected' : 'IGDB Ready (.env)'}
            </span>
          </div>
        )}
      </div>

      {/* TAB 1: LOCAL INDEXED CATALOG */}
      {activeTab === 'indexed' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Filters Bar */}
          <div className="rm-card" style={{ padding: '0.85rem 1.25rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                <select
                  className="rm-select"
                  style={{ width: 'auto', padding: '0.5rem 0.8rem', fontSize: '0.85rem' }}
                  value={selectedGenre}
                  onChange={(e) => {
                    setSelectedGenre(e.target.value);
                    setCurrentPage(1);
                  }}
                  aria-label="Filter by Genre"
                >
                  {genres.map((g) => (
                    <option key={g} value={g}>{g === 'All' ? 'All Genres' : g}</option>
                  ))}
                </select>

                <select
                  className="rm-select"
                  style={{ width: 'auto', padding: '0.5rem 0.8rem', fontSize: '0.85rem' }}
                  value={selectedTier}
                  onChange={(e) => {
                    setSelectedTier(e.target.value);
                    setCurrentPage(1);
                  }}
                  aria-label="Filter by Demand Tier"
                >
                  <option value="All">All Demand Tiers</option>
                  <option value="heavy-aaa">Heavy AAA (High GPU/CPU)</option>
                  <option value="modern-moderate">Modern Standard</option>
                  <option value="esports-competitive">Esports Competitive</option>
                  <option value="esports-light">Lightweight Esports</option>
                  <option value="indie-accessible">Indie & Roguelike</option>
                  <option value="retro-classic">Retro & Classics</option>
                </select>

                <select
                  className="rm-select"
                  style={{ width: 'auto', padding: '0.5rem 0.8rem', fontSize: '0.85rem' }}
                  value={selectedPlatform}
                  onChange={(e) => {
                    setSelectedPlatform(e.target.value);
                    setCurrentPage(1);
                  }}
                  aria-label="Filter by Platform / Store"
                >
                  <option value="All">All Platforms & Stores</option>
                  <option value="Steam">Steam Games</option>
                  <option value="Epic">Epic Games Store</option>
                  <option value="GOG">GOG Releases</option>
                  <option value="GamePass">PC Game Pass / Xbox</option>
                  <option value="FreeToPlay">Free to Play</option>
                  <option value="Multiplayer">Multiplayer & Co-op</option>
                </select>

                {/* Regex Mode Toggle */}
                <button
                  type="button"
                  onClick={() => setIsRegexMode(!isRegexMode)}
                  style={{
                    background: isRegexMode ? 'var(--accent-primary)' : 'var(--bg-input)',
                    color: isRegexMode ? '#000000' : 'var(--text-secondary)',
                    border: `1px solid ${isRegexMode ? 'var(--accent-primary)' : 'var(--border-main)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '0.45rem 0.8rem',
                    fontSize: '0.82rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.15s ease'
                  }}
                  title={isRegexMode ? 'Regular Expression filtering is ACTIVE (Click to disable)' : 'Enable Regular Expression pattern search (.*)'}
                >
                  <span>.*</span>
                  <span>Regex Mode</span>
                  {isRegexMode && (
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#000000' }} />
                  )}
                </button>
              </div>

              {(searchQuery || isRegexMode || selectedGenre !== 'All' || selectedTier !== 'All' || selectedPlatform !== 'All') && (
                <button
                  className="rm-btn rm-btn-secondary rm-btn-sm"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedGenre('All');
                    setSelectedTier('All');
                    setSelectedPlatform('All');
                    setCurrentPage(1);
                  }}
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>

          {/* Loading Indicator */}
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', gap: '0.75rem' }}>
              <Loader2 size={30} className="spin-animation" style={{ color: 'var(--accent-primary)' }} />
              <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>Loading catalog games...</div>
            </div>
          )}

          {/* Empty State or Live External Search Results */}
          {!loading && games.length === 0 && (
            <>
              {externalLoading ? (
                <div className="rm-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3.5rem 2rem', gap: '0.85rem' }}>
                  <Loader2 size={32} className="spin-animation" style={{ color: '#38BDF8' }} />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Searching Global Game Database...</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                    Searching connected Steam Store and IGDB catalogs for "{searchQuery}"
                  </p>
                </div>
              ) : externalResults.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1.25rem', background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: 'var(--radius-md)', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <Globe size={18} style={{ color: '#38BDF8' }} />
                      <div>
                        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                          Global Catalog Results for "{searchQuery}"
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                          ({externalResults.length} titles found across Steam & IGDB)
                        </span>
                      </div>
                    </div>
                    <span className="rm-badge rm-badge-model">Publisher requirements are checked when opened</span>
                  </div>

                  <div className="grid-3">
                    {externalResults.map((item) => {
                      const isItemLoading = importingId === item.externalId;
                      return (
                        <div key={item.externalId} className="rm-card rm-card-glow" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <div>
                            {item.coverImage && (
                              <div style={{ height: '110px', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '0.75rem' }}>
                                <img
                                  src={item.coverImage}
                                  alt={item.title}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              </div>
                            )}
                            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.3rem' }}>{item.title}</h4>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <Globe size={12} style={{ color: '#38BDF8' }} />
                              <span>{item.source}</span>
                              {item.price && <span>• {item.price === 'Free to Play' ? 'Free to Play' : `$${item.price}`}</span>}
                            </div>
                          </div>

                          <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                            {item.isLocallyCached ? (
                              <button
                                className="rm-btn rm-btn-secondary rm-btn-sm"
                                style={{ width: '100%' }}
                                onClick={() => navigate(`/games/${item.localId || item.externalId}`)}
                              >
                                <Database size={13} style={{ color: 'var(--color-success)' }} />
                                <span>Indexed (View Specifications)</span>
                              </button>
                            ) : (
                              <button
                                className="rm-btn rm-btn-primary rm-btn-sm"
                                style={{ width: '100%' }}
                                onClick={() => handleImportGame(item)}
                                disabled={isItemLoading}
                              >
                                {isItemLoading ? (
                                  <Loader2 size={13} className="spin-animation" />
                                ) : (
                                  <ArrowRight size={13} />
                                )}
                                <span>{isItemLoading ? 'Loading Specifications...' : 'View Requirements & Fit'}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="rm-card" style={{ textAlign: 'center', padding: '3.5rem 2rem', borderStyle: 'dashed' }}>
                  <Gamepad2 size={40} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.4rem' }}>No Matches Found</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', maxWidth: '440px', margin: '0 auto 1.5rem auto' }}>
                    We couldn't find any games matching "{searchQuery}". Try a different spelling or check your filter criteria.
                  </p>
                  <button
                    className="rm-btn rm-btn-secondary"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedGenre('All');
                      setSelectedTier('All');
                      setSelectedPlatform('All');
                    }}
                  >
                    Reset Search & Filters
                  </button>
                </div>
              )}
            </>
          )}

          {/* Games Grid */}
          {!loading && games.length > 0 && (
            <div className="grid-3">
              {games.map((game) => {
                const isWishlisted = wishlist.includes(game.id);
                const fit = checkGameFit(game);
                const canShowRequirements = !game.steamAppId && ['Official', 'Verified third-party'].includes(game.requirementsVerification);

                return (
                  <div
                    key={game.id}
                    className="rm-card rm-card-glow"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      cursor: 'pointer'
                    }}
                    onClick={() => navigate(`/games/${game.id}`)}
                  >
                    <div>
                      {/* Cover Visual Header */}
                      <div
                        style={{
                          height: '110px',
                          borderRadius: 'var(--radius-md)',
                          marginBottom: '1rem',
                          position: 'relative',
                          overflow: 'hidden',
                          background: 'var(--bg-input)'
                        }}
                      >
                        {game.coverImage ? (
                          <img
                            src={game.coverImage}
                            alt={game.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Gamepad2 size={32} style={{ color: 'var(--text-muted)' }} />
                          </div>
                        )}

                        <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
                          <button
                            className="sidebar-toggle-btn"
                            style={{
                              background: 'rgba(0, 0, 0, 0.75)',
                              color: isWishlisted ? 'var(--accent-primary)' : 'var(--text-secondary)',
                              borderColor: 'rgba(255, 255, 255, 0.2)'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleWishlist(game.id);
                            }}
                            title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                          >
                            <Heart size={14} fill={isWishlisted ? 'var(--accent-primary)' : 'none'} />
                          </button>
                        </div>

                        {game.releaseDate && (
                          <div style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(0,0,0,0.8)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', color: '#FFF' }}>
                            {game.releaseDate}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, lineHeight: '1.3' }}>{game.title}</h3>
                      </div>

                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                        {game.developers ? game.developers.join(', ') : game.developer} • {game.genre || game.genres?.[0]}
                      </div>

                      {/* Active Rig Quick Compatibility Assessment Badge */}
                      <div
                        style={{
                          padding: '0.55rem 0.75rem',
                          borderRadius: 'var(--radius-md)',
                          background:
                            fit.status === 'meets_recommended'
                              ? 'var(--color-success-bg)'
                              : fit.status === 'meets_minimum'
                              || fit.status === 'unknown'
                              ? 'var(--color-warning-bg)'
                              : 'var(--color-danger-bg)',
                          border: `1px solid ${
                            fit.status === 'meets_recommended'
                              ? 'rgba(74, 222, 128, 0.25)'
                              : fit.status === 'meets_minimum'
                              ? 'rgba(251, 191, 36, 0.25)'
                              : fit.status === 'unknown'
                              ? 'rgba(161, 161, 170, 0.25)'
                              : 'rgba(239, 68, 68, 0.25)'
                          }`,
                          marginBottom: '0.85rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.78rem' }}>
                          {fit.status === 'meets_recommended' ? (
                            <>
                              <CheckCircle2 size={13} style={{ color: 'var(--color-success)' }} />
                              <span style={{ color: 'var(--color-success)' }}>Recommended Fit</span>
                            </>
                          ) : fit.status === 'meets_minimum' ? (
                            <>
                              <AlertTriangle size={13} style={{ color: 'var(--color-warning)' }} />
                              <span style={{ color: 'var(--color-warning)' }}>Minimum Fit</span>
                            </>
                          ) : fit.status === 'unknown' ? (
                            <>
                              <Info size={13} style={{ color: 'var(--text-muted)' }} />
                              <span style={{ color: 'var(--text-muted)' }}>Not Assessed</span>
                            </>
                          ) : (
                            <>
                              <XCircle size={13} style={{ color: 'var(--color-danger)' }} />
                              <span style={{ color: 'var(--color-danger)' }}>Hardware Bottleneck</span>
                            </>
                          )}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                          {fit.reasons[0]}
                        </div>
                      </div>

                      {/* Hardware Requirements Snapshot */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <HardDrive size={12} />
                          <span>{canShowRequirements ? `Storage: ${game.minimum?.storage || (game.minimum?.storageGb ? `${game.minimum.storageGb} GB` : 'Not published')}${game.minimum?.storageType ? ` (${game.minimum.storageType})` : ''}` : 'Open title to retrieve publisher requirements'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Layers size={12} />
                          {canShowRequirements && <span>RAM: {game.minimum?.ram || (game.minimum?.ramGb ? `${game.minimum.ramGb} GB` : 'Not published')} Min / {game.recommended?.ram || (game.recommended?.ramGb ? `${game.recommended.ramGb} GB` : 'Not published')} Rec</span>}
                        </div>
                      </div>
                    </div>

                    {/* Action Links */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                      <button
                        className="rm-btn rm-btn-secondary rm-btn-sm"
                        style={{ flex: 1 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/games/${game.id}`);
                        }}
                      >
                        <Info size={13} />
                        <span>View Specs</span>
                      </button>
                      <button
                        className="rm-btn rm-btn-primary rm-btn-sm"
                        style={{ flex: 1 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/lab?game=${game.id}`);
                        }}
                      >
                        <FlaskConical size={13} />
                        <span>Simulate</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
              <button
                className="rm-btn rm-btn-secondary rm-btn-sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={15} />
                <span>Previous</span>
              </button>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                Page {currentPage} of {totalPages} ({totalGames} titles)
              </span>
              <button
                className="rm-btn rm-btn-secondary rm-btn-sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                <span>Next</span>
                <ChevronRight size={15} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LIVE EXTERNAL DISCOVERY (STEAM & IGDB) */}
      {activeTab === 'external' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="rm-card">
            <div className="rm-card-header">
              <div>
                <div className="rm-card-title">
                  <Globe size={18} style={{ color: '#38BDF8' }} />
                  <span>Live External PC Game Catalog Discovery</span>
                </div>
                <div className="rm-card-subtitle">
                  Search across millions of global PC releases on Steam Store API and import verified publisher specifications with 1-click.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <input
                type="text"
                className="rm-input"
                placeholder="Search Steam Store for any game (e.g. Doom, Monster Hunter, Elden Ring, Fallout)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runExternalSearch()}
              />
              <button
                className="rm-btn rm-btn-primary"
                onClick={() => runExternalSearch()}
                disabled={externalLoading}
              >
                {externalLoading ? <Loader2 size={16} className="spin-animation" /> : <Search size={16} />}
                <span>Live Search</span>
              </button>
            </div>
          </div>

          {externalLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', gap: '0.75rem' }}>
              <Loader2 size={32} className="spin-animation" style={{ color: '#38BDF8' }} />
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Querying Steam Store & external PC databases...</div>
            </div>
          )}

          {!externalLoading && externalResults.length > 0 && (
            <div className="grid-3">
              {externalResults.map((item) => (
                <div key={item.externalId} className="rm-card rm-card-glow" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    {item.coverImage && (
                      <div style={{ height: '110px', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '0.75rem' }}>
                        <img
                          src={item.coverImage}
                          alt={item.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    )}
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.3rem' }}>{item.title}</h4>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Globe size={12} style={{ color: '#38BDF8' }} />
                      <span>{item.source}</span>
                      {item.price && <span>• {item.price === 'Free to Play' ? 'Free to Play' : `$${item.price}`}</span>}
                    </div>
                  </div>

                  <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                    {item.isLocallyCached ? (
                      <button
                        className="rm-btn rm-btn-secondary rm-btn-sm"
                        style={{ width: '100%' }}
                        onClick={() => navigate(`/games/${item.localId || item.externalId}`)}
                      >
                        <Database size={13} style={{ color: 'var(--color-success)' }} />
                        <span>Already Indexed (View Specs)</span>
                      </button>
                    ) : (
                      <button
                        className="rm-btn rm-btn-primary rm-btn-sm"
                        style={{ width: '100%' }}
                        onClick={() => handleImportGame(item)}
                        disabled={importingId === item.externalId}
                      >
                        {importingId === item.externalId ? (
                          <Loader2 size={13} className="spin-animation" />
                        ) : (
                          <ArrowRight size={13} />
                        )}
                        <span>{importingId === item.externalId ? 'Loading Specs...' : 'View Requirements & Fit'}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!externalLoading && externalSearched && externalResults.length === 0 && (
            <div className="rm-card" style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: 'var(--text-secondary)' }}>No external PC titles found matching "{searchQuery}".</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
