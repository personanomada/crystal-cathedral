import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import { useStore } from '../store/useStore'
import { CONFIG, THEMES, THEME_ORDER, ColorTheme } from '../config'

function getActiveThemeColors(themeKey: string, elapsed: number): ColorTheme {
  if (themeKey !== 'auto') {
    return THEMES[themeKey]
  }
  const cycleDuration = CONFIG.session.themeCycleDuration
  const progress = (elapsed % cycleDuration) / cycleDuration
  const totalThemes = THEME_ORDER.length
  const exactIndex = progress * totalThemes
  const fromIndex = Math.floor(exactIndex) % totalThemes
  const toIndex = (fromIndex + 1) % totalThemes
  const t = exactIndex - Math.floor(exactIndex)
  const from = THEMES[THEME_ORDER[fromIndex]]
  const to = THEMES[THEME_ORDER[toIndex]]
  return {
    name: 'auto',
    crystal: from.crystal.clone().lerp(to.crystal, t),
    emissive: from.emissive.clone().lerp(to.emissive, t),
    lights: from.lights.map((c, i) => c.clone().lerp(to.lights[i], t)),
    mandala: from.mandala.clone().lerp(to.mandala, t),
    particle: from.particle.clone().lerp(to.particle, t),
  }
}

export { getActiveThemeColors }

export function LightingRig() {
  const lightsRef = useRef<THREE.PointLight[]>([])
  const ambientRef = useRef<THREE.AmbientLight>(null)
  const lightPositions = useMemo(
    () => [
      new THREE.Vector3(-4, 2, -3),
      new THREE.Vector3(4, 4, -2),
      new THREE.Vector3(-3, 6, 3),
      new THREE.Vector3(3, 0, 4),
      // Two additional ceiling vault lights
      new THREE.Vector3(0, 9, -2),
      new THREE.Vector3(0, 10, 2),
    ],
    [],
  )

  useFrame(() => {
    const { sessionDepth } = useStore.getState().presence
    const elapsed = useStore.getState().sessionElapsed
    const themeKey = useStore.getState().settings.theme
    const theme = getActiveThemeColors(themeKey, elapsed)
    if (ambientRef.current) {
      ambientRef.current.intensity = 0.08 + sessionDepth * 0.1
    }
    lightsRef.current.forEach((light, i) => {
      if (!light) return
      light.color.copy(theme.lights[i % theme.lights.length])
      light.intensity = 1.0 + sessionDepth * 4
    })
  })

  return (
    <>
      <ambientLight ref={ambientRef} intensity={0.08} />
      {lightPositions.map((pos, i) => (
        <pointLight
          key={i}
          ref={(el) => {
            if (el) lightsRef.current[i] = el
          }}
          position={pos}
          intensity={1.0}
          distance={25}
          decay={2}
        />
      ))}
      <Environment preset="sunset" environmentIntensity={0.5} background={false} />
    </>
  )
}
