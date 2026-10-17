import { Router } from 'express';
import { gameStore } from '../database/gameStore.js';
import { steamService } from '../services/steamService.js';
import { igdbService } from '../services/igdbService.js';

const router = Router();

// GET /api/games - Search & filter local game database
router.get('/games', (req, res) => {
  try {
    const { search = '', q = '', genre = 'All', tier = 'All', platform = 'All', page = 1, limit = 20 } = req.query;
    const searchTerm = search || q;

    const result = gameStore.search({
      query: searchTerm,
      genre,
      tier,
      platform,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20,
      useRegex: req.query.useRegex === 'true' || req.query.regex === 'true'
    });

    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    console.error('[API /games] Error:', err);
    res.status(500).json({ success: false, error: 'Internal server error searching game catalog.' });
  }
});

// GET /api/search/external - Live search across external providers (Steam Store API & IGDB)
router.get('/search/external', async (req, res) => {
  try {
    const { q = '', query = '' } = req.query;
    const term = (q || query).trim();

    if (!term) {
      return res.json({ success: true, results: [] });
    }

    // 1. Search Steam Store API
    const steamResults = await steamService.searchGames(term);

    // 2. Search IGDB if configured
    let igdbResults = [];
    if (igdbService.isConfigured()) {
      const igdbData = await igdbService.searchGames(term);
      if (Array.isArray(igdbData.results)) {
        igdbResults = igdbData.results;
      }
    }

    // Combine results and avoid duplicate titles
    const seenTitles = new Set();
    const combined = [];

    // Tag whether each is already in local database
    const localGames = gameStore.getAll();

    for (const item of [...steamResults, ...igdbResults]) {
      const cleanTitle = item.title.toLowerCase().trim();
      if (!seenTitles.has(cleanTitle)) {
        seenTitles.add(cleanTitle);

        const existingLocal = localGames.find(
          (lg) =>
            lg.title.toLowerCase().trim() === cleanTitle ||
            (item.steamAppId && lg.steamAppId === item.steamAppId)
        );

        combined.push({
          ...item,
          isLocallyCached: Boolean(existingLocal),
          localId: existingLocal ? existingLocal.id : null
        });
      }
    }

    res.json({
      success: true,
      query: term,
      total: combined.length,
      results: combined,
      sourcesChecked: {
        steamStoreApi: true,
        igdbConfigured: igdbService.isConfigured()
      }
    });
  } catch (err) {
    console.error('[API /search/external] Error:', err);
    res.status(500).json({ success: false, error: 'Failed to search external game providers.' });
  }
});

