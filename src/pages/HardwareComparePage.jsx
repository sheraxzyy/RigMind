import React, { useState } from 'react';
import {
  ArrowRightLeft,
  Cpu,
  Tv,
  Layers
} from 'lucide-react';
import { CPU_DATABASE, GPU_DATABASE } from '../data/hardware';
import { compatibilityService } from '../services/compatibilityService';

export const HardwareComparePage = () => {
  const [componentType, setComponentType] = useState('gpu'); // 'gpu' | 'cpu'
  const [itemAId, setItemAId] = useState(GPU_DATABASE[0].id);
  const [itemBId, setItemBId] = useState(GPU_DATABASE[2].id);

  const dataset = componentType === 'gpu' ? GPU_DATABASE : CPU_DATABASE;
  const itemA = dataset.find((item) => item.id === itemAId) || dataset[0];
  const itemB = dataset.find((item) => item.id === itemBId) || dataset[1];

  const handleTypeSwitch = (type) => {
    setComponentType(type);
    if (type === 'gpu') {
      setItemAId(GPU_DATABASE[0].id);
      setItemBId(GPU_DATABASE[2].id);
    } else {
      setItemAId(CPU_DATABASE[0].id);
      setItemBId(CPU_DATABASE[1].id);
    }
  };

  const comparison = compatibilityService.compareComponents(itemA, itemB, componentType);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header Banner */}
      <div className="rm-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'var(--accent-subtle)', color: 'var(--accent-primary)' }}>
              <ArrowRightLeft size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Hardware Compare</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Objective architectural comparison between verified CPUs and GPUs with plain-language trade-offs.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', background: 'var(--bg-input)', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
            <button
              className={`rm-btn rm-btn-sm ${componentType === 'gpu' ? 'rm-btn-primary' : 'rm-btn-secondary'}`}
              style={{ border: 'none' }}
              onClick={() => handleTypeSwitch('gpu')}
            >
              <Tv size={14} />
              <span>Compare GPUs</span>
            </button>
            <button
              className={`rm-btn rm-btn-sm ${componentType === 'cpu' ? 'rm-btn-primary' : 'rm-btn-secondary'}`}
              style={{ border: 'none' }}
              onClick={() => handleTypeSwitch('cpu')}
            >
              <Cpu size={14} />
              <span>Compare CPUs</span>
            </button>
          </div>
        </div>
      </div>

      {/* Selectors Bar */}
      <div className="rm-card" style={{ padding: '1.25rem' }}>
        <div className="grid-2">
          <div className="rm-form-group" style={{ marginBottom: 0 }}>
            <label className="rm-form-label" htmlFor="comp-a-select">
              Component A ({componentType.toUpperCase()})
            </label>
            <select
              id="comp-a-select"
              className="rm-select"
              value={itemA.id}
              onChange={(e) => setItemAId(e.target.value)}
            >
              {dataset.map((d) => (
                <option key={d.id} value={d.id} disabled={d.id === itemB.id}>
                  {d.name} {d.formFactor ? `(${d.formFactor})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="rm-form-group" style={{ marginBottom: 0 }}>
            <label className="rm-form-label" htmlFor="comp-b-select">
              Component B ({componentType.toUpperCase()})
            </label>
            <select
              id="comp-b-select"
              className="rm-select"
              value={itemB.id}
              onChange={(e) => setItemBId(e.target.value)}
            >
              {dataset.map((d) => (
                <option key={d.id} value={d.id} disabled={d.id === itemA.id}>
                  {d.name} {d.formFactor ? `(${d.formFactor})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Key Architectural Takeaways / Plain Language Analysis */}
      {comparison && (
        <div className="grid-2">
          {/* Item A Advantages */}
          <div className="rm-card" style={{ borderLeft: '4px solid var(--accent-primary)' }}>
            <div className="rm-card-header">
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {itemA.name} Strengths
              </h4>
              <span className="rm-badge rm-badge-crimson">Component A</span>
            </div>
            {comparison.prosA.length > 0 ? (
              <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                {comparison.prosA.map((pro, i) => (
                  <li key={i}>{pro}</li>
                ))}
              </ul>
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Lower relative architectural throughput compared to Component B.
              </p>
            )}
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.85rem', lineHeight: '1.4' }}>
              {itemA.description}
            </p>
          </div>

          {/* Item B Advantages */}
          <div className="rm-card" style={{ borderLeft: '4px solid #38BDF8' }}>
            <div className="rm-card-header">
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {itemB.name} Strengths
              </h4>
              <span className="rm-badge" style={{ background: 'var(--color-info-bg)', color: '#38BDF8', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
                Component B
              </span>
            </div>
            {comparison.prosB.length > 0 ? (
              <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                {comparison.prosB.map((pro, i) => (
                  <li key={i}>{pro}</li>
                ))}
              </ul>
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Lower relative architectural throughput compared to Component A.
              </p>
            )}
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.85rem', lineHeight: '1.4' }}>
              {itemB.description}
            </p>
          </div>
        </div>
      )}

      {/* Side-by-side Verified Technical Specs Table */}
      <div className="rm-card">
        <div className="rm-card-header">
          <div className="rm-card-title">
            <Layers size={18} style={{ color: 'var(--color-warning)' }} />
            <span>Verified Architectural Specifications</span>
          </div>
          <span className="rm-badge rm-badge-verified">Verified Specs Only</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-main)', textAlign: 'left' }}>
                <th style={{ padding: '0.85rem', color: 'var(--text-muted)' }}>Specification Attribute</th>
                <th style={{ padding: '0.85rem', color: 'var(--accent-hover)' }}>{itemA.name}</th>
                <th style={{ padding: '0.85rem', color: '#38BDF8' }}>{itemB.name}</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '0.85rem', color: 'var(--text-muted)' }}>Manufacturer & Architecture</td>
                <td style={{ padding: '0.85rem' }}>{itemA.manufacturer} ({itemA.architecture})</td>
                <td style={{ padding: '0.85rem' }}>{itemB.manufacturer} ({itemB.architecture})</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '0.85rem', color: 'var(--text-muted)' }}>Form Factor / Packaging</td>
                <td style={{ padding: '0.85rem' }}>{itemA.formFactor}</td>
                <td style={{ padding: '0.85rem' }}>{itemB.formFactor}</td>
              </tr>

              {componentType === 'gpu' ? (
                <>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.85rem', color: 'var(--text-muted)' }}>VRAM Capacity & Bus Width</td>
                    <td style={{ padding: '0.85rem' }}>{itemA.vramGb} ({itemA.busWidthBits})</td>
                    <td style={{ padding: '0.85rem' }}>{itemB.vramGb} ({itemB.busWidthBits})</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.85rem', color: 'var(--text-muted)' }}>Execution / Shading Units</td>
                    <td style={{ padding: '0.85rem' }}>{itemA.shadingUnits} shaders ({itemA.executionUnits} EUs/SMs)</td>
                    <td style={{ padding: '0.85rem' }}>{itemB.shadingUnits} shaders ({itemB.executionUnits} EUs/SMs)</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.85rem', color: 'var(--text-muted)' }}>Hardware Ray Tracing</td>
                    <td style={{ padding: '0.85rem' }}>{itemA.rayTracing ? 'Supported' : 'Unsupported'}</td>
                    <td style={{ padding: '0.85rem' }}>{itemB.rayTracing ? 'Supported' : 'Unsupported'}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.85rem', color: 'var(--text-muted)' }}>TDP / Power Consumption</td>
                    <td style={{ padding: '0.85rem' }}>{itemA.tdpWatts} W</td>
                    <td style={{ padding: '0.85rem' }}>{itemB.tdpWatts} W</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.85rem', color: 'var(--text-muted)' }}>Upscaling Feature Support</td>
                    <td style={{ padding: '0.85rem' }}>{itemA.upscalingSupport ? itemA.upscalingSupport.join(', ') : 'None'}</td>
                    <td style={{ padding: '0.85rem' }}>{itemB.upscalingSupport ? itemB.upscalingSupport.join(', ') : 'None'}</td>
                  </tr>
                </>
              ) : (
                <>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.85rem', color: 'var(--text-muted)' }}>Socket / Platform</td>
                    <td style={{ padding: '0.85rem' }}>{itemA.socket}</td>
                    <td style={{ padding: '0.85rem' }}>{itemB.socket}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.85rem', color: 'var(--text-muted)' }}>Cores & Threads</td>
                    <td style={{ padding: '0.85rem' }}>{itemA.cores} Cores / {itemA.threads} Threads</td>
                    <td style={{ padding: '0.85rem' }}>{itemB.cores} Cores / {itemB.threads} Threads</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.85rem', color: 'var(--text-muted)' }}>Clock Speeds (Base / Boost)</td>
                    <td style={{ padding: '0.85rem' }}>{itemA.baseClockGhz} GHz / {itemA.boostClockGhz} GHz</td>
                    <td style={{ padding: '0.85rem' }}>{itemB.baseClockGhz} GHz / {itemB.boostClockGhz} GHz</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.85rem', color: 'var(--text-muted)' }}>TDP & Max Power</td>
                    <td style={{ padding: '0.85rem' }}>{itemA.tdpWatts}W (Max: {itemA.maxTdpWatts}W)</td>
                    <td style={{ padding: '0.85rem' }}>{itemB.tdpWatts}W (Max: {itemB.maxTdpWatts}W)</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.85rem', color: 'var(--text-muted)' }}>Memory Generation Support</td>
                    <td style={{ padding: '0.85rem' }}>{itemA.memorySupport}</td>
                    <td style={{ padding: '0.85rem' }}>{itemB.memorySupport}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
