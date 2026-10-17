/**
 * RigMind Compatibility & Upgrade Intelligence Service
 * 
 * Accurately analyzes component upgrades, platform compatibility constraints,
 * power envelopes, socket mismatches, and laptop physical limitations.
 * Never claims 100% compatibility when critical motherboard or PSU telemetry is unverified.
 */

import { CPU_DATABASE, GPU_DATABASE } from '../data/hardware';

export const UPGRADE_GOALS = [
  { id: 'higher-fps', label: 'Higher FPS in Current Games', icon: 'Zap' },
  { id: 'higher-resolution', label: 'Step Up Resolution (1080p -> 1440p / 4K)', icon: 'Tv' },
  { id: 'smoother-frametimes', label: 'Eliminate Stutters / Better 1% Lows', icon: 'Activity' },
  { id: 'streaming-content', label: 'Game Streaming & Content Creation', icon: 'Radio' },
  { id: 'future-proofing', label: 'Future-Proofing for Upcoming AAA Releases', icon: 'ShieldCheck' }
];

export const UPGRADE_BUDGET_TIERS = [
  { id: 'budget-200', label: '$150 – $300 (Targeted Boost / Storage / RAM)', min: 150, max: 300 },
  { id: 'mid-500', label: '$350 – $600 (GPU or Platform Upgrade)', min: 350, max: 600 },
  { id: 'enthusiast-1000', label: '$700 – $1,200 (Major Transformation)', min: 700, max: 1200 },
  { id: 'extreme-1500', label: '$1,500+ (High-End Overhaul / New Build)', min: 1500, max: 3000 }
];

class CompatibilityService {
  /**
   * Evaluates upgrade feasibility for a given profile and goal
   */
  evaluateUpgradePlan(profile, goalId, _budgetTierId) {
    const isLaptop = profile.formFactor === 'Laptop';
    const gpu = GPU_DATABASE.find((g) => g.id === profile.gpuId);

    const issues = [];
    const warnings = [];
    const requiredChecklist = [];
    const recommendations = [];

    // 1. LAPTOP CONSTRAINTS
    if (isLaptop) {
      issues.push({
        severity: 'critical',
        component: 'Form Factor (Laptop)',
        message: 'Laptops feature soldered processors (BGA socket) and proprietary motherboard-integrated GPUs. You CANNOT replace the CPU or GPU individually.'
      });
      warnings.push({
        severity: 'warning',
        component: 'Chassis & Thermal Envelope',
        message: 'Laptop cooling assemblies and power bricks (typically 45W-100W on thin-and-lights) are strictly engineered for factory components. Upgrades are strictly limited to compatible M.2 NVMe storage and SODIMM RAM (if not soldered).'
      });

      requiredChecklist.push('Inspect laptop maintenance manual to confirm if RAM is socketed (SODIMM) or permanently soldered (LPDDR5/BGA)');
      requiredChecklist.push('Verify available secondary M.2 NVMe slot for storage expansion without replacing boot OS drive');
      requiredChecklist.push('If seeking significantly higher gaming FPS, consider an eGPU enclosure (Thunderbolt 4 / USB4 required) or saving toward a dedicated desktop rig');

      if (profile.ramCapacityGb < 16) {
        recommendations.push({
          priority: 1,
          type: 'RAM',
          title: 'Upgrade System RAM to 16GB (Dual Channel)',
          estCostRange: '$35 - $60',
          rationale: 'Integrated Iris Xe graphics relies on system memory for VRAM. Dual-channel memory increases graphics memory bandwidth by up to 50-70%, directly improving 1% low frametimes in esports titles.',
          feasibility: 'Subject to SODIMM slot presence'
        });
      }

      recommendations.push({
        priority: 2,
        type: 'Storage',
        title: 'High-Speed Gen4 NVMe SSD Upgrade (1TB - 2TB)',
        estCostRange: '$75 - $130',
        rationale: 'Modern games like Cyberpunk and Baldur’s Gate 3 mandate high asset streaming bandwidth to eliminate geometry pop-in and hitching.',
        feasibility: 'High'
      });

      return {
        feasible: false,
        isLaptopRestricted: true,
        bottleneck: 'Form factor hardware lock (Soldered CPU/GPU)',
        issues,
        warnings,
        requiredChecklist,
        recommendations
      };
    }

    // 2. DESKTOP ANALYSIS
    // Goal: Higher Resolution
    if (goalId === 'higher-resolution') {
      recommendations.push({
        priority: 1,
        type: 'GPU',
        title: 'Target 12GB+ Dedicated Modern GPU (e.g. RTX 4070 SUPER / RX 7800 XT)',
        estCostRange: '$500 - $600',
        rationale: 'Stepping up to 1440p increases pixel load by 77%, and 4K quadruples it. Resolution scaling is primarily GPU and VRAM bandwidth bound.',
        candidateComponents: ['nvidia-geforce-rtx-4070-super', 'amd-radeon-rx-7800-xt']
      });

      requiredChecklist.push('Verify Power Supply Unit (PSU) rated output is at least 650W - 750W 80-Plus Gold');
      requiredChecklist.push('Check PCIe power connectors (e.g., 12VHPWR 16-pin or dual 8-pin PCIe cables)');
      requiredChecklist.push('Measure PC Case internal clearance: ensure at least 280mm - 310mm GPU length clearance');
    } else if (goalId === 'smoother-frametimes') {
      recommendations.push({
        priority: 1,
        type: 'CPU / Platform',
        title: 'High L3 Cache Gaming CPU (e.g. AMD Ryzen 7 7800X3D or 5700X3D)',
        estCostRange: '$220 - $380',
        rationale: '1% low dips and micro-stutters in open-world games and competitive shooters are almost always caused by CPU memory latency and thread starvation.',
        candidateComponents: ['amd-ryzen-7-7800x3d', 'amd-ryzen-5-5600x']
      });

      requiredChecklist.push('Verify Motherboard Socket compatibility (AM4 vs AM5; LGA1700 requires matching Intel board)');
      requiredChecklist.push('Ensure Motherboard BIOS is flashed to latest version before installing newer generation CPUs');
      requiredChecklist.push('Check CPU Cooler thermal dissipation rating (TDP clearance for 120W+ sustained load)');
    } else {
      // General or FPS boost
      recommendations.push({
        priority: 1,
        type: 'GPU',
        title: 'GPU Generation Leap (RTX 4060 / RX 6600 for Budget, or RTX 4070 SUPER for High FPS)',
        estCostRange: '$280 - $590',
        rationale: 'Directly multiplies render throughput and unlocks modern upscalers (DLSS 3 / FSR 3 Frame Generation).',
        candidateComponents: ['nvidia-geforce-rtx-4060-8gb', 'nvidia-geforce-rtx-4070-super', 'amd-radeon-rx-6600']
      });

      if (profile.ramCapacityGb < 32) {
        recommendations.push({
          priority: 2,
          type: 'RAM',
          title: 'Upgrade to 32GB Dual-Channel Kit (DDR4-3200 or DDR5-6000)',
          estCostRange: '$60 - $110',
          rationale: 'Prevents pagefile swapping during heavy titles with background applications (Discord, browser, recording).',
          candidateComponents: []
        });
      }
    }

    // Power check
    warnings.push({
      severity: 'notice',
      component: 'Power Delivery & Thermals',
      message: 'When pairing high-tier GPUs with multi-core CPUs, transient power spikes can trip budget power supplies. Check your PSU 12V rail rating.'
    });

    requiredChecklist.push('Confirm exact motherboard model and revision from system BIOS or diagnostic tools (CPU-Z/HWiNFO)');
    requiredChecklist.push('Inspect case fan orientation: ensure positive air pressure and adequate exhaust over VRMs');

    return {
      feasible: true,
      isLaptopRestricted: false,
      bottleneck: (gpu && gpu.relativeGpuPower < 50) ? 'GPU Render Throughput' : 'System Configuration Balancing',
      issues,
      warnings,
      requiredChecklist,
      recommendations
    };
  }

