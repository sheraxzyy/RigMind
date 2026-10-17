import React, { createContext, useContext, useState, useEffect } from 'react';
import { storageService, INITIAL_SAMPLE_PROFILE } from '../services/storageService';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [profiles, setProfiles] = useState([]);
  const [activeProfile, setActiveProfileState] = useState(INITIAL_SAMPLE_PROFILE);
  const [wishlist, setWishlist] = useState([]);
  const [recentAnalyses, setRecentAnalyses] = useState([]);
  const [settings, setSettings] = useState({});
  const [toasts, setToasts] = useState([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Initialize from storage on mount
  useEffect(() => {
    try {
      const storedProfiles = storageService.getProfiles();
      const storedActive = storageService.getActiveProfile();
      const storedWishlist = storageService.getWishlist();
      const storedAnalyses = storageService.getRecentAnalyses();
      const storedSettings = storageService.getSettings();

      setProfiles(storedProfiles);
      setActiveProfileState(storedActive);
      setWishlist(storedWishlist);
      setRecentAnalyses(storedAnalyses);
      setSettings(storedSettings);
    } catch (err) {
      console.error('[RigMind] Failed to load data from storage:', err);
    }
  }, []);

  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const setActiveProfile = (profileId) => {
    storageService.setActiveProfile(profileId);
    const selected = profiles.find((p) => p.id === profileId);
    if (selected) {
      setActiveProfileState(selected);
      addToast(`Active PC Profile switched to "${selected.name}"`, 'success');
    }
  };

  const saveProfile = (profileData) => {
    const updated = storageService.saveProfile(profileData);
    setProfiles(updated);
    const currentActive = storageService.getActiveProfile();
    setActiveProfileState(currentActive);
    addToast('Hardware profile saved successfully!', 'success');
  };

  const duplicateProfile = (profileId) => {
    const updated = storageService.duplicateProfile(profileId);
    setProfiles(updated);
    addToast('Profile duplicated successfully.', 'info');
  };

  const deleteProfile = (profileId) => {
    try {
      const updated = storageService.deleteProfile(profileId);
      setProfiles(updated);
      const currentActive = storageService.getActiveProfile();
      setActiveProfileState(currentActive);
      addToast('Profile deleted.', 'info');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const toggleWishlist = (gameId) => {
    const updated = storageService.toggleWishlist(gameId);
    setWishlist(updated);
    const isAdded = updated.includes(gameId);
    addToast(isAdded ? 'Added game to your wishlist!' : 'Removed game from wishlist.', 'info');
  };

  const saveSettings = (newSettings) => {
    const updated = storageService.saveSettings(newSettings);
    setSettings(updated);
    addToast('Application preferences updated.', 'success');
  };

  const resetAllData = () => {
    storageService.resetAllData();
    setProfiles(storageService.getProfiles());
    setActiveProfileState(storageService.getActiveProfile());
    setWishlist(storageService.getWishlist());
    setRecentAnalyses([]);
    setSettings(storageService.getSettings());
    addToast('All local RigMind data has been reset to defaults.', 'info');
  };

  const recordAnalysis = (analysis) => {
    const updated = storageService.addRecentAnalysis(analysis);
    setRecentAnalyses(updated);
  };

  return (
    <AppContext.Provider
      value={{
        profiles,
        activeProfile,
        setActiveProfile,
        saveProfile,
        duplicateProfile,
        deleteProfile,
        wishlist,
        toggleWishlist,
        recentAnalyses,
        recordAnalysis,
        settings,
        saveSettings,
        resetAllData,
        toasts,
        addToast,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        isMobileMenuOpen,
        setIsMobileMenuOpen
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
