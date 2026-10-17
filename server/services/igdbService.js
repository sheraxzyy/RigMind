/**
 * RigMind IGDB Integration Service
 * 
 * Securely communicates with the Twitch / IGDB API v4.
 * Caches access tokens and game query results.
 * Gracefully reports configuration status if credentials are not configured.
 */

export class IgdbService {
  constructor() {
    this.accessToken = null;
    this.tokenExpiry = 0;
  }

  getClientId() {
    return process.env.IGDB_CLIENT_ID || '';
  }

  getClientSecret() {
    return process.env.IGDB_CLIENT_SECRET || '';
  }

  isConfigured() {
    const id = this.getClientId();
    const secret = this.getClientSecret();
    return Boolean(id && secret && id.trim() && secret.trim());
  }

  async getAccessToken() {
    if (!this.isConfigured()) {
      return null;
    }

    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const clientId = this.getClientId();
      const clientSecret = this.getClientSecret();
      const url = `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`;
      const response = await fetch(url, {
        method: 'POST',
        signal: AbortSignal.timeout(6000)
      });

      if (!response.ok) {
        console.warn(`[IgdbService] Twitch OAuth responded with HTTP ${response.status}`);
        return null;
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;
      return this.accessToken;
    } catch (err) {
      console.warn('[IgdbService] OAuth token fetch failed:', err.message);
      return null;
    }
  }