  /**
   * Compares component specs side-by-side
   */
  compareComponents(itemA, itemB, type = 'gpu') {
    if (!itemA || !itemB) return null;

    const prosA = [];
    const prosB = [];

    if (type === 'gpu') {
      const pA = itemA.relativeGpuPower || 0;
      const pB = itemB.relativeGpuPower || 0;

      if (pA > pB) {
        const pct = Math.round(((pA - pB) / pB) * 100);
        prosA.push(`~${pct}% higher estimated raw shader performance`);
      } else if (pB > pA) {
        const pct = Math.round(((pB - pA) / pA) * 100);
        prosB.push(`~${pct}% higher estimated raw shader performance`);
      }

      if (itemA.rayTracing && !itemB.rayTracing) {
        prosA.push('Dedicated hardware Ray Tracing acceleration cores');
      } else if (!itemA.rayTracing && itemB.rayTracing) {
        prosB.push('Dedicated hardware Ray Tracing acceleration cores');
      }

      if (itemA.vramGb && itemB.vramGb) {
        prosA.push(`Memory: ${itemA.vramGb} (${itemA.vramType || 'Shared'})`);
        prosB.push(`Memory: ${itemB.vramGb} (${itemB.vramType || 'Shared'})`);
      }
    } else {
      // CPU
      const sA = itemA.relativeSingleThread || 0;
      const sB = itemB.relativeSingleThread || 0;
      if (sA > sB) {
        prosA.push(`${Math.round(((sA - sB) / sB) * 100)}% higher single-core gaming IPC`);
      } else if (sB > sA) {
        prosB.push(`${Math.round(((sB - sA) / sA) * 100)}% higher single-core gaming IPC`);
      }

      if (itemA.socket !== itemB.socket) {
        prosA.push(`Platform socket: ${itemA.socket}`);
        prosB.push(`Platform socket: ${itemB.socket} (Different motherboard required)`);
      }
    }

    return {
      itemA,
      itemB,
      prosA,
      prosB,
      type
    };
  }
}

export const compatibilityService = new CompatibilityService();
