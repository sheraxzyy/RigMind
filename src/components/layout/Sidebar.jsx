import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FlaskConical,
  Gamepad2,
  Cpu,
  ArrowRightLeft,
  Wrench,
  Database,
  Settings,
  ChevronLeft,
  ChevronRight,
  Laptop,
  Monitor
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Sidebar = () => {
  const {
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    activeProfile
  } = useApp();

  const navItems = [
    { path: '/', label: 'Overview', icon: LayoutDashboard },
    { path: '/lab', label: 'Performance Lab', icon: FlaskConical },
    { path: '/games', label: 'Game Explorer', icon: Gamepad2 },
    { path: '/my-pc', label: 'My PC Profiles', icon: Cpu },
    { path: '/compare', label: 'Hardware Compare', icon: ArrowRightLeft },
    { path: '/upgrade', label: 'Upgrade Advisor', icon: Wrench },
    { path: '/benchmarks', label: 'Benchmark Database', icon: Database },
    { path: '/settings', label: 'Settings', icon: Settings }
  ];

  const handleNavClick = () => {
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <aside
      className={`app-sidebar ${isSidebarCollapsed ? 'collapsed' : ''} ${
        isMobileMenuOpen ? 'mobile-open' : ''
      }`}
    >
      <div className="sidebar-header">
        <NavLink to="/" className="logo-container" onClick={handleNavClick}>
          <div className="logo-icon-badge" title="RigMind Engine">
            <Cpu size={18} />
          </div>
          {!isSidebarCollapsed && (
            <div className="logo-text">
              <span>RIGMIND</span>
              <span className="logo-tagline">PC Intelligence</span>
            </div>
          )}
        </NavLink>

        <button
          className="sidebar-toggle-btn"
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label="Toggle sidebar width"
        >
          {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="sidebar-nav" aria-label="Main Navigation">
        {!isSidebarCollapsed && <div className="nav-section-label">Navigation</div>}
        {navItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `nav-link-item ${isActive ? 'active' : ''}`
              }
              onClick={handleNavClick}
              title={isSidebarCollapsed ? item.label : undefined}
            >
              <IconComponent className="nav-link-icon" />
              {!isSidebarCollapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {!isSidebarCollapsed && activeProfile && (
        <div className="sidebar-footer">
          <div className="sidebar-profile-card">
            <div className="rig-status-pill" title="Config Loaded" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {activeProfile.name}
              </div>
              <div
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {activeProfile.formFactor === 'Laptop' ? (
                  <Laptop size={12} />
                ) : (
                  <Monitor size={12} />
                )}
                <span>{activeProfile.formFactor}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
