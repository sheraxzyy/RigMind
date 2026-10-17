import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wrench,
  AlertTriangle,
  CheckCircle2,
  ListChecks,
  Laptop,
  Monitor
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  compatibilityService,
  UPGRADE_GOALS,
  UPGRADE_BUDGET_TIERS
} from '../services/compatibilityService';
import { CPU_DATABASE, GPU_DATABASE } from '../data/hardware';

export const UpgradeAdvisorPage = () => {
  const navigate = useNavigate();
  const { activeProfile } = useApp();

  const [selectedGoalId, setSelectedGoalId] = useState(UPGRADE_GOALS[0].id);
  const [selectedBudgetId, setSelectedBudgetId] = useState(UPGRADE_BUDGET_TIERS[1].id);

  const evaluation = compatibilityService.evaluateUpgradePlan(
    activeProfile,
    selectedGoalId,
    selectedBudgetId
  );

  const currentCpu = CPU_DATABASE.find((c) => c.id === activeProfile?.cpuId);
  const currentGpu = GPU_DATABASE.find((g) => g.id === activeProfile?.gpuId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header Banner */}
      <div className="rm-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
          <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'var(--accent-subtle)', color: 'var(--accent-primary)' }}>
            <Wrench size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Upgrade Advisor</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Practical, goal-oriented component upgrade planning with strict platform compatibility checks.
            </p>
          </div>
        </div>
      </div>

      {/* Target System & Goals Configuration */}
      <div className="grid-2">
        {/* Active System Summary */}
        <div className="rm-card">
          <div className="rm-card-header">
            <div>
              <div className="rm-card-title">
                {activeProfile?.formFactor === 'Laptop' ? <Laptop size={18} /> : <Monitor size={18} />}
                <span>Active Target Rig: {activeProfile?.name}</span>
              </div>
              <div className="rm-card-subtitle">{activeProfile?.formFactor} Platform</div>
            </div>
            <button className="rm-btn rm-btn-secondary rm-btn-sm" onClick={() => navigate('/my-pc')}>
              Change Rig
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Processor:</span>
              <strong>{currentCpu?.name || activeProfile?.cpuCustom || 'Intel Core i7-1335U'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Graphics:</span>
              <strong>{currentGpu?.name || activeProfile?.gpuCustom || 'Intel Iris Xe'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Installed RAM:</span>
              <span>{activeProfile?.ramCapacityGb} GB</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0' }}>
              <span style={{ color: 'var(--text-muted)' }}>Primary Bottleneck:</span>
              <strong style={{ color: 'var(--accent-hover)' }}>{evaluation.bottleneck}</strong>
            </div>
          </div>
        </div>

        {/* Upgrade Goal & Budget Picker */}
        <div className="rm-card">
          <div className="rm-card-title" style={{ marginBottom: '1rem' }}>
            <span>Define Your Objective</span>
          </div>

          <div className="rm-form-group">
            <label className="rm-form-label" htmlFor="upgrade-goal-select">What is your primary upgrade goal?</label>
            <select
              id="upgrade-goal-select"
              className="rm-select"
              value={selectedGoalId}
              onChange={(e) => setSelectedGoalId(e.target.value)}
            >
              {UPGRADE_GOALS.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          <div className="rm-form-group" style={{ marginBottom: 0 }}>
            <label className="rm-form-label" htmlFor="budget-tier-select">Target Upgrade Budget Tier</label>
            <select
              id="budget-tier-select"
              className="rm-select"
              value={selectedBudgetId}
              onChange={(e) => setSelectedBudgetId(e.target.value)}
            >
              {UPGRADE_BUDGET_TIERS.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Critical Platform Warnings (e.g., Laptop Soldered Restrictions) */}
      {evaluation.issues && evaluation.issues.length > 0 && (
        <div className="rm-card" style={{ borderLeft: '4px solid var(--color-danger)', background: 'var(--color-danger-bg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--color-danger)', marginBottom: '0.5rem' }}>
            <AlertTriangle size={20} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
              Physical Hardware Restriction Detected
            </h3>
          </div>
          {evaluation.issues.map((issue, i) => (
            <p key={i} style={{ fontSize: '0.88rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              <strong>{issue.component}:</strong> {issue.message}
            </p>
          ))}
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            RigMind explicitly warns users before they spend money on desktop components that cannot physically fit or connect to laptop motherboards.
          </div>
        </div>
      )}

      {/* Priority Upgrade Recommendations */}
      <div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>
          Recommended Upgrade Actions (Ranked by Return on Investment)
        </h3>

        <div className="grid-2">
          {evaluation.recommendations.map((rec) => (
            <div key={rec.priority} className="rm-card rm-card-glow" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div className="rm-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="rm-badge rm-badge-crimson">Priority #{rec.priority}</span>
                    <span className="rm-badge" style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}>
                      {rec.type}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-success)', fontSize: '0.9rem' }}>
                    {rec.estCostRange}
                  </div>
                </div>

                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                  {rec.title}
                </h4>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.45' }}>
                  {rec.rationale}
                </p>

                {rec.candidateComponents && rec.candidateComponents.length > 0 && (
                  <div style={{ padding: '0.75rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                      Recommended Candidate Components:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {rec.candidateComponents.map((compId) => {
                        const comp = GPU_DATABASE.find(g => g.id === compId) || CPU_DATABASE.find(c => c.id === compId);
                        return (
                          <span key={compId} className="rm-badge" style={{ background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-main)' }}>
                            {comp ? comp.name : compId}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                Note: Estimated prices are realistic market averages as of 2024. Verify retailer pricing before purchasing.
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mandatory Verification Checklist */}
      <div className="rm-card">
        <div className="rm-card-header">
          <div className="rm-card-title">
            <ListChecks size={18} style={{ color: 'var(--color-warning)' }} />
            <span>Pre-Purchase Hardware Verification Checklist</span>
          </div>
          <span className="rm-badge rm-badge-demonstration">Critical Checks</span>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Do NOT purchase upgrade components until every item on this checklist is physically confirmed:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {evaluation.requiredChecklist.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.65rem',
                padding: '0.75rem',
                background: 'var(--bg-input)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem'
              }}
            >
              <CheckCircle2 size={16} style={{ color: 'var(--color-warning)', flexShrink: 0, marginTop: '2px' }} />
              <span style={{ color: 'var(--text-main)' }}>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
