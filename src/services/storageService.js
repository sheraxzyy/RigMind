/**
 * RigMind Storage Service
 * Robust, resilient local storage abstraction.
 * Handles corrupted JSON, quota exceptions, default profile initialization,
 * and profile cloning/validation.
 */

const STORAGE_KEYS = {
  PROFILES: 'rigmind_profiles_v1',
  ACTIVE_PROFILE_ID: 'rigmind_active_profile_id_v1',
  WISHLIST: 'rigmind_game_wishlist_v1',
  RECENT_ANALYSES: 'rigmind_recent_analyses_v1',
  SETTINGS: 'rigmind_user_settings_v1'
};

export const INITIAL_SAMPLE_PROFILE = {
  id: 'profile-sample-i7-irisxe',
  name: 'Sample Intel Thin & Light',
  isDefault: true,
  createdAt: '2024-01-15T12:00:00.000Z',
  updatedAt: '2024-01-15T12:00:00.000Z',
  formFactor: 'Laptop',
  cpuId: 'intel-core-i7-1335u',
  cpuCustom: '',
  gpuId: 'intel-iris-xe-96eu',
  gpuCustom: '',
  ramCapacityGb: 16,
  ramConfiguration: 'Dual Channel LPDDR5-4800 (Soldered)',
  storageType: 'NVMe SSD',
  storageCapacityGb: 512,
  operatingSystem: 'Windows 10 64-bit',
  displayResolution: '1920x1080',
  refreshRateHz: 60,
  notes: 'Everyday work and casual gaming laptop. Uses 15W Intel Raptor Lake CPU with shared system RAM for graphics.'
};

export const SECONDARY_SAMPLE_PROFILE = {
  id: 'profile-desktop-rig',
  name: 'RigMind Desktop Beast',
  isDefault: false,
  createdAt: '2024-02-10T15:30:00.000Z',
  updatedAt: '2024-02-10T15:30:00.000Z',
  formFactor: 'Desktop',
  cpuId: 'amd-ryzen-7-7800x3d',
  cpuCustom: '',
  gpuId: 'nvidia-geforce-rtx-4070-super',
  gpuCustom: '',
  ramCapacityGb: 32,
  ramConfiguration: '2x16GB DDR5-6000 CL30',
  storageType: 'Gen4 NVMe SSD',
  storageCapacityGb: 2000,
  operatingSystem: 'Windows 11 64-bit',
  displayResolution: '2560x1440',
  refreshRateHz: 165,
  notes: 'Dedicated custom 1440p high-refresh gaming desktop with liquid cooling and 750W Gold PSU.'
};

export const DEFAULT_SETTINGS = {
  theme: 'dark',
  defaultResolution: '1920x1080',
  defaultPreset: 'High',
  motionPreference: 'normal', // 'normal' | 'reduced'
  benchmarkSourceFilter: 'all', // 'all' | 'verified_only'
  notifyOnBottleneck: true
};

class StorageService {
  constructor() {
    this.isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  _safeGet(key, fallback) {
    if (!this.isBrowser) return fallback;
    try {
      const item = localStorage.getItem(key);
      if (!item) return fallback;
      return JSON.parse(item);
    } catch (err) {
      console.warn(`[RigMind Storage] Error reading key "${key}":`, err);
      return fallback;
    }
  }

  _safeSet(key, value) {
    if (!this.isBrowser) return false;
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.error(`[RigMind Storage] Storage write error for key "${key}":`, err);
      return false;
    }
  }

  // --- PROFILES ---
  getProfiles() {
    const profiles = this._safeGet(STORAGE_KEYS.PROFILES, null);
    if (!profiles || !Array.isArray(profiles) || profiles.length === 0) {
      const initial = [INITIAL_SAMPLE_PROFILE, SECONDARY_SAMPLE_PROFILE];
      this._safeSet(STORAGE_KEYS.PROFILES, initial);
      this._safeSet(STORAGE_KEYS.ACTIVE_PROFILE_ID, INITIAL_SAMPLE_PROFILE.id);
      return initial;
    }
    return profiles;
  }

  getActiveProfile() {
    const profiles = this.getProfiles();
    const activeId = this._safeGet(STORAGE_KEYS.ACTIVE_PROFILE_ID, null);
    const found = profiles.find((p) => p.id === activeId);
    if (found) return found;
    return profiles[0] || INITIAL_SAMPLE_PROFILE;
  }