// GET /api/catalog/status - Return database coverage and external connectivity
router.get('/catalog/status', (req, res) => {
  try {
    const status = gameStore.getStatus();
    res.json({
      success: true,
      ...status
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/games/import - Import game by Steam AppID or IGDB ID or external ID
router.post('/games/import', async (req, res) => {
  try {
    let { steamAppId, igdbId, externalId } = req.body;

    if (!steamAppId && !igdbId && externalId) {
      if (String(externalId).startsWith('steam-')) {
        steamAppId = String(externalId).replace(/^steam-/, '');
      } else if (String(externalId).startsWith('igdb-')) {
        igdbId = String(externalId).replace(/^igdb-/, '');
      }
    }

    if (!steamAppId && !igdbId) {
      return res.status(400).json({ success: false, error: 'steamAppId or igdbId is required for import.' });
    }

    // Check if already in local store
    let existing = null;
    if (steamAppId) {
      existing = gameStore.getBySteamAppId(steamAppId) || gameStore.getById(`steam-${steamAppId}`);
    } else if (igdbId) {
      existing = gameStore.getById(`igdb-${igdbId}`) || gameStore.getById(String(igdbId));
    }

    if (existing) {
      return res.json({
        success: true,
        imported: false,
        message: 'Game is already indexed in the local database.',
        game: existing
      });
    }

    let saved = null;
    if (steamAppId) {
      const gameDetails = await steamService.getGameDetails(steamAppId);
      saved = gameStore.upsertGame(gameDetails);
    } else if (igdbId) {
      const gameDetails = await igdbService.getGameDetails(igdbId);
      saved = gameStore.upsertGame(gameDetails);
      if (saved.steamAppId) {
        try {
          const steamDetails = await steamService.getGameDetails(saved.steamAppId);
          saved = gameStore.upsertGame({
            ...saved,
            ...steamDetails,
            id: saved.id,
            igdbId: saved.igdbId,
            developers: saved.developers,
            publishers: saved.publishers,
            storeLinks: [...(saved.storeLinks || []), ...(steamDetails.storeLinks || [])]
          });
        } catch (err) {
          console.warn(`[API /games/import] Steam requirements unavailable for IGDB ${igdbId}:`, err.message);
        }
      }
    }

    res.json({
      success: true,
      imported: true,
      message: `Successfully imported "${saved.title}" with verified specifications into RigMind.`,
      game: saved
    });
  } catch (err) {
    console.error('[API /games/import] Error:', err);
    res.status(500).json({ success: false, error: `Failed to import game: ${err.message}` });
  }
});

// GET /api/games/:id - Fetch single game details (with automatic live resolution)
router.get('/games/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let game = gameStore.getById(id) || gameStore.getBySlug(id);

    // Refresh Steam-backed records from the publisher-controlled store page.
    // This replaces old cached requirement fields (including legacy defaults).
    if (game?.steamAppId) {
      try {
        const current = await steamService.getGameDetails(game.steamAppId);
        game = gameStore.upsertGame({ ...current, id: game.id, slug: game.slug || current.slug });
      } catch (err) {
        console.warn(`[API /games/${id}] Could not refresh Steam requirements:`, err.message);
        game = {
          ...game,
          minimum: null,
          recommended: null,
          requirementsVerification: 'Not available',
          requirementsSource: 'Steam publisher requirements could not be refreshed; cached specifications are hidden.'
        };
      }
    } else if (game?.igdbId || game?.requirementsVerification === 'Calibrated Architectural Model' || game?.requirementsSource?.includes('RigMind Global Game Intelligence')) {
      game = {
        ...game,
        minimum: null,
        recommended: null,
        requirementsVerification: 'Not available',
        requirementsSource: 'No publisher system requirements are available for this record.'
      };
    }

    // If game is not in local store, try automatic live resolution
    if (!game) {
      // 1. Steam AppID pattern (e.g. steam-12345 or pure number that isn't explicitly an IGDB ID)
      const steamMatch = id.match(/^steam-(\d+)$/);
      if (steamMatch) {
        try {
          const fetched = await steamService.getGameDetails(steamMatch[1]);
          game = gameStore.upsertGame(fetched);
        } catch (e) {
          console.warn(`[API /games/${id}] Steam resolution error:`, e.message);
        }
      }

      // 2. IGDB ID pattern (e.g. igdb-12345)
      const igdbMatch = id.match(/^igdb-(\d+)$/);
      if (!game && igdbMatch && igdbService.isConfigured()) {
        try {
          const fetched = await igdbService.getGameDetails(igdbMatch[1]);
          game = gameStore.upsertGame(fetched);
        } catch (e) {
          console.warn(`[API /games/${id}] IGDB resolution error:`, e.message);
        }
      }

      // 3. Pure number - check steam first, then IGDB
      const numMatch = id.match(/^(\d+)$/);
      if (!game && numMatch) {
        try {
          const fetched = await steamService.getGameDetails(numMatch[1]);
          game = gameStore.upsertGame(fetched);
        } catch {
          if (igdbService.isConfigured()) {
            try {
              const fetched = await igdbService.getGameDetails(numMatch[1]);
              game = gameStore.upsertGame(fetched);
            } catch {
              // Ignore
            }
          }
        }
      }

      // 4. Slug or title fallback (e.g. "the-witcher-3-wild-hunt", "valorant")
      if (!game) {
        const queryTerm = id.replace(/-/g, ' ').trim();
        if (queryTerm.length >= 2) {
          try {
            // Search Steam
            const steamResults = await steamService.searchGames(queryTerm);
            if (steamResults.length > 0 && steamResults[0].steamAppId) {
              const fetched = await steamService.getGameDetails(steamResults[0].steamAppId);
              game = gameStore.upsertGame(fetched);
            }
          } catch {
            // Ignore
          }

          if (!game && igdbService.isConfigured()) {
            try {
              const igdbSearch = await igdbService.searchGames(queryTerm);
              if (igdbSearch.results && igdbSearch.results.length > 0) {
                const topResult = igdbSearch.results[0];
                const fetched = await igdbService.getGameDetails(topResult.igdbId);
                game = gameStore.upsertGame(fetched);
              }
            } catch {
              // Ignore
            }
          }
        }
      }
    }

    if (!game) {
      return res.status(404).json({ success: false, error: `Game "${id}" was not found in RigMind database.` });
    }

    res.json({
      success: true,
      game
    });
  } catch (err) {
    console.error(`[API /games/${req.params.id}] Error:`, err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/games/:id/requirements - Fetch structured system requirements
router.get('/games/:id/requirements', (req, res) => {
  try {
    const game = gameStore.getById(req.params.id) || gameStore.getBySlug(req.params.id);
    if (!game) {
      return res.status(404).json({ success: false, error: 'Game not found.' });
    }

    res.json({
      success: true,
      title: game.title,
      minimum: game.minimum,
      recommended: game.recommended,
      verificationStatus: game.requirementsVerification,
      source: game.requirementsSource,
      sourceUrl: game.sourceUrl,
      lastVerified: game.lastVerified
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/games/:id/sources - Fetch sources and store links
router.get('/games/:id/sources', (req, res) => {
  try {
    const game = gameStore.getById(req.params.id) || gameStore.getBySlug(req.params.id);
    if (!game) {
      return res.status(404).json({ success: false, error: 'Game not found.' });
    }

    res.json({
      success: true,
      title: game.title,
      storeLinks: game.storeLinks || [],
      primarySourceUrl: game.sourceUrl,
      requirementsSource: game.requirementsSource,
      lastVerified: game.lastVerified,
      lastSynchronized: game.lastSynchronized
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
