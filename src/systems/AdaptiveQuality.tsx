import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useStore } from '../store/useStore'
import { CONFIG } from '../config'
import { RollingAverage } from '../utils/smoothing'

const TIER_ORDER: ('high' | 'medium' | 'low')[] = ['high', 'medium', 'low']

export function AdaptiveQuality() {
  const fpsAvg = useRef(new RollingAverage(2, 90))
  const belowThresholdTime = useRef(0)
  const aboveThresholdTime = useRef(0)

  useFrame((_, delta) => {
    const override = useStore.getState().settings.qualityOverride
    if (override !== 'auto') { useStore.getState().setQualityTier(override); return }
    const dt = Math.min(delta, 0.1)
    const fps = dt > 0 ? 1 / dt : 90
    const avgFps = fpsAvg.current.push(fps)
    const currentTier = useStore.getState().qualityTier
    const currentIndex = TIER_ORDER.indexOf(currentTier)
    const currentThreshold = CONFIG.quality[currentTier].fpsThreshold

    if (avgFps < currentThreshold && currentIndex < TIER_ORDER.length - 1) {
      belowThresholdTime.current += dt
      aboveThresholdTime.current = 0
      if (belowThresholdTime.current > CONFIG.quality.downgradeDelay) {
        useStore.getState().setQualityTier(TIER_ORDER[currentIndex + 1])
        belowThresholdTime.current = 0
      }
    } else if (currentIndex > 0) {
      const higherTier = TIER_ORDER[currentIndex - 1]
      const upgradeThreshold = CONFIG.quality[higherTier].fpsThreshold + CONFIG.quality.hysteresis
      if (avgFps > upgradeThreshold) {
        aboveThresholdTime.current += dt
        belowThresholdTime.current = 0
        if (aboveThresholdTime.current > CONFIG.quality.upgradeDelay) {
          useStore.getState().setQualityTier(higherTier)
          aboveThresholdTime.current = 0
        }
      } else { aboveThresholdTime.current = 0; belowThresholdTime.current = 0 }
    } else { belowThresholdTime.current = 0; aboveThresholdTime.current = 0 }
  })

  return null
}
