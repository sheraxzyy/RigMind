/**
 * RigMind Performance Estimation Engine
 * 
 * CORE PHILOSOPHY & TRANSPARENCY PRINCIPLES:
 * 1. Grounded in Verified Data: Searches empirical benchmark records first.
 * 2. Transparent Heuristic Extrapolation: When an exact match is missing,
 *    clearly tags the result as an ESTIMATE and details the assumptions made.
 * 3. Never Invent False Precision: Uses realistic ranges (e.g., 48 - 58 FPS) rather
 *    than fabricated exact figures (e.g., 53.4 FPS).
 * 4. Honest Insufficient Data Handling: Rejects estimates if inputs are invalid or unknown.
 * 5. Hardware Constraints: Accounts for laptop thermal envelopes, integrated memory bandwidth,
 *    VRAM bottlenecks, and resolution scaling factors.
 */

import { CPU_DATABASE, GPU_DATABASE } from '../data/hardware';
import { GAMES_CATALOG } from '../data/games';
import { BENCHMARKS_DATABASE, BENCHMARK_CATEGORIES } from '../data/benchmarks';

export const PERFORMANCE_CATEGORIES = {
  SUB_30: { id: 'sub-30', label: 'Below 30 FPS', badge: 'Unplayable / Severe Stutter', color: '#EF4444' },
  FPS_30_59: { id: '30-59', label: '30–59 FPS', badge: 'Playable Console-Style Target', color: '#F59E0B' },
  FPS_60_89: { id: '60-89', label: '60–89 FPS', badge: 'Smooth PC Standard (60 FPS+)', color: '#10B981' },
  FPS_90_119: { id: '90-119', label: '90–119 FPS', badge: 'High Refresh Rate Ready', color: '#06B6D4' },
  FPS_120_PLUS: { id: '120-plus', label: '120+ FPS', badge: 'Esports / Ultra Smooth', color: '#8B5CF6' }
};