  setActiveProfile(id) {
    return this._safeSet(STORAGE_KEYS.ACTIVE_PROFILE_ID, id);
  }

  saveProfile(profile) {
    const profiles = this.getProfiles();
    const existingIndex = profiles.findIndex((p) => p.id === profile.id);

    const now = new Date().toISOString();
    let updated;

    if (existingIndex >= 0) {
      updated = [...profiles];
      updated[existingIndex] = {
        ...updated[existingIndex],
        ...profile,
        updatedAt: now
      };
    } else {
      const newProfile = {
        ...profile,
        id: profile.id || `profile-${Date.now()}`,
        createdAt: now,
        updatedAt: now
      };
      updated = [...profiles, newProfile];
    }

    if (profile.isDefault) {
      updated = updated.map((p) => ({
        ...p,
        isDefault: p.id === (profile.id || updated[updated.length - 1].id)
      }));
      this.setActiveProfile(profile.id || updated[updated.length - 1].id);
    }

    this._safeSet(STORAGE_KEYS.PROFILES, updated);
    return updated;
  }

  duplicateProfile(id) {
    const profiles = this.getProfiles();
    const target = profiles.find((p) => p.id === id);
    if (!target) return profiles;

    const copy = {
      ...target,
      id: `profile-${Date.now()}`,
      name: `${target.name} (Copy)`,
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updated = [...profiles, copy];
    this._safeSet(STORAGE_KEYS.PROFILES, updated);
    return updated;
  }

  deleteProfile(id) {
    const profiles = this.getProfiles();
    if (profiles.length <= 1) {
      throw new Error('You must retain at least one PC hardware profile.');
    }
    const updated = profiles.filter((p) => p.id !== id);
    this._safeSet(STORAGE_KEYS.PROFILES, updated);

    // If active profile was deleted, switch active
    const activeId = this._safeGet(STORAGE_KEYS.ACTIVE_PROFILE_ID, null);
    if (activeId === id) {
      this.setActiveProfile(updated[0].id);
    }
    return updated;
  }

  // --- WISHLIST ---
  getWishlist() {
    return this._safeGet(STORAGE_KEYS.WISHLIST, ['cyberpunk-2077', 'black-myth-wukong']);
  }

  toggleWishlist(gameId) {
    const wishlist = this.getWishlist();
    let updated;
    if (wishlist.includes(gameId)) {
      updated = wishlist.filter((id) => id !== gameId);
    } else {
      updated = [...wishlist, gameId];
    }
    this._safeSet(STORAGE_KEYS.WISHLIST, updated);
    return updated;
  }

  // --- RECENT ANALYSES ---
  getRecentAnalyses() {
    return this._safeGet(STORAGE_KEYS.RECENT_ANALYSES, []);
  }

  addRecentAnalysis(analysis) {
    const existing = this.getRecentAnalyses();
    const record = {
      ...analysis,
      id: `analysis-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    // Keep last 10
    const updated = [record, ...existing.filter((item) => item.gameId !== analysis.gameId)].slice(0, 10);
    this._safeSet(STORAGE_KEYS.RECENT_ANALYSES, updated);
    return updated;
  }

  // --- SETTINGS ---
  getSettings() {
    return {
      ...DEFAULT_SETTINGS,
      ...this._safeGet(STORAGE_KEYS.SETTINGS, {})
    };
  }

  saveSettings(newSettings) {
    const current = this.getSettings();
    const merged = { ...current, ...newSettings };
    this._safeSet(STORAGE_KEYS.SETTINGS, merged);
    return merged;
  }

  resetAllData() {
    if (!this.isBrowser) return;
    try {
      localStorage.removeItem(STORAGE_KEYS.PROFILES);
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_PROFILE_ID);
      localStorage.removeItem(STORAGE_KEYS.WISHLIST);
      localStorage.removeItem(STORAGE_KEYS.RECENT_ANALYSES);
      localStorage.removeItem(STORAGE_KEYS.SETTINGS);
      // Reinitialize defaults
      this.getProfiles();
      return true;
    } catch (err) {
      console.error('[RigMind Storage] Error resetting data:', err);
      return false;
    }
  }
}

export const storageService = new StorageService();
