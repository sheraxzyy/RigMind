import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, Globe, Database, ArrowRight, X } from 'lucide-react';
import { apiService } from '../../services/apiService';
import { parseSearchRegex } from '../../utils/regexHelper';

export const GameSearchBar = ({
  initialValue = '',
  placeholder = 'Search thousands of PC games (e.g. Cyberpunk, Witcher, /halo.*/)...',
  onSearchSubmit
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState(initialValue);
  const [isRegexMode, setIsRegexMode] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeExternalCount, setActiveExternalCount] = useState(0);

  const containerRef = useRef(null);
  const debounceTimerRef = useRef(null);

  const parsedRegex = parseSearchRegex(query, isRegexMode);

  // Sync with prop if it changes externally (e.g. url param change)
  useEffect(() => {
    if (initialValue !== undefined && initialValue !== query) {
      setQuery(initialValue);
    }
  }, [initialValue]);

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setIsOpen(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const parsed = parseSearchRegex(query, isRegexMode);

        // 1. Search local database with regex flag
        const localData = await apiService.getGames({
          search: query,
          limit: 6,
          useRegex: parsed.isRegex
        });
        const localResults = localData.games || [];

        // 2. Search external API in parallel
        const externalData = await apiService.searchExternal(parsed.cleanQuery || query);
        let externalResults = externalData.results || [];

        // Apply client regex filter to external titles if regex mode is active and valid
        if (parsed.isRegex && parsed.isValid && parsed.regex) {
          externalResults = externalResults.filter((ext) => parsed.regex.test(ext.title));
        }

        setActiveExternalCount(externalResults.length);

        // Combine unique
        const seenIds = new Set(localResults.map((g) => g.id));
        const combined = [...localResults];

        for (const ext of externalResults) {
          if (!seenIds.has(ext.externalId) && !seenIds.has(ext.localId)) {
            combined.push({
              id: ext.externalId,
              externalId: ext.externalId,
              steamAppId: ext.steamAppId,
              igdbId: ext.igdbId,
              title: ext.title,
              coverImage: ext.coverImage,
              isExternal: true,
              source: ext.source
            });
          }
        }

        setSuggestions(combined.slice(0, 10));
        setIsOpen(true);
      } catch (err) {
        console.warn('[GameSearchBar] Error loading suggestions:', err);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(debounceTimerRef.current);
  }, [query, isRegexMode]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const triggerSearch = (searchVal = query) => {
    setIsOpen(false);
    if (onSearchSubmit) {
      onSearchSubmit(searchVal, isRegexMode);
    } else {
      const regParam = isRegexMode ? '&regex=true' : '';
      navigate(`/games?q=${encodeURIComponent(searchVal.trim())}${regParam}`);
    }
  };

  const handleSelectGame = async (game) => {
    setIsOpen(false);
    if (game.isExternal) {
      try {
        setIsSearching(true);
        const imported = await apiService.importGame({
          steamAppId: game.steamAppId,
          igdbId: game.igdbId,
          externalId: game.id || game.externalId
        });
        navigate(`/games/${imported.game.id}`);
      } catch {
        navigate(`/games/${game.id || (game.steamAppId ? `steam-${game.steamAppId}` : game.slug)}`);
      } finally {
        setIsSearching(false);
      }
    } else {
      navigate(`/games/${game.id || game.slug}`);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      triggerSearch(query);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        zIndex: isOpen ? 9999 : 20
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          triggerSearch(query);
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          background: 'var(--bg-input)',
          border: '1px solid var(--border-main)',
          borderRadius: 'var(--radius-lg)',
          padding: '0.4rem 0.6rem 0.4rem 0.8rem',
          boxShadow: 'var(--shadow-sm)',
          transition: 'border-color var(--transition-fast)'
        }}
        className="search-input-wrapper"
      >
        <Search size={18} style={{ color: 'var(--text-muted)', marginRight: '0.6rem', flexShrink: 0 }} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim() && setIsOpen(true)}
          placeholder={placeholder}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-main)',
            fontSize: '0.95rem'
          }}
          aria-label="Search PC games"
        />

        {isSearching && (
          <Loader2 size={16} className="spin-animation" style={{ color: 'var(--accent-primary)', marginLeft: '0.5rem', marginRight: '0.5rem' }} />
        )}

        {/* Regex Mode Toggle Button */}
        <button
          type="button"
          onClick={() => setIsRegexMode(!isRegexMode)}
          style={{
            background: isRegexMode ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.05)',
            color: isRegexMode ? '#000000' : 'var(--text-secondary)',
            border: `1px solid ${isRegexMode ? 'var(--accent-primary)' : 'var(--border-main)'}`,
            borderRadius: 'var(--radius-sm)',
            padding: '2px 7px',
            fontSize: '0.75rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            cursor: 'pointer',
            marginRight: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            transition: 'all 0.15s ease'
          }}
          title={isRegexMode ? 'Regular Expression mode ON (Click to toggle standard search)' : 'Enable Regular Expression mode (.*)'}
        >
          <span>.*</span>
          <span style={{ fontSize: '0.68rem', opacity: 0.85 }}>Regex</span>
        </button>

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              triggerSearch('');
            }}
            style={{ color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px', marginRight: '4px' }}
            title="Clear search"
          >
            <X size={15} />
          </button>
        )}

        <button
          type="submit"
          className="rm-btn rm-btn-primary rm-btn-sm"
          style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem', flexShrink: 0 }}
        >
          Search
        </button>
      </form>

      {/* Regex Syntax Feedback Tooltip */}
      {parsedRegex.isRegex && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: '0',
          marginTop: '3px',
          fontSize: '0.72rem',
          fontFamily: 'var(--font-mono)',
          padding: '2px 8px',
          borderRadius: 'var(--radius-sm)',
          zIndex: 999999,
          background: parsedRegex.isValid ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.2)',
          color: parsedRegex.isValid ? '#4ADE80' : '#F87171',
          border: `1px solid ${parsedRegex.isValid ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.35)'}`
        }}>
          {parsedRegex.isValid ? `✓ Pattern /${parsedRegex.cleanQuery}/i` : `⚠ Invalid: ${parsedRegex.error}`}
        </div>
      )}

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          className="search-suggestions-dropdown"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            maxHeight: '440px',
            overflowY: 'auto',
            background: '#131418',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(229, 57, 69, 0.4)',
            borderRadius: 'var(--radius-lg)',
            padding: '0.5rem',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95), 0 0 25px rgba(229, 57, 69, 0.2)',
            zIndex: 99999
          }}
        >
          <div style={{ padding: '0.4rem 0.75rem', fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between' }}>
            <span>Matching PC Titles</span>
            {activeExternalCount > 0 && (
              <span style={{ color: '#38BDF8' }}>Includes Live Steam & IGDB Results</span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.4rem' }}>
            {suggestions.map((game) => (
              <div
                key={game.id}
                onClick={() => handleSelectGame(game)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  padding: '0.6rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'background var(--transition-fast)'
                }}
                className="suggestion-item"
              >
                {game.coverImage ? (
                  <img
                    src={game.coverImage}
                    alt={game.title}
                    style={{ width: '48px', height: '28px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }}
                  />
                ) : (
                  <div style={{ width: '48px', height: '28px', background: 'var(--bg-elevated)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Globe size={14} style={{ color: 'var(--text-muted)' }} />
                  </div>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {game.title}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {game.isExternal ? (
                      <>
                        <Globe size={11} style={{ color: '#38BDF8' }} />
                        <span style={{ color: '#38BDF8' }}>External ({game.source})</span>
                      </>
                    ) : (
                      <>
                        <Database size={11} style={{ color: 'var(--color-success)' }} />
                        <span>Indexed & Verified</span>
                      </>
                    )}
                    {game.genre && <span>• {game.genre}</span>}
                  </div>
                </div>

                <div style={{ color: 'var(--text-muted)' }}>
                  <ArrowRight size={14} />
                </div>
              </div>
            ))}
          </div>

          <div
            onClick={() => triggerSearch(query)}
            style={{
              padding: '0.6rem',
              textAlign: 'center',
              fontSize: '0.8rem',
              color: 'var(--accent-hover)',
              cursor: 'pointer',
              borderTop: '1px solid var(--border-subtle)',
              marginTop: '0.4rem',
              fontWeight: 600
            }}
          >
            View all results for "{query}"
          </div>
        </div>
      )}

      <style>{`
        .search-input-wrapper:focus-within {
          border-color: var(--accent-primary) !important;
          box-shadow: 0 0 0 2px var(--accent-glow) !important;
        }
        .suggestion-item:hover {
          background: var(--bg-card-hover);
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin-animation {
          animation: spin 0.9s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default GameSearchBar;