export class PerformanceEstimator {
  /**
   * Main entrypoint for performance estimation.
   * Validates inputs, scans benchmark database, or applies architectural modeling.
   */
  analyzePerformance({
    cpuId,
    gpuId,
    cpuCustom = '',
    gpuCustom = '',
    ramCapacityGb = 16,
    gameId,
    game = null,
    resolution = '1920x1080',
    graphicsPreset = 'high',
    upscaling = 'none' // 'none' | 'quality' | 'balanced' | 'performance' | 'frame-gen'
  }) {
    // 1. INPUT VALIDATION
    if (!gameId && !game) {
      return {
        success: false,
        status: 'error',
        error: 'Please select a game to evaluate.'
      };
    }
    const targetGame = game || GAMES_CATALOG.find((item) => item.id === gameId);
    if (!targetGame) {
      return {
        success: false,
        status: 'insufficient_data',
        error: `No game record is loaded for "${gameId}". Load it from the game database before analyzing performance.`
      };
    }

    const cpu = this.resolveCpu(cpuId, cpuCustom);
    const gpu = this.resolveGpu(gpuId, gpuCustom);
    if (!cpu || !gpu) {
      return {
        success: false,
        status: 'insufficient_data',
        title: 'Insufficient Hardware Data',
        error: 'Select a CPU and GPU from the hardware catalog. Unknown hardware is not replaced with a generic profile.',
        coverage: '0%'
      };
    }

    const effectiveGameId = targetGame.id || gameId;
    const normalizedTitle = (targetGame.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const directMatches = BENCHMARKS_DATABASE.filter((benchmark) => {
      const benchmarkTitle = (benchmark.gameTitle || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const gameMatches = benchmark.gameId === effectiveGameId ||
        benchmark.gameId === targetGame.slug ||
        Boolean(normalizedTitle && benchmarkTitle === normalizedTitle);
      const scaling = (benchmark.upscaling || '').toLowerCase();
      const scalingMatches = upscaling === 'none'
        ? /none|native/.test(scaling)
        : upscaling === 'frame-gen'
        ? /frame\s*gen/.test(scaling)
        : scaling.includes(upscaling);

      return benchmark.verificationStatus === BENCHMARK_CATEGORIES.VERIFIED &&
        gameMatches && benchmark.cpuId === cpu.id && benchmark.gpuId === gpu.id &&
        benchmark.resolution === resolution &&
        benchmark.graphicsPreset.toLowerCase() === graphicsPreset.toLowerCase() && scalingMatches;
    });

    if (directMatches.length > 0) {
      const match = directMatches[0];
      return this._formatEmpiricalResult(match, targetGame, cpu, gpu, graphicsPreset, upscaling, ramCapacityGb);
    }

    return {
      success: false,
      status: 'insufficient_data',
      title: 'No Matching Measured Benchmark',
      error: 'There is no verified test run for this exact game, CPU, GPU, resolution, graphics preset, and upscaling mode. No FPS value has been fabricated.',
      coverage: '0%',
      gameSpecs: {
        minimum: targetGame.minimum || null,
        recommended: targetGame.recommended || null,
        source: targetGame.requirementsSource || 'Source not verified',
        sourceUrl: targetGame.sourceUrl || null,
        verification: targetGame.requirementsVerification || 'Unverified'
      },
      referenceBenchmarks: this.findBenchmarksForGame(targetGame)
    };
  }

  /**
   * Intelligently resolves any external game ID or custom title to an architectural profile
   */
  resolveGame(gameId = '', customName = '') {
    const raw = (customName || gameId || '').replace(/^steam-|^igdb-/, '').replace(/-/g, ' ').trim();
    const lower = raw.toLowerCase();
    const title = customName || raw.split(' ').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    return {
      id: gameId || `custom-${lower.replace(/\s+/g, '-')}`,
      title: title || 'Unknown Game',
      slug: lower.replace(/\s+/g, '-')
    };
  }

  /**
   * Intelligently resolves any CPU ID or custom name to an architectural profile
   */
  resolveCpu(cpuId = '', customName = '') {
    const query = (customName || cpuId || '').trim().toLowerCase();
    if (!query || query.includes('unknown')) return null;
    return CPU_DATABASE.find((cpu) =>
      cpu.id.toLowerCase() === query ||
      cpu.name.toLowerCase() === query ||
      cpu.name.toLowerCase().includes(query) ||
      query.includes(cpu.name.toLowerCase())
    ) || null;
  }

  /**
   * Intelligently resolves any GPU ID or custom name to an architectural profile
   */
  resolveGpu(gpuId = '', customName = '') {
    const query = (customName || gpuId || '').trim().toLowerCase();
    if (!query || query.includes('unknown')) return null;
    return GPU_DATABASE.find((gpu) =>
      gpu.id.toLowerCase() === query ||
      gpu.name.toLowerCase() === query ||
      gpu.name.toLowerCase().includes(query) ||
      query.includes(gpu.name.toLowerCase())
    ) || null;
  }

  /**
   * Retrieves relevant real empirical benchmarks for this game or hardware tier
   */
  findBenchmarksForGame(game) {
    const rawTitle = (game?.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const gameId = game?.id || '';
    const gameSlug = game?.slug || '';

    return BENCHMARKS_DATABASE.filter((bm) => {
      const bmTitle = (bm.gameTitle || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const isGameMatch =
        bm.gameId === gameId ||
        bm.gameId === gameSlug ||
        (rawTitle && (bmTitle.includes(rawTitle) || rawTitle.includes(bmTitle)));
      return isGameMatch && bm.verificationStatus === BENCHMARK_CATEGORIES.VERIFIED;
    }).slice(0, 4);
  }

  /**
   * Formats result when direct verified benchmark measurements exist
   */
  _formatEmpiricalResult(benchmark, game, cpu, gpu, requestedPreset, upscaling, ramGb) {
    const avgFps = benchmark.avgFps;
    const lowFps = benchmark.onePercentLowFps ?? null;

    let category = this._categorizeFps(avgFps);

    return {
      success: true,
      mode: 'verified_benchmark',
      sourceType: benchmark.verificationStatus,
      confidence: 'Exact measured configuration',
      dataCoverage: 'Exact verified benchmark match',
      isEmpirical: true,
      provenance: benchmark.provenance,
      sourceUrl: benchmark.sourceUrl,
      testDate: benchmark.testDate,
      driverVersion: benchmark.driverVersion,
      gameSpecs: {
        minimum: game?.minimum || null,
        recommended: game?.recommended || null,
        source: game?.requirementsSource || 'Source not verified',
        sourceUrl: game?.sourceUrl || null,
        verification: game?.requirementsVerification || 'Unverified'
      },
      referenceBenchmarks: this.findBenchmarksForGame(game),
      fpsRange: {
        min: Number.isFinite(benchmark.minFps) ? benchmark.minFps : null,
        avg: avgFps,
        max: Number.isFinite(benchmark.maxFps) ? benchmark.maxFps : null,
        onePercentLow: lowFps
      },
      category,
      resolutionSuitability: this._evaluateResolutionSuitability(avgFps),
      recommendedPreset: this._determineRecommendedPreset(avgFps, requestedPreset),
      constraints: this._identifyHardwareConstraints(cpu, gpu, ramGb, game),
      optimizations: this._generateOptimizationSuggestions(game, cpu, gpu, ramGb, upscaling),
      methodologyNote: `Direct test record found from ${benchmark.provenance} (${benchmark.testDate}) at ${benchmark.resolution} ${benchmark.graphicsPreset}.`
    };
  }

  /**
   * Transparent architectural model for extrapolated estimates
   * Calibrated with real developer hardware specifications & benchmark ratios
   */
  _categorizeFps(avgFps) {
    if (avgFps < 30) return PERFORMANCE_CATEGORIES.SUB_30;
    if (avgFps < 60) return PERFORMANCE_CATEGORIES.FPS_30_59;
    if (avgFps < 90) return PERFORMANCE_CATEGORIES.FPS_60_89;
    if (avgFps < 120) return PERFORMANCE_CATEGORIES.FPS_90_119;
    return PERFORMANCE_CATEGORIES.FPS_120_PLUS;
  }

  _evaluateResolutionSuitability(avgFps) {
    if (avgFps >= 60) return 'Highly Suitable (Meets or exceeds 60 FPS standard)';
    if (avgFps >= 35) return 'Conditionally Suitable (Requires lowering settings or upscaling for stability)';
    return 'Not Recommended (Severe framerate drops and frametime inconsistency expected)';
  }

  _determineRecommendedPreset(avgFps, _currentPreset) {
    if (avgFps >= 85) return 'Ultra / High (Ample headroom)';
    if (avgFps >= 60) return 'High / Medium (Optimized sweet spot)';
    if (avgFps >= 38) return 'Medium / Low (Prioritize frametime pacing)';
    return 'Low Preset + Aggressive Upscaling / 720p Render Scale';
  }

  _identifyHardwareConstraints(cpu, gpu, ramGb, game) {
    const constraints = [];
    const gpuForm = String(gpu?.formFactor || 'Desktop');
    const cpuForm = String(cpu?.formFactor || 'Desktop');

    // GPU constraints
    if (gpuForm.includes('Integrated')) {
      constraints.push({
        type: 'GPU / Memory Bandwidth',
        severity: 'critical',
        detail: 'Integrated graphics shares system DDR memory. High-resolution textures cause memory pipeline starvation.'
      });
    }

    // VRAM Check
    const vramStr = String(gpu?.vramGb || '');
    if (vramStr.includes('4 GB') && game?.tier === 'heavy-aaa') {
      constraints.push({
        type: 'VRAM Capacity',
        severity: 'warning',
        detail: '4GB VRAM buffer will overflow in modern AAA titles at High presets, causing stuttering when assets stream.'
      });
    }

    // CPU Form Factor
    if (cpuForm.includes('Laptop') && (cpu?.tdpWatts || 45) <= 28) {
      constraints.push({
        type: 'CPU Thermal & Power Envelope',
        severity: 'moderate',
        detail: `${cpu?.tdpWatts || 28}W U-series processor may throttle clocks under simultaneous sustained CPU + GPU load.`
      });
    }

    // RAM Check
    const recRam = Number(game?.recommended?.ramGb) || null;
    const minRam = Number(game?.minimum?.ramGb) || null;

    if (recRam && ramGb < recRam) {
      constraints.push({
        type: 'System RAM Capacity',
        severity: ramGb < minRam ? 'critical' : 'warning',
        detail: `${ramGb}GB installed is below the recommended ${recRam}GB. Background multitasking will trigger Windows swapfile.`
      });
    }

    return constraints;
  }

  _generateOptimizationSuggestions(game, cpu, gpu, ramGb, upscaling) {
    const tips = [];
    const gpuForm = String(gpu?.formFactor || 'Desktop');
    const cpuForm = String(cpu?.formFactor || 'Desktop');

    const upscalingSupport = Array.isArray(gpu?.upscalingSupport) ? gpu.upscalingSupport : [];
    const gameUpscaling = Array.isArray(game?.upscaling) && game.upscaling.length > 0
      ? game.upscaling.join(', ')
      : null;

    if (upscalingSupport.length > 0 && gameUpscaling && upscaling === 'none') {
      tips.push(`If supported by the title, consider its documented upscaling options: ${gameUpscaling}. Performance gains vary by title and settings.`);
    }

    if (gpuForm.includes('Integrated')) {
      tips.push('Set Volumetric Fog, Shadows, and Screen-Space Reflections to Low to ease memory bandwidth pressure.');
      tips.push('Verify Dual-Channel RAM mode in BIOS or CPU-Z; single-channel memory cuts integrated GPU framerates in half.');
    }

    if (cpuForm.includes('Laptop')) {
      tips.push('Use a laptop cooling pad or elevate the rear intake vents to minimize thermal throttling.');
      tips.push('Set Windows Power Plan to "High Performance" or manufacturer Turbo mode while plugged into AC power.');
    }

    tips.push('Cap framerate at 60 FPS or match monitor refresh rate with G-Sync/FreeSync to maintain smooth 1% lows.');
    return tips;
  }
}

export const performanceEstimator = new PerformanceEstimator();
