import React, { useState } from 'react';
import {
  Cpu,
  Tv,
  HardDrive,
  Layers,
  Monitor,
  Laptop,
  Plus,
  Copy,
  Trash2,
  Check,
  Edit2,
  Save,
  ArrowRightLeft,
  Info,
  Server
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  CPU_DATABASE,
  GPU_DATABASE,
  MOTHERBOARD_PRESETS,
  COOLING_OPTIONS,
  PSU_OPTIONS,
  RAM_OPTIONS,
  RAM_SPEED_CONFIGS,
  STORAGE_OPTIONS,
  RESOLUTION_PRESETS,
  REFRESH_RATE_PRESETS
} from '../data/hardware';
import { PerformanceEstimator } from '../services/performanceEstimator';

const estimator = new PerformanceEstimator();

export const MyPcPage = () => {
  const {
    profiles,
    activeProfile,
    setActiveProfile,
    saveProfile,
    duplicateProfile,
    deleteProfile,
    addToast
  } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [comparingProfileId, setComparingProfileId] = useState(null);
  const [activeFormTab, setActiveFormTab] = useState('core'); // 'core' | 'memory_storage' | 'platform_cooling'

  const startNewProfile = () => {
    setEditingProfile({
      id: `profile-${Date.now()}`,
      name: 'Custom Gaming Rig',
      isDefault: false,
      formFactor: 'Desktop',
      cpuId: 'amd-ryzen-7-7800x3d',
      cpuCustom: '',
      gpuId: 'nvidia-geforce-rtx-4070-super',
      gpuCustom: '',
      motherboard: 'am5-b650',
      motherboardCustom: '',
      cooling: 'aio-240',
      coolingCustom: '',
      psu: '750w-gold',
      psuCustom: '',
      ramCapacityGb: 32,
      ramConfiguration: 'DDR5-6000 CL30 AMD EXPO (Optimal Zen 4/5 Sweetspot)',
      storageType: 'PCIe Gen 4 NVMe SSD (5000 - 7400 MB/s)',
      storageCapacityGb: 2000,
      secondaryStorage: '1000 GB PCIe Gen 3 NVMe SSD',
      operatingSystem: 'Windows 11 64-bit',
      displayResolution: '2560x1440',
      refreshRateHz: 165,
      notes: 'High-performance 1440p custom build with dual-channel DDR5 and liquid cooling.'
    });
    setIsEditing(true);
  };

  const startEditProfile = (profile) => {
    setEditingProfile({
      ...profile,
      motherboard: profile.motherboard || 'am5-b650',
      motherboardCustom: profile.motherboardCustom || '',
      cooling: profile.cooling || 'air-dual-tower',
      coolingCustom: profile.coolingCustom || '',
      psu: profile.psu || '750w-gold',
      psuCustom: profile.psuCustom || '',
      secondaryStorage: profile.secondaryStorage || '',
      refreshRateHz: profile.refreshRateHz || 144
    });
    setIsEditing(true);
  };

  const handleSaveForm = (e) => {
    e.preventDefault();
    if (!editingProfile.name.trim()) {
      addToast('Profile name cannot be empty.', 'error');
      return;
    }
    saveProfile(editingProfile);
    setIsEditing(false);
    setEditingProfile(null);
  };

  const compareTarget = profiles.find((p) => p.id === comparingProfileId);

  // Dynamic preview calculation
  const resolvedCpu = editingProfile
    ? estimator.resolveCpu(editingProfile.cpuId, editingProfile.cpuCustom)
    : null;
  const resolvedGpu = editingProfile
    ? estimator.resolveGpu(editingProfile.gpuId, editingProfile.gpuCustom)
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header Banner */}
      <div className="rm-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'var(--accent-subtle)', color: 'var(--accent-primary)' }}>
              <Cpu size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>My PC Hardware Profiles</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Create, customize, and compare any PC configuration with all modern CPUs, GPUs, motherboards, cooling, RAM, storage, and displays.
              </p>
            </div>
          </div>

          <button className="rm-btn rm-btn-primary" onClick={startNewProfile}>
            <Plus size={16} />
            <span>Create New Profile</span>
          </button>
        </div>
      </div>

      {/* Persistence Notice */}
      <div style={{ padding: '0.85rem 1.25rem', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
        <Info size={16} style={{ color: 'var(--color-info)', flexShrink: 0 }} />
        <span>
          <strong>Zero Error Hardware Engine:</strong> RigMind supports every verified component from Intel, AMD, NVIDIA, as well as arbitrary custom models with intelligent heuristic extrapolation.
        </span>
      </div>

      {/* Profile Editor Modal / Inline Form */}
      {isEditing && editingProfile && (
        <div className="rm-card" style={{ border: '1px solid var(--accent-primary)', position: 'relative' }}>
          <div className="rm-card-header">
            <div className="rm-card-title">
              <Edit2 size={18} style={{ color: 'var(--accent-primary)' }} />
              <span>{editingProfile.id ? 'Edit System Hardware Profile' : 'New System Hardware Profile'}</span>
            </div>
            <button
              className="rm-btn rm-btn-secondary rm-btn-sm"
              onClick={() => {
                setIsEditing(false);
                setEditingProfile(null);
              }}
            >
              Cancel
            </button>
          </div>

          {/* Tab Navigation for Clean Spec Organization */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
            <button
              type="button"
              className={`rm-btn rm-btn-sm ${activeFormTab === 'core' ? 'rm-btn-primary' : 'rm-btn-secondary'}`}
              onClick={() => setActiveFormTab('core')}
            >
              <Cpu size={14} />
              <span>1. Core Processing (CPU & GPU)</span>
            </button>
            <button
              type="button"
              className={`rm-btn rm-btn-sm ${activeFormTab === 'memory_storage' ? 'rm-btn-primary' : 'rm-btn-secondary'}`}
              onClick={() => setActiveFormTab('memory_storage')}
            >
              <Layers size={14} />
              <span>2. Memory & Storage (RAM & SSD)</span>
            </button>
            <button
              type="button"
              className={`rm-btn rm-btn-sm ${activeFormTab === 'platform_cooling' ? 'rm-btn-primary' : 'rm-btn-secondary'}`}
              onClick={() => setActiveFormTab('platform_cooling')}
            >
              <Server size={14} />
              <span>3. Platform, Cooling, PSU & Display</span>
            </button>
          </div>

          <form onSubmit={handleSaveForm}>
            {/* TAB 1: CORE PROCESSING */}
            {activeFormTab === 'core' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="grid-2">
                  <div className="rm-form-group">
                    <label className="rm-form-label" htmlFor="edit-profile-name">Profile Name</label>
                    <input
                      id="edit-profile-name"
                      type="text"
                      className="rm-input"
                      value={editingProfile.name}
                      onChange={(e) => setEditingProfile({ ...editingProfile, name: e.target.value })}
                      placeholder="e.g. My Main Battlestation, Living Room PC, Laptop..."
                      required
                    />
                  </div>

                  <div className="rm-form-group">
                    <label className="rm-form-label" htmlFor="edit-form-factor">Chassis / System Classification</label>
                    <select
                      id="edit-form-factor"
                      className="rm-select"
                      value={editingProfile.formFactor}
                      onChange={(e) => setEditingProfile({ ...editingProfile, formFactor: e.target.value })}
                    >
                      <option value="Desktop">Desktop PC (Socketed / Upgradable)</option>
                      <option value="Laptop">Laptop / Notebook (Soldered CPU & GPU)</option>
                      <option value="Handheld">Handheld / Small Form Factor PC (Steam Deck, ROG Ally)</option>
                      <option value="Mini PC">Mini PC / Micro Desktop (NUC, SFF)</option>
                    </select>
                  </div>
                </div>

                {/* CPU Selection & Custom Fallback */}
                <div style={{ padding: '1rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <Cpu size={16} style={{ color: 'var(--accent-primary)' }} />
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Central Processor (CPU)</span>
                  </div>

                  <div className="grid-2">
                    <div className="rm-form-group">
                      <label className="rm-form-label" htmlFor="edit-cpu-catalog">Select from Verified Catalog ({CPU_DATABASE.length} Models)</label>
                      <select
                        id="edit-cpu-catalog"
                        className="rm-select"
                        value={editingProfile.cpuId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditingProfile({
                            ...editingProfile,
                            cpuId: val,
                            cpuCustom: val ? '' : editingProfile.cpuCustom
                          });
                        }}
                      >
                        <option value="">Custom CPU / Model Not Listed...</option>
                        <optgroup label="AMD Ryzen 9000 & 7000 (Zen 5 & Zen 4 AM5)">
                          {CPU_DATABASE.filter(c => c.generation.includes('Ryzen 9000') || c.generation.includes('Ryzen 7000')).map(c => (
                            <option key={c.id} value={c.id}>{c.name} ({c.cores} Cores)</option>
                          ))}
                        </optgroup>
                        <optgroup label="AMD Ryzen 5000 & 3000 (Zen 3 & Zen 2 AM4)">
                          {CPU_DATABASE.filter(c => c.generation.includes('Ryzen 5000') || c.generation.includes('Ryzen 3000')).map(c => (
                            <option key={c.id} value={c.id}>{c.name} ({c.cores} Cores)</option>
                          ))}
                        </optgroup>
                        <optgroup label="Intel Core Ultra (Arrow Lake & Meteor Lake)">
                          {CPU_DATABASE.filter(c => c.generation.includes('Core Ultra')).map(c => (
                            <option key={c.id} value={c.id}>{c.name} ({c.cores} Cores)</option>
                          ))}
                        </optgroup>
                        <optgroup label="Intel 14th & 13th Gen (Raptor Lake)">
                          {CPU_DATABASE.filter(c => c.generation.includes('14th Gen') || c.generation.includes('13th Gen')).map(c => (
                            <option key={c.id} value={c.id}>{c.name} ({c.cores} Cores)</option>
                          ))}
                        </optgroup>
                        <optgroup label="Intel 12th, 10th & Legacy">
                          {CPU_DATABASE.filter(c => c.generation.includes('12th Gen') || c.generation.includes('10th Gen') || c.generation.includes('Gen') || c.generation.includes('Series')).map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </optgroup>
                      </select>
                    </div>

                    <div className="rm-form-group">
                      <label className="rm-form-label" htmlFor="edit-cpu-custom">
                        Custom CPU Model Name (Any CPU in the World)
                      </label>
                      <input
                        id="edit-cpu-custom"
                        type="text"
                        className="rm-input"
                        value={editingProfile.cpuCustom || ''}
                        onChange={(e) => {
                          setEditingProfile({
                            ...editingProfile,
                            cpuCustom: e.target.value,
                            cpuId: e.target.value ? '' : editingProfile.cpuId
                          });
                        }}
                        placeholder="e.g. Intel Core i9-14900KS, AMD Ryzen 7 5700X, Intel Xeon..."
                      />
                    </div>
                  </div>

                  {resolvedCpu && (
                    <div style={{ marginTop: '0.6rem', fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span className="rm-badge rm-badge-verified">Architecture Verified</span>
                      <span>Relative Single-Core: <strong>{resolvedCpu.relativeSingleThread}/100</strong></span>
                      <span>•</span>
                      <span>Multi-Core: <strong>{resolvedCpu.relativeMultiThread}/100</strong></span>
                      <span>•</span>
                      <span style={{ color: 'var(--accent-hover)' }}>Tier: {resolvedCpu.tier}</span>
                    </div>
                  )}
                </div>

                {/* GPU Selection & Custom Fallback */}
                <div style={{ padding: '1rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <Tv size={16} style={{ color: '#38BDF8' }} />
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Graphics Processor (GPU)</span>
                  </div>

                  <div className="grid-2">
                    <div className="rm-form-group">
                      <label className="rm-form-label" htmlFor="edit-gpu-catalog">Select from Verified Catalog ({GPU_DATABASE.length} Models)</label>
                      <select
                        id="edit-gpu-catalog"
                        className="rm-select"
                        value={editingProfile.gpuId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditingProfile({
                            ...editingProfile,
                            gpuId: val,
                            gpuCustom: val ? '' : editingProfile.gpuCustom
                          });
                        }}
                      >
                        <option value="">Custom GPU / Model Not Listed...</option>
                        <optgroup label="NVIDIA RTX 50 & 40 Series (Blackwell & Ada Lovelace)">
                          {GPU_DATABASE.filter(g => g.name.includes('RTX 50') || g.name.includes('RTX 40')).map(g => (
                            <option key={g.id} value={g.id}>{g.name} ({g.vramGb})</option>
                          ))}
                        </optgroup>
                        <optgroup label="NVIDIA RTX 30 & 20 Series (Ampere & Turing)">
                          {GPU_DATABASE.filter(g => g.name.includes('RTX 30') || g.name.includes('RTX 20')).map(g => (
                            <option key={g.id} value={g.id}>{g.name} ({g.vramGb})</option>
                          ))}
                        </optgroup>
                        <optgroup label="NVIDIA GTX Series">
                          {GPU_DATABASE.filter(g => g.name.includes('GTX')).map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                          ))}
                        </optgroup>
                        <optgroup label="AMD Radeon RX 7000 & 6000 Series (RDNA 3 & 2)">
                          {GPU_DATABASE.filter(g => g.name.includes('RX 7') || g.name.includes('RX 6')).map(g => (
                            <option key={g.id} value={g.id}>{g.name} ({g.vramGb})</option>
                          ))}
                        </optgroup>
                        <optgroup label="Intel Arc Discrete (Battlemage & Alchemist)">
                          {GPU_DATABASE.filter(g => g.name.includes('Arc B') || g.name.includes('Arc A')).map(g => (
                            <option key={g.id} value={g.id}>{g.name} ({g.vramGb})</option>
                          ))}
                        </optgroup>
                        <optgroup label="Integrated Graphics (APU & Laptop)">
                          {GPU_DATABASE.filter(g => g.formFactor.includes('Integrated')).map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                          ))}
                        </optgroup>
                      </select>
                    </div>

                    <div className="rm-form-group">
                      <label className="rm-form-label" htmlFor="edit-gpu-custom">
                        Custom GPU Model Name (Any GPU in the World)
                      </label>
                      <input
                        id="edit-gpu-custom"
                        type="text"
                        className="rm-input"
                        value={editingProfile.gpuCustom || ''}
                        onChange={(e) => {
                          setEditingProfile({
                            ...editingProfile,
                            gpuCustom: e.target.value,
                            gpuId: e.target.value ? '' : editingProfile.gpuId
                          });
                        }}
                        placeholder="e.g. NVIDIA RTX 4070 Ti SUPER, AMD Radeon RX 7900 GRE, GTX 1070..."
                      />
                    </div>
                  </div>

                  {resolvedGpu && (
                    <div style={{ marginTop: '0.6rem', fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span className="rm-badge" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8' }}>
                        GPU Power Index: {resolvedGpu.relativeGpuPower}
                      </span>
                      <span>VRAM: <strong>{resolvedGpu.vramGb}</strong></span>
                      <span>•</span>
                      <span>Ray Tracing: <strong>{resolvedGpu.rayTracing ? 'Supported' : 'No Hardware RT'}</strong></span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: MEMORY & STORAGE */}
            {activeFormTab === 'memory_storage' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="grid-2">
                  <div className="rm-form-group">
                    <label className="rm-form-label" htmlFor="edit-ram-capacity">System RAM Capacity (GB)</label>
                    <select
                      id="edit-ram-capacity"
                      className="rm-select"
                      value={editingProfile.ramCapacityGb}
                      onChange={(e) => setEditingProfile({ ...editingProfile, ramCapacityGb: Number(e.target.value) })}
                    >
                      {RAM_OPTIONS.map((r) => (
                        <option key={r.capacityGb} value={r.capacityGb}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="rm-form-group">
                    <label className="rm-form-label" htmlFor="edit-ram-config">RAM Speed, Generation & Channels</label>
                    <select
                      id="edit-ram-config"
                      className="rm-select"
                      value={editingProfile.ramConfiguration || RAM_SPEED_CONFIGS[1].label}
                      onChange={(e) => setEditingProfile({ ...editingProfile, ramConfiguration: e.target.value })}
                    >
                      {RAM_SPEED_CONFIGS.map((s) => (
                        <option key={s.id} value={s.label}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid-2">
                  <div className="rm-form-group">
                    <label className="rm-form-label" htmlFor="edit-storage-type">Primary Drive Protocol & Interface</label>
                    <select
                      id="edit-storage-type"
                      className="rm-select"
                      value={editingProfile.storageType}
                      onChange={(e) => setEditingProfile({ ...editingProfile, storageType: e.target.value })}
                    >
                      {STORAGE_OPTIONS.map((st) => (
                        <option key={st.id} value={st.label}>
                          {st.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="rm-form-group">
                    <label className="rm-form-label" htmlFor="edit-storage-capacity">Primary Drive Capacity (GB)</label>
                    <select
                      id="edit-storage-capacity"
                      className="rm-select"
                      value={editingProfile.storageCapacityGb}
                      onChange={(e) => setEditingProfile({ ...editingProfile, storageCapacityGb: Number(e.target.value) })}
                    >
                      <option value={256}>256 GB SSD (Minimal / Budget)</option>
                      <option value={512}>512 GB SSD (Entry Gaming)</option>
                      <option value={1000}>1,000 GB / 1 TB NVMe SSD (Sweetspot)</option>
                      <option value={2000}>2,000 GB / 2 TB NVMe SSD (Recommended Modern AAA)</option>
                      <option value={4000}>4,000 GB / 4 TB NVMe SSD (Enthusiast)</option>
                      <option value={8000}>8,000 GB / 8 TB High-Capacity Storage</option>
                    </select>
                  </div>
                </div>

                <div className="rm-form-group">
                  <label className="rm-form-label" htmlFor="edit-secondary-storage">Secondary Storage (Optional)</label>
                  <input
                    id="edit-secondary-storage"
                    type="text"
                    className="rm-input"
                    value={editingProfile.secondaryStorage || ''}
                    onChange={(e) => setEditingProfile({ ...editingProfile, secondaryStorage: e.target.value })}
                    placeholder="e.g. 2TB Crucial P3 Plus PCIe 4.0 NVMe, 4TB Seagate Barracuda HDD..."
                  />
                </div>
              </div>
            )}

            {/* TAB 3: PLATFORM, COOLING, PSU & DISPLAY */}
            {activeFormTab === 'platform_cooling' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="grid-2">
                  <div className="rm-form-group">
                    <label className="rm-form-label" htmlFor="edit-motherboard">Motherboard Platform / Chipset</label>
                    <select
                      id="edit-motherboard"
                      className="rm-select"
                      value={editingProfile.motherboard || 'am5-b650'}
                      onChange={(e) => setEditingProfile({ ...editingProfile, motherboard: e.target.value })}
                    >
                      {MOTHERBOARD_PRESETS.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.socket})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="rm-form-group">
                    <label className="rm-form-label" htmlFor="edit-cooling">CPU Cooling & Thermal Solution</label>
                    <select
                      id="edit-cooling"
                      className="rm-select"
                      value={editingProfile.cooling || 'aio-240'}
                      onChange={(e) => setEditingProfile({ ...editingProfile, cooling: e.target.value })}
                    >
                      {COOLING_OPTIONS.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid-2">
                  <div className="rm-form-group">
                    <label className="rm-form-label" htmlFor="edit-psu">Power Supply Unit (PSU)</label>
                    <select
                      id="edit-psu"
                      className="rm-select"
                      value={editingProfile.psu || '750w-gold'}
                      onChange={(e) => setEditingProfile({ ...editingProfile, psu: e.target.value })}
                    >
                      {PSU_OPTIONS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="rm-form-group">
                    <label className="rm-form-label" htmlFor="edit-os">Operating System</label>
                    <select
                      id="edit-os"
                      className="rm-select"
                      value={editingProfile.operatingSystem}
                      onChange={(e) => setEditingProfile({ ...editingProfile, operatingSystem: e.target.value })}
                    >
                      <option value="Windows 11 64-bit">Windows 11 64-bit (DirectStorage & Auto HDR)</option>
                      <option value="Windows 10 64-bit">Windows 10 64-bit</option>
                      <option value="SteamOS 3 / Linux (Proton)">SteamOS 3 / Linux (Valve Proton / Steam Deck)</option>
                      <option value="Bazzite / Nobara Gaming Linux">Bazzite / Nobara Gaming Linux</option>
                      <option value="macOS (CrossOver / Whisky)">macOS (CrossOver / Whisky / GPTK)</option>
                    </select>
                  </div>
                </div>

                <div className="grid-2">
                  <div className="rm-form-group">
                    <label className="rm-form-label" htmlFor="edit-resolution">Target Gaming Display Resolution</label>
                    <select
                      id="edit-resolution"
                      className="rm-select"
                      value={editingProfile.displayResolution}
                      onChange={(e) => setEditingProfile({ ...editingProfile, displayResolution: e.target.value })}
                    >
                      {RESOLUTION_PRESETS.map((res) => (
                        <option key={res.id} value={res.id}>
                          {res.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="rm-form-group">
                    <label className="rm-form-label" htmlFor="edit-refresh-rate">Display Refresh Rate (Hz)</label>
                    <select
                      id="edit-refresh-rate"
                      className="rm-select"
                      value={editingProfile.refreshRateHz || 144}
                      onChange={(e) => setEditingProfile({ ...editingProfile, refreshRateHz: Number(e.target.value) })}
                    >
                      {REFRESH_RATE_PRESETS.map((rf) => (
                        <option key={rf.hz} value={rf.hz}>
                          {rf.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="rm-form-group">
                  <label className="rm-form-label" htmlFor="edit-notes">Chassis, Airflow & Thermal Notes</label>
                  <textarea
                    id="edit-notes"
                    className="rm-textarea"
                    rows={2}
                    value={editingProfile.notes || ''}
                    onChange={(e) => setEditingProfile({ ...editingProfile, notes: e.target.value })}
                    placeholder="e.g. Lian Li O11 Dynamic with 9 intake/exhaust fans, ambient 22°C..."
                  />
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {activeFormTab !== 'core' && (
                  <button
                    type="button"
                    className="rm-btn rm-btn-secondary rm-btn-sm"
                    onClick={() => setActiveFormTab(activeFormTab === 'platform_cooling' ? 'memory_storage' : 'core')}
                  >
                    Previous Section
                  </button>
                )}
                {activeFormTab !== 'platform_cooling' && (
                  <button
                    type="button"
                    className="rm-btn rm-btn-secondary rm-btn-sm"
                    onClick={() => setActiveFormTab(activeFormTab === 'core' ? 'memory_storage' : 'platform_cooling')}
                  >
                    Next Section
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="rm-btn rm-btn-secondary"
                  onClick={() => {
                    setIsEditing(false);
                    setEditingProfile(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="rm-btn rm-btn-primary">
                  <Save size={16} />
                  <span>Save PC Profile</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Saved Profiles Grid */}
      <div>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem' }}>
          Saved System Configurations ({profiles.length})
        </h3>

        <div className="grid-2">
          {profiles.map((profile) => {
            const isActive = activeProfile?.id === profile.id;
            const cpu = estimator.resolveCpu(profile.cpuId, profile.cpuCustom);
            const gpu = estimator.resolveGpu(profile.gpuId, profile.gpuCustom);
            const mb = MOTHERBOARD_PRESETS.find((item) => item.id === profile.motherboard);

            return (
              <div
                key={profile.id}
                className={`rm-card ${isActive ? 'rm-card-glow' : ''}`}
                style={{
                  border: isActive ? '1px solid var(--accent-primary)' : '1px solid var(--border-main)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div className="rm-card-header">
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <h4 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{profile.name}</h4>
                        {isActive && (
                          <span className="rm-badge rm-badge-crimson">
                            <Check size={12} />
                            Active Rig
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {profile.formFactor === 'Laptop' ? <Laptop size={13} /> : <Monitor size={13} />}
                        <span>{profile.formFactor}</span>
                        <span>•</span>
                        <span>{profile.operatingSystem}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        className="sidebar-toggle-btn"
                        onClick={() => startEditProfile(profile)}
                        title="Edit profile"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="sidebar-toggle-btn"
                        onClick={() => duplicateProfile(profile.id)}
                        title="Duplicate profile"
                      >
                        <Copy size={14} />
                      </button>
                      {profiles.length > 1 && (
                        <button
                          className="sidebar-toggle-btn"
                          style={{ color: 'var(--color-danger)' }}
                          onClick={() => deleteProfile(profile.id)}
                          title="Delete profile"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Spec List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Cpu size={15} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                      <span style={{ color: 'var(--text-secondary)' }}>CPU:</span>
                      <strong>{cpu?.name || profile.cpuCustom || 'Custom Processor'}</strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Tv size={15} style={{ color: '#38BDF8', flexShrink: 0 }} />
                      <span style={{ color: 'var(--text-secondary)' }}>GPU:</span>
                      <strong>{gpu?.name || profile.gpuCustom || 'Custom Graphics'}</strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Layers size={15} style={{ color: '#4ADE80', flexShrink: 0 }} />
                      <span style={{ color: 'var(--text-secondary)' }}>RAM:</span>
                      <span>{profile.ramCapacityGb} GB ({profile.ramConfiguration || 'Dual Channel'})</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <HardDrive size={15} style={{ color: '#FBBF24', flexShrink: 0 }} />
                      <span style={{ color: 'var(--text-secondary)' }}>Storage:</span>
                      <span>{profile.storageCapacityGb} GB ({profile.storageType || 'NVMe SSD'})</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <Monitor size={14} style={{ flexShrink: 0 }} />
                      <span>Display: {profile.displayResolution} @ {profile.refreshRateHz || 144}Hz</span>
                      {mb && <span>• {mb.name}</span>}
                    </div>
                  </div>

                  {profile.notes && (
                    <div style={{ padding: '0.6rem 0.8rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                      {profile.notes}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem' }}>
                  {!isActive && (
                    <button
                      className="rm-btn rm-btn-primary rm-btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => setActiveProfile(profile.id)}
                    >
                      Set as Active Rig
                    </button>
                  )}
                  <button
                    className="rm-btn rm-btn-secondary rm-btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => {
                      setComparingProfileId(comparingProfileId === profile.id ? null : profile.id);
                    }}
                  >
                    <ArrowRightLeft size={13} />
                    <span>{comparingProfileId === profile.id ? 'Hide Compare' : 'Compare'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Side-by-side Profile Comparison Section */}
      {comparingProfileId && compareTarget && activeProfile && (
        <div className="rm-card" style={{ border: '1px solid #38BDF8' }}>
          <div className="rm-card-header">
            <div className="rm-card-title">
              <ArrowRightLeft size={18} style={{ color: '#38BDF8' }} />
              <span>Rig Comparison: {activeProfile.name} vs. {compareTarget.name}</span>
            </div>
            <button
              className="rm-btn rm-btn-secondary rm-btn-sm"
              onClick={() => setComparingProfileId(null)}
            >
              Close
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-main)', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>Specification</th>
                  <th style={{ padding: '0.75rem', color: 'var(--accent-hover)' }}>{activeProfile.name} (Active)</th>
                  <th style={{ padding: '0.75rem', color: '#38BDF8' }}>{compareTarget.name}</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>Form Factor</td>
                  <td style={{ padding: '0.75rem' }}>{activeProfile.formFactor}</td>
                  <td style={{ padding: '0.75rem' }}>{compareTarget.formFactor}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>Processor (CPU)</td>
                  <td style={{ padding: '0.75rem', fontWeight: 600 }}>{estimator.resolveCpu(activeProfile.cpuId, activeProfile.cpuCustom)?.name || 'Custom Processor'}</td>
                  <td style={{ padding: '0.75rem', fontWeight: 600 }}>{estimator.resolveCpu(compareTarget.cpuId, compareTarget.cpuCustom)?.name || 'Custom Processor'}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>Graphics (GPU)</td>
                  <td style={{ padding: '0.75rem', fontWeight: 600 }}>{estimator.resolveGpu(activeProfile.gpuId, activeProfile.gpuCustom)?.name || 'Custom Graphics'}</td>
                  <td style={{ padding: '0.75rem', fontWeight: 600 }}>{estimator.resolveGpu(compareTarget.gpuId, compareTarget.gpuCustom)?.name || 'Custom Graphics'}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>RAM Capacity & Config</td>
                  <td style={{ padding: '0.75rem' }}>{activeProfile.ramCapacityGb} GB ({activeProfile.ramConfiguration || 'Standard'})</td>
                  <td style={{ padding: '0.75rem' }}>{compareTarget.ramCapacityGb} GB ({compareTarget.ramConfiguration || 'Standard'})</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>Primary Storage</td>
                  <td style={{ padding: '0.75rem' }}>{activeProfile.storageCapacityGb} GB {activeProfile.storageType}</td>
                  <td style={{ padding: '0.75rem' }}>{compareTarget.storageCapacityGb} GB {compareTarget.storageType}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>Target Display</td>
                  <td style={{ padding: '0.75rem' }}>{activeProfile.displayResolution} @ {activeProfile.refreshRateHz || 144}Hz</td>
                  <td style={{ padding: '0.75rem' }}>{compareTarget.displayResolution} @ {compareTarget.refreshRateHz || 144}Hz</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>Operating System</td>
                  <td style={{ padding: '0.75rem' }}>{activeProfile.operatingSystem}</td>
                  <td style={{ padding: '0.75rem' }}>{compareTarget.operatingSystem}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPcPage;
