/**
 * RigMind Game Database & Hardware Compatibility API Client
 * 
 * Communicates with the RigMind backend server (/api) with graceful local fallbacks
 * to ensure high availability and responsiveness under all network conditions.
 */

import { GAMES_CATALOG } from '../data/games';
import { matchSearch } from '../utils/regexHelper';

class ApiService {
  constructor() {
    this.baseUrl = '/api';
  }

  async getGames({ search = '', genre = 'All', tier = 'All', platform = 'All', page = 1, limit = 24, useRegex = false } = {}) {
    try {
      const params = new URLSearchParams({
        search,
        genre,
        tier,
        platform,
        page: String(page),
        limit: String(limit),
        useRegex: String(Boolean(useRegex))
      });

      const response = await fetch(`${this.baseUrl}/games?${params.toString()}`);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      return await response.json();
    } catch (err) {
      console.warn('[ApiService] Server request failed, using client fallback:', err.message);
      // Client fallback using GAMES_CATALOG
      let list = [...GAMES_CATALOG];
      if (search) {
        list = list.filter((g) => matchSearch(g, ['title', 'developer', 'genre'], search, useRegex));
      }
      if (genre !== 'All') {
        list = list.filter((g) => g.genre === genre || (g.genres && g.genres.includes(genre)));
      }
      if (tier !== 'All') {
        list = list.filter((g) => g.tier === tier);
      }

      const total = list.length;
      const startIndex = (page - 1) * limit;
      return {
        success: true,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
        games: list.slice(startIndex, startIndex + limit),
        isFallback: true
      };
    }
  }

  async getGameById(id) {
    try {
      const response = await fetch(`${this.baseUrl}/games/${encodeURIComponent(id)}`);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const data = await response.json();
      return data.game;
    } catch (err) {
      console.warn(`[ApiService] Failed to fetch game ${id} from server:`, err.message);
      const local = GAMES_CATALOG.find((g) => g.id === id || g.slug === id);
      if (local) {
        return {
          ...local,
          developers: [local.developer],
          publishers: [local.developer],
          releaseDate: String(local.releaseYear),
          platforms: ['Windows PC'],
          minimum: null,
          recommended: null,
          requirementsVerification: 'Not available',
          requirementsSource: 'Publisher requirements could not be loaded from the backend.'
        };
      }
      throw err;
    }
  }

  async searchExternal(query) {
    try {
      const response = await fetch(`${this.baseUrl}/search/external?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      return await response.json();
    } catch (err) {
      console.warn('[ApiService] External search failed:', err.message);
      return { success: false, results: [], error: err.message };
    }
  }

  async importGame(target) {
    try {
      const payload =
        typeof target === 'object' && target !== null
          ? target
          : String(target).startsWith('igdb-')
          ? { igdbId: String(target).replace(/^igdb-/, '') }
          : String(target).startsWith('steam-')
          ? { steamAppId: String(target).replace(/^steam-/, '') }
          : { steamAppId: target };

      const response = await fetch(`${this.baseUrl}/games/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      return await response.json();
    } catch (err) {
      console.error('[ApiService] Import failed:', err);
      throw err;
    }
  }

  async checkCompatibility(payload) {
    try {
      const response = await fetch(`${this.baseUrl}/pc/compatibility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      return await response.json();
    } catch (err) {
      console.warn('[ApiService] Compatibility endpoint failed, using client model:', err.message);
      return {
        success: true,
        verdict: 'Compatibility unavailable',
        verdictColor: '#A1A1AA',
        summary: 'The compatibility service is offline. RigMind did not substitute default requirements or claim the hardware is compatible.',
        components: {}
      };
    }
  }

  async getCatalogStatus() {
    try {
      const response = await fetch(`${this.baseUrl}/catalog/status`);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      return await response.json();
    } catch (err) {
      return {
        success: true,
        totalIndexedGames: GAMES_CATALOG.length,
        verifiedRequirementsCount: 0,
        unverifiedCount: GAMES_CATALOG.length,
        steamApiIntegrated: false,
        igdbConfigured: false,
        isFallback: true
      };
    }
  }
}

export const apiService = new ApiService();