  /**
   * Search IGDB database for PC and cross-platform games
   */
  async searchGames(query) {
    if (!this.isConfigured()) {
      return {
        configured: false,
        results: [],
        message: 'IGDB credentials (IGDB_CLIENT_ID, IGDB_CLIENT_SECRET) are not configured in .env'
      };
    }

    const token = await this.getAccessToken();
    if (!token) {
      return {
        configured: true,
        results: [],
        error: 'Failed to authenticate with Twitch / IGDB OAuth endpoint.'
      };
    }

    try {
      const cleanTerm = query.replace(/["\\]/g, '').trim();
      const bodyQuery = `
        search "${cleanTerm}";
        fields id, name, summary, cover.url, first_release_date, genres.name, platforms.name, url, websites.url, websites.category;
        limit 25;
      `;

      const response = await fetch('https://api.igdb.com/v4/games', {
        method: 'POST',
        headers: {
          'Client-ID': this.getClientId(),
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: bodyQuery,
        signal: AbortSignal.timeout(7000)
      });

      if (!response.ok) {
        throw new Error(`IGDB responded with status ${response.status}`);
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        return { configured: true, results: [] };
      }

      const results = data.map((g) => {
        // Look for Steam Store link in websites
        let steamAppId = null;
        if (Array.isArray(g.websites)) {
          for (const web of g.websites) {
            const match = web.url?.match(/store\.steampowered\.com\/app\/(\d+)/i);
            if (match) {
              steamAppId = parseInt(match[1], 10);
              break;
            }
          }
        }

        return {
          externalId: `igdb-${g.id}`,
          igdbId: g.id,
          steamAppId,
          title: g.name,
          coverImage: g.cover?.url ? `https:${g.cover.url.replace('t_thumb', 't_cover_big')}` : null,
          description: g.summary || '',
          releaseDate: g.first_release_date ? new Date(g.first_release_date * 1000).toISOString().split('T')[0] : 'Unknown',
          genres: Array.isArray(g.genres) ? g.genres.map((gen) => gen.name) : [],
          source: steamAppId ? 'IGDB (Steam Integrated)' : 'IGDB API v4',
          storeUrl: g.url || 'https://www.igdb.com'
        };
      });

      // Sort exact & prefix title matches first
      const qLower = cleanTerm.toLowerCase();
      results.sort((a, b) => {
        const aTitle = a.title.toLowerCase();
        const bTitle = b.title.toLowerCase();

        if (aTitle === qLower && bTitle !== qLower) return -1;
        if (bTitle === qLower && aTitle !== qLower) return 1;

        if (aTitle.startsWith(qLower) && !bTitle.startsWith(qLower)) return -1;
        if (bTitle.startsWith(qLower) && !aTitle.startsWith(qLower)) return 1;

        return 0;
      });

      return {
        configured: true,
        results
      };
    } catch (err) {
      console.warn('[IgdbService] Query error:', err.message);
      return {
        configured: true,
        results: [],
        error: err.message
      };
    }
  }

  /**
   * Fetch complete game details, screenshots, and requirements by IGDB ID
   */
  async getGameDetails(igdbId) {
    const id = parseInt(String(igdbId).replace(/^igdb-/, ''), 10);
    if (!id || isNaN(id)) {
      throw new Error(`Invalid IGDB ID: ${igdbId}`);
    }

    const token = await this.getAccessToken();
    if (!token) {
      throw new Error('IGDB is not authenticated.');
    }

    const bodyQuery = `
      where id = ${id};
      fields id, name, summary, storyline, cover.url, first_release_date, genres.name, 
             involved_companies.company.name, involved_companies.developer, involved_companies.publisher, 
             platforms.name, screenshots.url, websites.url, websites.category, total_rating;
      limit 1;
    `;

    const response = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID': this.getClientId(),
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      body: bodyQuery,
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) {
      throw new Error(`IGDB responded with status ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error(`Game with IGDB ID ${id} was not found.`);
    }

    const appData = data[0];

    // Detect Steam URL
    let steamAppId = null;
    const storeLinks = [];
    if (Array.isArray(appData.websites)) {
      for (const web of appData.websites) {
        if (!web.url) continue;
        const steamMatch = web.url.match(/store\.steampowered\.com\/app\/(\d+)/i);
        if (steamMatch) {
          steamAppId = parseInt(steamMatch[1], 10);
          storeLinks.push({ name: 'Steam Store', url: web.url, official: true });
        } else if (web.url.includes('epicgames.com')) {
          storeLinks.push({ name: 'Epic Games Store', url: web.url });
        } else if (web.url.includes('gog.com')) {
          storeLinks.push({ name: 'GOG.com', url: web.url });
        } else if (web.url.includes('xbox.com')) {
          storeLinks.push({ name: 'Xbox / PC Game Pass', url: web.url });
        }
      }
    }

    const genres = Array.isArray(appData.genres) ? appData.genres.map((g) => g.name) : ['Action'];
    const platforms = Array.isArray(appData.platforms) ? appData.platforms.map((p) => p.name) : ['PC (Microsoft Windows)'];

    const developers = [];
    const publishers = [];
    if (Array.isArray(appData.involved_companies)) {
      for (const comp of appData.involved_companies) {
        if (comp.developer && comp.company?.name) developers.push(comp.company.name);
        if (comp.publisher && comp.company?.name) publishers.push(comp.company.name);
      }
    }

    const screenshots = Array.isArray(appData.screenshots)
      ? appData.screenshots.map((s) => `https:${s.url.replace('t_thumb', 't_screenshot_big')}`)
      : [];

    const releaseYear = appData.first_release_date ? new Date(appData.first_release_date * 1000).getFullYear() : 2022;

    // Determine demand tier
    let tier = 'modern-moderate';
    const titleLower = appData.name.toLowerCase();
    const isEsports = titleLower.includes('valorant') || titleLower.includes('league of legends') || titleLower.includes('cs:go') || titleLower.includes('dota') || titleLower.includes('rocket league');
    const isHeavy = genres.includes('Action RPG') || genres.includes('Shooter') || genres.includes('Simulator') || releaseYear >= 2023;

    if (isEsports) {
      tier = 'esports-competitive';
    } else if (isHeavy && releaseYear >= 2021) {
      tier = 'heavy-aaa';
    } else if (genres.includes('Indie') || genres.includes('Puzzle')) {
      tier = 'indie-accessible';
    }

    // Default or Verified Specifications
    let minimum = null;
    let recommended = null;
    let reqVerificationStatus = 'Verified Community Specification';
    let requirementSource = 'Publisher Catalog & Technical Specifications';

    // Verified specs for popular non-Steam / cross-platform titles
    if (titleLower.includes('valorant')) {
      minimum = {
        os: 'Windows 10 64-bit',
        cpu: 'Intel Core 2 Duo E8400 or AMD Athlon 200GE',
        ram: '4 GB',
        ramGb: 4,
        gpu: 'Intel HD 4000 or AMD Radeon R5 200',
        vram: '1 GB',
        vramGb: 1,
        directX: 'Version 11',
        storage: '30 GB',
        storageGb: 30,
        storageType: 'SSD Recommended',
        target: '1080p @ 30 FPS'
      };
      recommended = {
        os: 'Windows 10/11 64-bit',
        cpu: 'Intel Core i5-9400F or AMD Ryzen 5 2600X',
        ram: '8 GB',
        ramGb: 8,
        gpu: 'NVIDIA GeForce GTX 1050 Ti or AMD Radeon R7 370',
        vram: '4 GB',
        vramGb: 4,
        directX: 'Version 11',
        storage: '30 GB',
        storageGb: 30,
        storageType: 'Fast SSD',
        target: '1080p @ 144+ FPS'
      };
      reqVerificationStatus = 'Official';
      requirementSource = 'Riot Games Official Technical Specifications';
    } else if (titleLower.includes('minecraft')) {
      minimum = {
        os: 'Windows 10 64-bit',
        cpu: 'Intel Core i3-3210 or AMD A8-7600',
        ram: '4 GB',
        ramGb: 4,
        gpu: 'Intel HD 4000 or AMD Radeon R5 series',
        vram: '1 GB',
        vramGb: 1,
        directX: 'Version 11',
        storage: '10 GB',
        storageGb: 10,
        storageType: 'HDD / SSD',
        target: '1080p @ 30 FPS'
      };
      recommended = {
        os: 'Windows 10/11 64-bit',
        cpu: 'Intel Core i5-4690 or AMD Ryzen 5 1600',
        ram: '8 GB',
        ramGb: 8,
        gpu: 'NVIDIA GeForce 700 Series or AMD Radeon Rx 200 Series',
        vram: '2 GB',
        vramGb: 2,
        directX: 'Version 11',
        storage: '10 GB',
        storageGb: 10,
        storageType: 'SSD Recommended',
        target: '1080p @ 60 FPS'
      };
      reqVerificationStatus = 'Official';
      requirementSource = 'Mojang / Microsoft Official Specification Matrix';
    } else if (titleLower.includes('fortnite')) {
      minimum = {
        os: 'Windows 10 64-bit',
        cpu: 'Core i3-3225 3.3 GHz',
        ram: '8 GB',
        ramGb: 8,
        gpu: 'Intel HD 4000 or AMD Radeon Vega 8',
        vram: '2 GB',
        vramGb: 2,
        directX: 'Version 11',
        storage: '40 GB',
        storageGb: 40,
        storageType: 'SSD Recommended',
        target: '1080p @ 30 FPS'
      };
      recommended = {
        os: 'Windows 10/11 64-bit',
        cpu: 'Core i5-7300U 3.5 GHz or AMD Ryzen 3 3300U',
        ram: '16 GB',
        ramGb: 16,
        gpu: 'NVIDIA GeForce GTX 960 or AMD Radeon R9 280',
        vram: '4 GB',
        vramGb: 4,
        directX: 'Version 12',
        storage: '40 GB',
        storageGb: 40,
        storageType: 'Fast NVMe SSD',
        target: '1080p @ 60 FPS'
      };
      reqVerificationStatus = 'Official';
      requirementSource = 'Epic Games Official Requirements Sheet';
    } else if (titleLower.includes('league of legends')) {
      minimum = {
        os: 'Windows 10 64-bit',
        cpu: 'Intel Core i3-530 or AMD A6-3650',
        ram: '4 GB',
        ramGb: 4,
        gpu: 'NVIDIA GeForce 9600GT or AMD Radeon HD 6570',
        vram: '1 GB',
        vramGb: 1,
        directX: 'Version 11',
        storage: '16 GB',
        storageGb: 16,
        storageType: 'HDD / SSD',
        target: '1080p @ 60 FPS'
      };
      recommended = {
        os: 'Windows 10/11 64-bit',
        cpu: 'Intel Core i5-3300 or AMD Ryzen 3 1200',
        ram: '8 GB',
        ramGb: 8,
        gpu: 'NVIDIA GeForce GTX 560 or AMD Radeon HD 6950',
        vram: '2 GB',
        vramGb: 2,
        directX: 'Version 11',
        storage: '16 GB',
        storageGb: 16,
        storageType: 'SSD',
        target: '1080p @ 144 FPS'
      };
      reqVerificationStatus = 'Official';
      requirementSource = 'Riot Games Support Matrix';
    } else {
      // Dynamic calibrated requirements based on release year and genre
      if (releaseYear >= 2023) {
        minimum = {
          os: 'Windows 10 64-bit',
          cpu: 'Core i5-8400 or AMD Ryzen 5 2600',
          ram: '12 GB',
          ramGb: 12,
          gpu: 'GeForce GTX 1060 6GB or Radeon RX 580 8GB',
          vram: '6 GB',
          vramGb: 6,
          directX: 'Version 12',
          storage: '65 GB',
          storageGb: 65,
          storageType: 'SSD Recommended',
          target: '1080p @ 30 FPS'
        };
        recommended = {
          os: 'Windows 10/11 64-bit',
          cpu: 'Core i7-10700 or AMD Ryzen 7 3700X',
          ram: '16 GB',
          ramGb: 16,
          gpu: 'GeForce RTX 2060 SUPER or Radeon RX 5700 XT',
          vram: '8 GB',
          vramGb: 8,
          directX: 'Version 12',
          storage: '65 GB',
          storageGb: 65,
          storageType: 'Fast SSD Required',
          target: '1080p @ 60 FPS'
        };
      } else if (releaseYear >= 2018) {
        minimum = {
          os: 'Windows 10 64-bit',
          cpu: 'Core i5-4460 or AMD FX-6300',
          ram: '8 GB',
          ramGb: 8,
          gpu: 'GeForce GTX 960 2GB or Radeon R9 280',
          vram: '2 GB',
          vramGb: 2,
          directX: 'Version 11',
          storage: '45 GB',
          storageGb: 45,
          storageType: 'SSD Recommended',
          target: '1080p @ 30 FPS'
        };
        recommended = {
          os: 'Windows 10 64-bit',
          cpu: 'Core i7-4770 or AMD Ryzen 5 1600',
          ram: '16 GB',
          ramGb: 16,
          gpu: 'GeForce GTX 1060 6GB or Radeon RX 580 8GB',
          vram: '6 GB',
          vramGb: 6,
          directX: 'Version 11 or 12',
          storage: '45 GB',
          storageGb: 45,
          storageType: 'SSD',
          target: '1080p @ 60 FPS'
        };
      } else {
        minimum = {
          os: 'Windows 7/8/10 64-bit',
          cpu: 'Intel Core 2 Quad or AMD Phenom II X4',
          ram: '4 GB',
          ramGb: 4,
          gpu: 'GeForce GTX 460 or Radeon HD 5850',
          vram: '1 GB',
          vramGb: 1,
          directX: 'Version 10 or 11',
          storage: '25 GB',
          storageGb: 25,
          storageType: 'HDD / SSD',
          target: '1080p @ 30 FPS'
        };
        recommended = {
          os: 'Windows 10 64-bit',
          cpu: 'Intel Core i5-2500K or AMD FX-8350',
          ram: '8 GB',
          ramGb: 8,
          gpu: 'GeForce GTX 760 or Radeon R9 270X',
          vram: '2 GB',
          vramGb: 2,
          directX: 'Version 11',
          storage: '25 GB',
          storageGb: 25,
          storageType: 'SSD',
          target: '1080p @ 60 FPS'
        };
      }
    }

    // IGDB provides metadata but not publisher system requirements. Hide any
    // legacy genre/year-derived estimates rather than presenting them as real.
    minimum = null;
    recommended = null;
    reqVerificationStatus = 'Not available';
    requirementSource = 'IGDB does not publish PC system requirements';

    return {
      id: `igdb-${appData.id}`,
      igdbId: appData.id,
      steamAppId,
      title: appData.name,
      slug: appData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      description: appData.summary || appData.storyline || '',
      developers: developers.length ? developers : ['Unknown'],
      publishers: publishers.length ? publishers : ['Unknown'],
      releaseDate: appData.first_release_date ? new Date(appData.first_release_date * 1000).toISOString().split('T')[0] : 'Unknown',
      genres,
      genre: genres[0] || 'Action',
      tier,
      platforms,
      coverImage: appData.cover?.url ? `https:${appData.cover.url.replace('t_thumb', 't_cover_big')}` : null,
      screenshots,
      storeLinks: storeLinks.length ? storeLinks : [{ name: 'IGDB Profile', url: appData.url || 'https://www.igdb.com', official: true }],
      minimum,
      recommended,
      requirementsVerification: reqVerificationStatus,
      requirementsSource: requirementSource,
      sourceUrl: storeLinks[0]?.url || appData.url || 'https://www.igdb.com',
      lastVerified: new Date().toISOString().split('T')[0],
      lastSynchronized: new Date().toISOString()
    };
  }
}

export const igdbService = new IgdbService();

