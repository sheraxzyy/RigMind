/**
 * RigMind Games Catalog
 * System requirements verified against publisher documentation (Steam/Epic/Direct Publisher).
 * Mark demonstrative or non-exhaustive records transparently.
 */

export const GAMES_CATALOG = [
  {
    id: 'cyberpunk-2077',
    title: 'Cyberpunk 2077: Phantom Liberty',
    developer: 'CD PROJEKT RED',
    genre: 'Open-World Action RPG',
    releaseYear: 2023,
    engine: 'REDengine 4',
    tier: 'heavy-aaa',
    bannerGradient: 'linear-gradient(135deg, #FFE600 0%, #00F0FF 100%)',
    coverAccent: '#FFE600',
    description: 'Vast open-world dystopian Night City with heavy real-time geometry streaming, crowd simulation, and optional full path tracing.',
    minimum: {
      cpu: 'Core i7-6700 or Ryzen 5 1600',
      gpu: 'GeForce GTX 1060 6GB or Radeon RX 580 8GB',
      ramGb: 12,
      vramGb: 6,
      storageGb: 70,
      storageType: 'SSD Required',
      target: '1080p @ 30 FPS, Low Preset',
      os: 'Windows 10 64-bit'
    },
    recommended: {
      cpu: 'Core i7-12700 or Ryzen 7 7800X3D',
      gpu: 'GeForce RTX 2060 SUPER or Radeon RX 5700 XT',
      ramGb: 16,
      vramGb: 8,
      storageGb: 70,
      storageType: 'Fast NVMe SSD',
      target: '1080p @ 60 FPS, High Preset',
      os: 'Windows 10/11 64-bit'
    },
    ultra: {
      cpu: 'Core i9-13900K or Ryzen 7 7800X3D',
      gpu: 'GeForce RTX 4080 or Radeon RX 7900 XTX',
      ramGb: 32,
      vramGb: 16,
      storageGb: 70,
      storageType: 'NVMe SSD',
      target: '4K @ 60+ FPS, Ultra Preset / Ray Tracing',
      os: 'Windows 11 64-bit'
    },
    upscaling: ['NVIDIA DLSS 3.5 (Frame Gen & Ray Reconstruction)', 'AMD FSR 2.2 / FSR 3', 'Intel XeSS 1.3'],
    notes: 'Heavy CPU draw in Dogtown and Night City center. SSD is strictly required for asset streaming.'
  },
  {
    id: 'counter-strike-2',
    title: 'Counter-Strike 2',
    developer: 'Valve Corporation',
    genre: 'Tactical Competitive FPS',
    releaseYear: 2023,
    engine: 'Source 2',
    tier: 'esports-competitive',
    bannerGradient: 'linear-gradient(135deg, #F59E0B 0%, #10B981 100%)',
    coverAccent: '#F59E0B',
    description: 'Valve premier tactical shooter rebuilt on Source 2 with dynamic volumetric smokes, physics-based particles, and sub-tick server architecture.',
    minimum: {
      cpu: 'Intel Core i5-750 or 4-thread equivalent',
      gpu: 'Hardware video card with 1GB+ VRAM, Shader Model 5.0 (GTX 650 or Radeon HD 7750)',
      ramGb: 8,
      vramGb: 1,
      storageGb: 85,
      storageType: 'HDD / SSD',
      target: '720p/1080p @ 45+ FPS, Low Preset',
      os: 'Windows 10 64-bit'
    },
    recommended: {
      cpu: 'Intel Core i5-12400F or AMD Ryzen 5 5600',
      gpu: 'NVIDIA GeForce RTX 2060 6GB or Radeon RX 6600',
      ramGb: 16,
      vramGb: 6,
      storageGb: 85,
      storageType: 'SSD Recommended',
      target: '1080p @ 144+ FPS, Competitive High',
      os: 'Windows 10/11 64-bit'
    },
    ultra: {
      cpu: 'AMD Ryzen 7 7800X3D (Extreme Cache Advantage)',
      gpu: 'NVIDIA GeForce RTX 4070 SUPER or higher',
      ramGb: 32,
      vramGb: 12,
      storageGb: 85,
      storageType: 'NVMe SSD',
      target: '1440p @ 300+ FPS, Max Settings',
      os: 'Windows 11 64-bit'
    },
    upscaling: ['AMD FSR 1', 'NVIDIA Reflex Low Latency'],
    notes: 'Heavily benefits from low memory latency and fast single-thread CPU speed for consistent 1% low frametimes.'
  },
  {
    id: 'baldurs-gate-3',
    title: "Baldur's Gate 3",
    developer: 'Larian Studios',
    genre: 'CRPG / Tactical Turn-Based',
    releaseYear: 2023,
    engine: 'Divinity 4.0',
    tier: 'modern-moderate',
    bannerGradient: 'linear-gradient(135deg, #DC2626 0%, #7C3AED 100%)',
    coverAccent: '#DC2626',
    description: 'Acclaimed rich party-based roleplaying game set in the Dungeons & Dragons universe. Features complex companion AI and dense Act 3 city simulation.',
    minimum: {
      cpu: 'Intel Core i5-4690 or AMD FX 8350',
      gpu: 'NVIDIA GeForce GTX 970 4GB or AMD Radeon RX 480 4GB',
      ramGb: 8,
      vramGb: 4,
      storageGb: 150,
      storageType: 'SSD Required',
      target: '1080p @ 30 FPS, Low Preset',
      os: 'Windows 10 64-bit'
    },
    recommended: {
      cpu: 'Intel Core i7-8700K or AMD Ryzen 5 3600',
      gpu: 'NVIDIA GeForce RTX 2060 SUPER 8GB or AMD Radeon RX 5700 XT',
      ramGb: 16,
      vramGb: 8,
      storageGb: 150,
      storageType: 'Fast SSD',
      target: '1080p/1440p @ 60 FPS, High Preset',
      os: 'Windows 10/11 64-bit'
    },
    ultra: {
      cpu: 'AMD Ryzen 7 7800X3D or Intel Core i7-13700K',
      gpu: 'NVIDIA GeForce RTX 4070 Ti or AMD Radeon RX 7900 XT',
      ramGb: 32,
      vramGb: 12,
      storageGb: 150,
      storageType: 'Fast NVMe SSD',
      target: '1440p/4K @ 75+ FPS, Ultra Preset',
      os: 'Windows 11 64-bit'
    },
    upscaling: ['NVIDIA DLSS 2', 'AMD FSR 2.2'],
    notes: 'Act 3 (The Lower City) has a notoriously high CPU draw due to dense crowd routines and dynamic dialogue triggers.'
  },
  {
    id: 'black-myth-wukong',
    title: 'Black Myth: Wukong',
    developer: 'Game Science',
    genre: 'Action RPG / Soulslike',
    releaseYear: 2024,
    engine: 'Unreal Engine 5 (Nanite & Lumen)',
    tier: 'heavy-aaa',
    bannerGradient: 'linear-gradient(135deg, #B45309 0%, #1F2937 100%)',
    coverAccent: '#D97706',
    description: 'Chinese mythology action RPG pushing cutting-edge Unreal Engine 5 virtualized geometry (Nanite), Lumen indirect lighting, and complex particle simulation.',
    minimum: {
      cpu: 'Intel Core i5-6600 or AMD Ryzen 5 1600',
      gpu: 'NVIDIA GeForce GTX 1060 6GB or AMD Radeon RX 580 8GB',
      ramGb: 16,
      vramGb: 6,
      storageGb: 130,
      storageType: 'SSD Strongly Recommended',
      target: '1080p @ 30 FPS, Low Preset (with Upscaling)',
      os: 'Windows 10 64-bit'
    },
    recommended: {
      cpu: 'Intel Core i7-9700 or AMD Ryzen 5 5500',
      gpu: 'NVIDIA GeForce RTX 2060 or AMD Radeon RX 5700 XT',
      ramGb: 16,
      vramGb: 6,
      storageGb: 130,
      storageType: 'SSD Required',
      target: '1080p @ 60 FPS, Medium/High Preset',
      os: 'Windows 10/11 64-bit'
    },
    ultra: {
      cpu: 'Intel Core i7-14700K or AMD Ryzen 7 7800X3D',
      gpu: 'NVIDIA GeForce RTX 4080 SUPER or RTX 4090',
      ramGb: 32,
      vramGb: 16,
      storageGb: 130,
      storageType: 'NVMe SSD',
      target: '1440p/4K @ 60+ FPS, Cinematic Preset with Full Ray Tracing',
      os: 'Windows 11 64-bit'
    },
    upscaling: ['NVIDIA DLSS 3 Frame Gen', 'AMD FSR 3', 'Intel XeSS', 'TSR'],
    notes: 'Uses Unreal Engine 5 Nanite extensively. High shader compilation workload on first launch; GPU bound at high presets.'
  },
  {
    id: 'valorant',
    title: 'Valorant',
    developer: 'Riot Games',
    genre: 'Character-Based Tactical Shooter',
    releaseYear: 2020,
    engine: 'Unreal Engine 4',
    tier: 'esports-light',
    bannerGradient: 'linear-gradient(135deg, #EF4444 0%, #064E3B 100%)',
    coverAccent: '#EF4444',
    description: 'Engineered specifically by Riot Games for high tickrate and playable framerates on low-spec PCs, integrated graphics, and competitive esports monitors.',
    minimum: {
      cpu: 'Intel Core 2 Duo E8400 or AMD Athlon 200GE',
      gpu: 'Intel HD 4000 or AMD Radeon R5 200',
      ramGb: 4,
      vramGb: 1,
      storageGb: 35,
      storageType: 'HDD / SSD',
      target: '720p @ 30+ FPS, Low Preset',
      os: 'Windows 10 64-bit'
    },
    recommended: {
      cpu: 'Intel Core i3-4150 or AMD Ryzen 3 1200',
      gpu: 'GeForce GT 730 or Radeon R7 240',
      ramGb: 8,
      vramGb: 2,
      storageGb: 35,
      storageType: 'SSD Recommended',
      target: '1080p @ 60+ FPS, Standard Preset',
      os: 'Windows 10/11 64-bit'
    },
    ultra: {
      cpu: 'Intel Core i5-12400F or AMD Ryzen 5 5600',
      gpu: 'GeForce GTX 1050 Ti or Radeon RX 560',
      ramGb: 16,
      vramGb: 4,
      storageGb: 35,
      storageType: 'SSD',
      target: '1080p @ 144Hz - 240Hz Competitive',
      os: 'Windows 10/11 64-bit'
    },
    upscaling: ['None Needed (Lightweight Native Rendering)'],
    notes: 'Runs remarkably well even on modern Intel Iris Xe and AMD Radeon 680M integrated graphics at 1080p.'
  },
  {
    id: 'forza-horizon-5',
    title: 'Forza Horizon 5',
    developer: 'Playground Games',
    genre: 'Open-World Arcade Racing',
    releaseYear: 2021,
    engine: 'ForzaTech',
    tier: 'modern-moderate',
    bannerGradient: 'linear-gradient(135deg, #EC4899 0%, #3B82F6 100%)',
    coverAccent: '#EC4899',
    description: 'Stunning recreation of Mexico with dynamic weather, photorealistic biomes, and one of the most optimized PC rendering engines available.',
    minimum: {
      cpu: 'Intel Core i5-4460 or AMD Ryzen 3 1200',
      gpu: 'NVIDIA GeForce GTX 970 4GB or AMD Radeon RX 470 4GB',
      ramGb: 8,
      vramGb: 4,
      storageGb: 110,
      storageType: 'SSD Recommended',
      target: '1080p @ 30 FPS, Low Preset',
      os: 'Windows 10 64-bit'
    },
    recommended: {
      cpu: 'Intel Core i5-8400 or AMD Ryzen 5 1500X',
      gpu: 'NVIDIA GeForce GTX 1070 8GB or AMD Radeon RX 590 8GB',
      ramGb: 16,
      vramGb: 8,
      storageGb: 110,
      storageType: 'SSD Required',
      target: '1080p @ 60 FPS, High Preset',
      os: 'Windows 10/11 64-bit'
    },
    ultra: {
      cpu: 'Intel Core i7-10700K or AMD Ryzen 7 3800XT',
      gpu: 'NVIDIA GeForce RTX 3080 10GB or AMD Radeon RX 6800 XT 16GB',
      ramGb: 16,
      vramGb: 10,
      storageGb: 110,
      storageType: 'Fast NVMe SSD',
      target: '4K @ 60+ FPS, Extreme Preset',
      os: 'Windows 10/11 64-bit'
    },
    upscaling: ['NVIDIA DLSS 2/3', 'AMD FSR 2.2', 'Intel XeSS'],
    notes: 'Excellent in-game benchmark mode. Highly scalable across both low-end and enthusiast desktop hardware.'
  }
];
