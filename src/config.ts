import * as THREE from 'three'

export interface ColorTheme {
  name: string
  crystal: THREE.Color
  emissive: THREE.Color
  lights: THREE.Color[]
  mandala: THREE.Color
  particle: THREE.Color
}

export const THEMES: Record<string, ColorTheme> = {
  amethyst: {
    name: 'Amethyst',
    crystal: new THREE.Color('#6c5ce7'),
    emissive: new THREE.Color('#a29bfe'),
    lights: [
      new THREE.Color('#6c5ce7'),
      new THREE.Color('#a29bfe'),
      new THREE.Color('#e84393'),
      new THREE.Color('#6c5ce7'),
    ],
    mandala: new THREE.Color('#ffeaa7'),
    particle: new THREE.Color('#a29bfe'),
  },
  celestial: {
    name: 'Celestial',
    crystal: new THREE.Color('#0984e3'),
    emissive: new THREE.Color('#74b9ff'),
    lights: [
      new THREE.Color('#0984e3'),
      new THREE.Color('#74b9ff'),
      new THREE.Color('#00cec9'),
      new THREE.Color('#0984e3'),
    ],
    mandala: new THREE.Color('#dfe6e9'),
    particle: new THREE.Color('#74b9ff'),
  },
  rose: {
    name: 'Rose',
    crystal: new THREE.Color('#e84393'),
    emissive: new THREE.Color('#fd79a8'),
    lights: [
      new THREE.Color('#e84393'),
      new THREE.Color('#fd79a8'),
      new THREE.Color('#ffeaa7'),
      new THREE.Color('#fab1a0'),
    ],
    mandala: new THREE.Color('#ffeaa7'),
    particle: new THREE.Color('#fd79a8'),
  },
  citrine: {
    name: 'Citrine',
    crystal: new THREE.Color('#e17055'),
    emissive: new THREE.Color('#fdcb6e'),
    lights: [
      new THREE.Color('#e17055'),
      new THREE.Color('#fdcb6e'),
      new THREE.Color('#ffeaa7'),
      new THREE.Color('#e17055'),
    ],
    mandala: new THREE.Color('#ffeaa7'),
    particle: new THREE.Color('#fdcb6e'),
  },
}

export const THEME_ORDER = ['amethyst', 'celestial', 'rose', 'citrine'] as const

export const CONFIG = {
  cathedral: {
    radiusX: 6,
    radiusY: 12.5,
    subdivisions: 64,
  },
  breathing: {
    slow: 10,
    medium: 8,
    fast: 6,
  },
  session: {
    arcDuration: 20 * 60,
    themeCycleDuration: 8 * 60,
  },
  reactivity: {
    stillnessThreshold: 0.1,
    stillnessSmoothingWindow: 3,
    focusBuildDelay: 2,
    focusSphereRadius: 0.5,
  },
  locomotion: {
    maxDriftSpeed: 0.3,
    boundaryDistance: 2,
  },
  interaction: {
    crystalTouchRadius: 0.3,
    rippleRadius: 2,
    rippleDuration: 1.5,
    gazeFocusDelay: 2,
  },
  quality: {
    high: { fpsThreshold: 80, heroCount: 15, bloomRes: 0.5, particles: 3 },
    medium: { fpsThreshold: 65, heroCount: 8, bloomRes: 0.25, particles: 2 },
    low: { fpsThreshold: 0, heroCount: 3, bloomRes: 0, particles: 1 },
    downgradeDelay: 4,
    upgradeDelay: 10,
    hysteresis: 5,
  },
  mandala: {
    diameter: 4,
    stages: ['seed', 'flower', 'metatron', 'sriYantra'] as const,
    morphDuration: 45,
    stageColors: [
      new THREE.Color('#ffeaa7'),
      new THREE.Color('#a29bfe'),
      new THREE.Color('#fd79a8'),
      new THREE.Color('#55efc4'),
    ],
  },
} as const
