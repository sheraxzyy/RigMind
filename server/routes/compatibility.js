import { Router } from 'express';
import { gameStore } from '../database/gameStore.js';

const router = Router();

// POST /api/pc/compatibility - Evaluate user PC hardware against published game requirements
router.post('/pc/compatibility', (req, res) => {
  try {
    const {
      gameId,
      cpuName = '',
      cpuId = '',
      gpuName = '',
      gpuId = '',
      ramCapacityGb = 16,
      storageGb = 500,
      storageType = 'SSD',
      operatingSystem = 'Windows 10 64-bit',
      displayResolution = '1920x1080',
      targetFps = 60, // 30, 60, 120
      graphicsPreference = 'High'
    } = req.body;

    const game = gameStore.getById(gameId) || gameStore.getBySlug(gameId);

    if (!game) {
      return res.status(404).json({ success: false, error: 'Game not found in database.' });
    }

    if (!game.minimum || Object.keys(game.minimum).length === 0) {
      return res.json({
        success: true,
        verdict: 'Insufficient verified data',
        verdictColor: '#A1A1AA',
        summary: 'Publisher system requirements are unavailable, so compatibility cannot be assessed.',
        components: {}
      });
    }

    const min = game.minimum;
    const rec = game.recommended || {};

    const userRam = Number(ramCapacityGb);
    const minRam = Number(min.ramGb) > 0 ? Number(min.ramGb) : null;
    const recRam = Number(rec.ramGb) > 0 ? Number(rec.ramGb) : null;
    const minStorage = Number(min.storageGb) > 0 ? Number(min.storageGb) : null;
    const recStorage = Number(rec.storageGb) > 0 ? Number(rec.storageGb) : null;

    // Component Evaluations
    const components = {
      cpu: {
        userSpec: cpuName || cpuId || 'User Processor',
        minSpec: min.cpu || 'Not published',
        recSpec: rec.cpu || 'Not published',
        status: 'not_evaluated',
        detail: 'CPU performance is not ranked against the published processor list.'
      },
      gpu: {
        userSpec: gpuName || gpuId || 'User Graphics',
        minSpec: min.gpu || 'Not published',
        recSpec: rec.gpu || 'Not published',
        status: 'not_evaluated',
        detail: 'GPU performance is not ranked against the published graphics card list.'
      },
      ram: {
        userSpec: `${userRam} GB`,
        minSpec: minRam ? `${minRam} GB` : 'Not published',
        recSpec: recRam ? `${recRam} GB` : 'Not published',
        status: !minRam ? 'not_evaluated' : userRam < minRam ? 'below_minimum' : recRam && userRam < recRam ? 'meets_minimum' : recRam ? 'meets_recommended' : 'not_evaluated',
        detail: !minRam ? 'Publisher RAM requirement is not available.' : userRam < minRam
          ? `Installed memory (${userRam} GB) is below the published minimum (${minRam} GB).`
          : recRam && userRam < recRam
          ? `Installed memory (${userRam} GB) meets the minimum but is below the published recommended capacity (${recRam} GB).`
          : recRam ? `Installed memory (${userRam} GB) meets the published recommended capacity (${recRam} GB).` : 'The publisher has no recommended RAM figure.'
      },
      storage: {
        userSpec: `${storageGb} GB (${storageType})`,
        minSpec: minStorage ? `${minStorage} GB (${min.storageType || 'type not specified'})` : 'Not published',
        recSpec: recStorage ? `${recStorage} GB (${rec.storageType || 'type not specified'})` : 'Not published',
        status: !minStorage ? 'not_evaluated' : Number(storageGb) < minStorage ? 'below_minimum' : recStorage && Number(storageGb) < recStorage ? 'meets_minimum' : recStorage ? 'meets_recommended' : 'not_evaluated',
        detail: !minStorage ? 'Publisher storage capacity is not available.' : Number(storageGb) < minStorage
          ? `Free space (${storageGb} GB) is below the published minimum (${minStorage} GB).`
          : min.storageType?.toLowerCase().includes('ssd') && storageType?.toLowerCase().includes('hdd')
          ? 'Game specifies SSD for real-time asset streaming; installing to mechanical HDD will cause asset hitching.'
          : `Free space meets the published minimum of ${minStorage} GB.`
      },
      os: {
        userSpec: operatingSystem,
        minSpec: min.os || 'Not published',
        recSpec: rec.os || 'Not published',
        status: 'not_evaluated',
        detail: 'The supplied operating system was not semantically checked against the publisher requirement.'
      }
    };

    // Determine Overall Verdict
    let verdict = 'Partial assessment';
    let verdictColor = '#A1A1AA';
    let summary = 'RAM and storage are compared only where publisher values are published. CPU, GPU, and OS are not automatically ranked.';

    if (components.ram.status === 'below_minimum' || components.storage.status === 'below_minimum') {
      verdict = 'Likely below minimum requirements';
      verdictColor = '#EF4444';
      summary = 'At least one measured capacity is below the publisher-published minimum.';
    } else if (components.ram.status === 'meets_recommended' && components.storage.status === 'meets_recommended') {
      verdict = 'RAM and storage meet recommendations';
      verdictColor = '#4ADE80';
      summary = 'Published RAM and storage recommendations are met; CPU, GPU, and OS compatibility remain unassessed.';
    } else if (components.ram.status === 'meets_minimum' || components.storage.status === 'meets_minimum') {
      verdict = 'RAM/storage meet minimum only';
      verdictColor = '#FBBF24';
      summary = 'Measured capacities meet the minimum but not all published recommended values.';
    }

    res.json({
      success: true,
      gameTitle: game.title,
      verdict,
      verdictColor,
      summary,
      targetFps,
      graphicsPreference,
      components,
      notice: 'The assessment compares only published RAM and storage capacities. CPU, GPU, and OS compatibility require manual verification.'
    });
  } catch (err) {
    console.error('[API /pc/compatibility] Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
