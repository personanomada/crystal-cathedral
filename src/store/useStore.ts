import { create } from 'zustand'

export type AudioMode = 'drone' | 'lofi' | 'nature' | 'spatialFx'
export type LocomotionMode = 'gaze' | 'teleport' | 'static'
export type SessionMode = 'arc' | 'freeform'
export type QualityTier = 'high' | 'medium' | 'low'
export type QualityOverride = 'auto' | QualityTier
export type BreathingSpeed = 'slow' | 'medium' | 'fast'
export type ThemeKey = 'auto' | 'amethyst' | 'celestial' | 'rose' | 'citrine'
export type MandalaStage = 'seed' | 'flower' | 'metatron' | 'sriYantra'

interface PresenceState {
  stillness: number
  focus: number
  engagement: number
  sessionDepth: number
}

interface Settings {
  audioMode: AudioMode
  volume: number
  crystalSounds: boolean
  theme: ThemeKey
  breathingSpeed: BreathingSpeed
  locomotion: LocomotionMode
  sessionMode: SessionMode
  qualityOverride: QualityOverride
}

interface Store {
  presence: PresenceState
  setPresence: (p: Partial<PresenceState>) => void
  qualityTier: QualityTier
  setQualityTier: (tier: QualityTier) => void
  mandalaStage: MandalaStage
  mandalaProgress: number
  setMandalaStage: (stage: MandalaStage) => void
  setMandalaProgress: (p: number) => void
  breathPhase: number
  setBreathPhase: (p: number) => void
  sessionElapsed: number
  setSessionElapsed: (t: number) => void
  introComplete: boolean
  setIntroComplete: (v: boolean) => void
  settings: Settings
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void
}

export const useStore = create<Store>()((set) => ({
  presence: { stillness: 0, focus: 0, engagement: 0, sessionDepth: 0 },
  setPresence: (p) =>
    set((s) => ({ presence: { ...s.presence, ...p } })),
  qualityTier: 'high',
  setQualityTier: (tier) => set({ qualityTier: tier }),
  mandalaStage: 'seed',
  mandalaProgress: 0,
  setMandalaStage: (stage) => set({ mandalaStage: stage }),
  setMandalaProgress: (p) => set({ mandalaProgress: p }),
  breathPhase: 0,
  setBreathPhase: (p) => set({ breathPhase: p }),
  sessionElapsed: 0,
  setSessionElapsed: (t) => set({ sessionElapsed: t }),
  introComplete: false,
  setIntroComplete: (v) => set({ introComplete: v }),
  settings: {
    audioMode: 'drone',
    volume: 0.65,
    crystalSounds: true,
    theme: 'auto',
    breathingSpeed: 'medium',
    locomotion: 'gaze',
    sessionMode: 'arc',
    qualityOverride: 'auto',
  },
  setSetting: (key, value) =>
    set((s) => ({ settings: { ...s.settings, [key]: value } })),
}))
