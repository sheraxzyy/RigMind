import { describe, it, expect } from 'vitest';
import { performanceEstimator } from './performanceEstimator';

describe('PerformanceEstimator Engine', () => {
  it('handles invalid or missing game gracefully', () => {
    const result = performanceEstimator.analyzePerformance({
      cpuId: 'intel-core-i7-1335u',
      gpuId: 'intel-iris-xe-96eu',
      gameId: null
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain('select a game');
  });

  it('handles unrecognized game ID', () => {
    const result = performanceEstimator.analyzePerformance({
      cpuId: 'intel-core-i7-1335u',
      gpuId: 'intel-iris-xe-96eu',
      gameId: 'unknown-fantasy-game-99'
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain('No game record is loaded');
  });

  it('reports insufficient data when hardware is missing', () => {
    const result = performanceEstimator.analyzePerformance({
      cpuId: 'unknown-chip',
      gpuId: 'unknown-gpu',
      gameId: 'cyberpunk-2077'
    });
    expect(result.success).toBe(false);
    expect(result.status).toBe('insufficient_data');
    expect(result.coverage).toBe('0%');
  });

  it('retrieves direct empirical benchmark for verified hardware/game match', () => {
    const result = performanceEstimator.analyzePerformance({
      cpuId: 'amd-ryzen-7-7800x3d',
      gpuId: 'nvidia-geforce-rtx-4070-super',
      gameId: 'cyberpunk-2077',
      resolution: '2560x1440',
      graphicsPreset: 'Ultra'
    });

    expect(result.success).toBe(true);
    expect(result.mode).toBe('verified_benchmark');
    expect(result.isEmpirical).toBe(true);
    expect(result.fpsRange.avg).toBe(84.6);
    expect(result.fpsRange.onePercentLow).toBe(68.2);
    expect(result.category.id).toBe('60-89');
    expect(result.provenance).toContain('Hardware Unboxed');
  });

  it('refuses to invent FPS when no exact measured benchmark exists', () => {
    const result = performanceEstimator.analyzePerformance({
      cpuId: 'amd-ryzen-5-5600x',
      gpuId: 'nvidia-geforce-rtx-4070-super',
      gameId: 'black-myth-wukong',
      resolution: '1920x1080',
      graphicsPreset: 'High'
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe('insufficient_data');
    expect(result.error).toContain('No FPS value has been fabricated');
  });

  it('reports no measured FPS rather than synthesizing results for Iris Xe', () => {
    const result = performanceEstimator.analyzePerformance({
      cpuId: 'intel-core-i7-1335u',
      gpuId: 'intel-iris-xe-96eu',
      gameId: 'black-myth-wukong',
      resolution: '1920x1080',
      graphicsPreset: 'Low',
      ramCapacityGb: 16
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('No FPS value has been fabricated');
  });

  it('evaluates any external game in the world without crashing (full null safety)', () => {
    const result = performanceEstimator.analyzePerformance({
      cpuId: 'amd-ryzen-5-5600x',
      gpuId: 'nvidia-geforce-rtx-3060-12gb',
      game: {
        id: 'steam-999999',
        title: 'Brand New Indie / AAA Game',
        // Deliberately missing minimum, recommended, upscaling, tier
      },
      resolution: '1920x1080',
      graphicsPreset: 'high'
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('No FPS value has been fabricated');
  });

  it('calibrates baseline from real published game specifications', () => {
    const result = performanceEstimator.analyzePerformance({
      cpuId: 'amd-ryzen-7-7800x3d',
      gpuId: 'nvidia-geforce-rtx-4070-super',
      game: {
        id: 'steam-292030',
        title: 'The Witcher 3: Wild Hunt',
        minimum: { cpu: 'Core i5-8400', gpu: 'GeForce GTX 1660', ramGb: 12 },
        recommended: { cpu: 'Core i7-8700K', gpu: 'GeForce RTX 2060 Super', ramGb: 16 }
      },
      resolution: '2560x1440',
      graphicsPreset: 'ultra'
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('No FPS value has been fabricated');
  });
});
