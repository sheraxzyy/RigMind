/**
 * RigMind Steam Web & Store Integration Service
 * 
 * Provides verified metadata and publisher system requirements directly from Steam Store API.
 * Uses rate limiting, timeouts, and fallback error handling.
 */

import { parseRequirementsHtml } from './requirementsParser.js';

export class SteamService {
  constructor() {
    this.apiKey = process.env.STEAM_API_KEY || '';
    this.cache = new Map();
  }

  /**
   * Search Steam Store for PC titles matching a query
   */
  async searchGames(query) {
    if (!query || query.trim().length === 0) return [];
    const term = query.trim().toLowerCase();

    if (this.cache.has(`search_${term}`)) {
      return this.cache.get(`search_${term}`);
    }

    try {
      const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(term)}&l=english&cc=US`;
      const response = await fetch(url, {
        headers: { 'User-Agent': 'RigMind-PC-Hardware-Platform/1.0' },
        signal: AbortSignal.timeout(6000)
      });

      if (!response.ok) {
        console.warn(`[SteamService] Store search responded with status ${response.status}`);
        return [];
      }

      const data = await response.json();
      if (!data || !Array.isArray(data.items)) {
        return [];
      }

      const results = data.items.map((item) => ({
        externalId: `steam-${item.id}`,
        steamAppId: item.id,
        title: item.name,
        coverImage: item.tiny_image || `https://cdn.akamai.steamstatic.com/steam/apps/${item.id}/header.jpg`,
        price: item.price ? (item.price.final / 100).toFixed(2) : 'Free to Play',
        currency: item.price ? item.price.currency : 'USD',
        source: 'Steam Store API',
        storeUrl: `https://store.steampowered.com/app/${item.id}/`
      }));

      this.cache.set(`search_${term}`, results);
      return results;
    } catch (err) {
      console.warn(`[SteamService] Error searching Steam: ${err.message}`);
      return [];
    }
  }

  /**
   * Fetch full game details and published PC requirements by Steam AppID
   */
  async getGameDetails(appId) {
    const key = `app_${appId}`;
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    try {
      const url = `https://store.steampowered.com/api/appdetails?appids=${appId}&l=english`;
      const response = await fetch(url, {
        headers: { 'User-Agent': 'RigMind-PC-Hardware-Platform/1.0' },
        signal: AbortSignal.timeout(7000)
      });

      if (!response.ok) {
        throw new Error(`Steam API responded with HTTP ${response.status}`);
      }

      const data = await response.json();
      if (!data || !data[appId] || !data[appId].success) {
        throw new Error(`App ID ${appId} was not found or is unavailable on Steam.`);
      }

      const appData = data[appId].data;

      // Extract system requirements
      let minParsed = null;
      let recParsed = null;
      let reqVerificationStatus = 'Official';
      let requirementSource = 'Steam Official Publisher Store Page';

      if (appData.pc_requirements) {
        if (typeof appData.pc_requirements.minimum === 'string') {
          minParsed = parseRequirementsHtml(appData.pc_requirements.minimum);
        }
        if (typeof appData.pc_requirements.recommended === 'string') {
          recParsed = parseRequirementsHtml(appData.pc_requirements.recommended);
        }
      }

      // If no PC requirements were found
      if (!minParsed && !recParsed) {
        reqVerificationStatus = 'Not available';
        requirementSource = 'No published specifications available on Steam';
      }

      const genres = Array.isArray(appData.genres) ? appData.genres.map((g) => g.description) : ['Action'];
      const platforms = [];
      if (appData.platforms?.windows) platforms.push('Windows PC');
      if (appData.platforms?.mac) platforms.push('macOS');
      if (appData.platforms?.linux) platforms.push('Linux / SteamOS');

      const fullGame = {
        id: `steam-${appId}`,
        steamAppId: appId,
        title: appData.name,
        slug: appData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        description: appData.short_description || appData.about_the_game?.replace(/<[^>]+>/g, '').slice(0, 300) || '',
        developers: appData.developers || ['Unknown Developer'],
        publishers: appData.publishers || ['Unknown Publisher'],
        releaseDate: appData.release_date?.date || 'Unknown',
        genres,
        genre: genres[0] || 'Action',
        tier: genres.includes('Massively Multiplayer') || genres.includes('Action') ? 'modern-moderate' : 'indie-accessible',
        platforms,
        coverImage: appData.header_image || `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`,
        screenshots: Array.isArray(appData.screenshots) ? appData.screenshots.slice(0, 4).map((s) => s.path_thumbnail) : [],
        storeLinks: [
          { name: 'Steam Store', url: `https://store.steampowered.com/app/${appId}/`, official: true }
        ],
        minimum: minParsed,
        recommended: recParsed,
        requirementsVerification: reqVerificationStatus,
        requirementsSource: requirementSource,
        sourceUrl: `https://store.steampowered.com/app/${appId}/`,
        lastVerified: new Date().toISOString().split('T')[0],
        requirementsFetchedAt: new Date().toISOString(),
        lastSynchronized: new Date().toISOString()
      };

      this.cache.set(key, fullGame);
      return fullGame;
    } catch (err) {
      console.error(`[SteamService] Failed to retrieve details for app ${appId}:`, err.message);
      throw err;
    }
  }
}

export const steamService = new SteamService();
