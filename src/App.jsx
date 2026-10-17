import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AppLayout } from './components/layout/AppLayout';
import { CinematicLoader } from './components/common/CinematicLoader';
import { OverviewPage } from './pages/OverviewPage';
import { PerformanceLabPage } from './pages/PerformanceLabPage';
import { GameExplorerPage } from './pages/GameExplorerPage';
import { GameDetailPage } from './pages/GameDetailPage';
import { MyPcPage } from './pages/MyPcPage';
import { HardwareComparePage } from './pages/HardwareComparePage';
import { UpgradeAdvisorPage } from './pages/UpgradeAdvisorPage';
import { BenchmarkDatabasePage } from './pages/BenchmarkDatabasePage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  return (
    <AppProvider>
      <CinematicLoader />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/lab" element={<PerformanceLabPage />} />
            <Route path="/games" element={<GameExplorerPage />} />
            <Route path="/games/:id" element={<GameDetailPage />} />
            <Route path="/my-pc" element={<MyPcPage />} />
            <Route path="/compare" element={<HardwareComparePage />} />
            <Route path="/upgrade" element={<UpgradeAdvisorPage />} />
            <Route path="/benchmarks" element={<BenchmarkDatabasePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
