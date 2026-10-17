import { describe, it, expect } from 'vitest';
import { gameStore } from './gameStore.js';

describe('GameStore Database', () => {
  it('retrieves pre-seeded verified games', () => {
    const all = gameStore.getAll();
    expect(all.length).toBeGreaterThan(0);
    const cp2077 = gameStore.getById('cyberpunk-2077');
    expect(cp2077).toBeDefined();
    expect(cp2077.title).toContain('Cyberpunk 2077');
    expect(cp2077.requirementsVerification).toBe('Official');
  });

  it('searches games by title, developer or genre', () => {
    const searchRes = gameStore.search({ query: 'Cyberpunk' });
    expect(searchRes.total).toBeGreaterThanOrEqual(1);
    expect(searchRes.games[0].title).toContain('Cyberpunk');
  });

  it('filters games by platform/store', () => {
    const steamGames = gameStore.search({ platform: 'Steam' });
    expect(steamGames.games.every(g => g.steamAppId || g.storeLinks?.some(s => s.name.includes('Steam')))).toBe(true);
  });
});
