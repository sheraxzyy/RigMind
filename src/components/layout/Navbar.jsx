import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, ChevronDown, Monitor, Laptop } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    activeProfile,
    profiles,
    setActiveProfile,
    isMobileMenuOpen,
    setIsMobileMenuOpen
  } = useApp();

  const getPageInfo = () => {
    switch (location.pathname) {
      case '/':
        return {
          title: 'System Overview',
          subtitle: 'Active rig hardware status, coverage & quick diagnostics'
        };
      case '/lab':
        return {
          title: 'Performance Lab',
          subtitle: 'Honest gaming framerate estimation & bottleneck diagnosis'
        };
      case '/games':
        return {
          title: 'Game Explorer',
          subtitle: 'Search titles, verify system requirements & test compatibility'
        };
      case '/my-pc':
        return {
          title: 'My PC Profiles',
          subtitle: 'Manage, duplicate, compare, and configure hardware rigs'
        };
      case '/compare':
        return {
          title: 'Hardware Compare',
          subtitle: 'Architectural side-by-side analysis for CPUs and GPUs'
        };
      case '/upgrade':
        return {
          title: 'Upgrade Advisor',
          subtitle: 'Goal-oriented upgrade recommendations & compatibility checklist'
        };
      case '/benchmarks':
        return {
          title: 'Benchmark Database',
          subtitle: 'Empirical hardware test runs with source attribution'
        };
      case '/settings':
        return {
          title: 'Settings & About',
          subtitle: 'Preferences, methodology explanations, and data management'
        };
      default:
        return { title: 'RigMind', subtitle: 'PC Gaming Intelligence' };
    }
  };

  const { title, subtitle } = getPageInfo();

  return (
    <header className="top-navbar">
      <div className="navbar-left">
        <button
          className="sidebar-toggle-btn mobile-menu-btn"
          style={{ display: 'none' }}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Open mobile menu"
        >
          <Menu size={18} />
        </button>

        <div className="page-title-group">
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>

      <div className="navbar-actions">
        {/* Active Profile Quick Switcher */}
        <div style={{ position: 'relative' }}>
          <select
            className="active-profile-pill"
            style={{
              cursor: 'pointer',
              appearance: 'none',
              paddingRight: '2rem',
              backgroundImage: 'none'
            }}
            value={activeProfile ? activeProfile.id : ''}
            onChange={(e) => setActiveProfile(e.target.value)}
            title="Switch active PC profile"
            aria-label="Switch active hardware profile"
          >
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.formFactor})
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            style={{
              position: 'absolute',
              right: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              color: 'var(--text-muted)'
            }}
          />
        </div>

        <button
          className="rm-btn rm-btn-secondary rm-btn-sm"
          onClick={() => navigate('/my-pc')}
          title="Manage Hardware Configurations"
        >
          {activeProfile?.formFactor === 'Laptop' ? (
            <Laptop size={14} />
          ) : (
            <Monitor size={14} />
          )}
          <span>Manage Rig</span>
        </button>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn {
            display: flex !important;
          }
          .page-title-group p {
            display: none;
          }
        }
      `}</style>
    </header>
  );
};
