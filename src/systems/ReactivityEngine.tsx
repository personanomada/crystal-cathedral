import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../store/useStore'
import { ExponentialSmoother, RollingAverage } from '../utils/smoothing'
import { CONFIG } from '../config'

export function ReactivityEngine() {
  const { camera } = useThree()
  const stillnessSmoother = useRef(new ExponentialSmoother(0, 1.5))
  const focusSmoother = useRef(new ExponentialSmoother(0, 2))
  const engagementSmoother = useRef(new ExponentialSmoother(0, 1))
  const lastHeadQuat = useRef(new THREE.Quaternion())
  const headVelocityAvg = useRef(new RollingAverage(CONFIG.reactivity.stillnessSmoothingWindow))
  const lastGazeHit = useRef(new THREE.Vector3())
  const gazeStableTime = useRef(0)
  const sessionStartTime = useRef<number | null>(null)
  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1)
    if (sessionStartTime.current === null) sessionStartTime.current = state.clock.elapsedTime
    const elapsed = state.clock.elapsedTime - sessionStartTime.current
    useStore.getState().setSessionElapsed(elapsed)

    const sessionMode = useStore.getState().settings.sessionMode
    const arcDuration = CONFIG.session.arcDuration
    let sessionDepth: number
    if (sessionMode === 'arc') {
      const progress = (elapsed % arcDuration) / arcDuration
      if (progress < 0.75) { sessionDepth = progress / 0.75 }
      else { sessionDepth = 1 - ((progress - 0.75) / 0.25) * 0.8 }
    } else {
      sessionDepth = Math.min(1, elapsed / (arcDuration * 0.75))
    }

    const currentQuat = camera.quaternion.clone()
    const angularDiff = lastHeadQuat.current.angleTo(currentQuat)
    const angularVelocity = dt > 0 ? angularDiff / dt : 0
    lastHeadQuat.current.copy(currentQuat)
    const avgVelocity = headVelocityAvg.current.push(angularVelocity)
    const rawStillness = avgVelocity < CONFIG.reactivity.stillnessThreshold
      ? 1 : Math.max(0, 1 - (avgVelocity - CONFIG.reactivity.stillnessThreshold) * 5)
    const stillness = stillnessSmoother.current.update(rawStillness, dt)

    const gazeDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion)
    const gazePoint = camera.position.clone().add(gazeDir.multiplyScalar(5))
    if (gazePoint.distanceTo(lastGazeHit.current) < CONFIG.reactivity.focusSphereRadius) {
      gazeStableTime.current += dt
    } else { gazeStableTime.current = 0 }
    lastGazeHit.current.copy(gazePoint)
    const rawFocus = gazeStableTime.current > CONFIG.reactivity.focusBuildDelay
      ? Math.min(1, (gazeStableTime.current - CONFIG.reactivity.focusBuildDelay) / 5) : 0
    const focus = focusSmoother.current.update(rawFocus, dt)

    const rawEngagement = 1 - rawStillness
    const engagement = engagementSmoother.current.update(rawEngagement, dt)

    useStore.getState().setPresence({ stillness, focus, engagement, sessionDepth })
  })

  return null
}
