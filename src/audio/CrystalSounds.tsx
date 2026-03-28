import { useEffect, useRef } from 'react'
import * as Tone from 'tone'
import { useFrame } from '@react-three/fiber'
import { useStore } from '../store/useStore'

const PENTATONIC = ['C', 'D', 'E', 'G', 'A']
const OCTAVES = [3, 4, 5]

export function CrystalSounds() {
  const enabled = useStore((s) => s.settings.crystalSounds)
  const volume = useStore((s) => s.settings.volume)
  const synthRef = useRef<Tone.PolySynth | null>(null)
  const lastTriggerTime = useRef(0)

  useEffect(() => {
    if (!enabled) return
    const setup = async () => {
      await Tone.start()
      const reverb = new Tone.Reverb({ decay: 6, wet: 0.7 }).toDestination()
      const synth = new Tone.PolySynth(Tone.Synth, {
        volume: -25,
        envelope: { attack: 0.5, decay: 1, sustain: 0.3, release: 3 },
        oscillator: { type: 'sine' },
      }).connect(reverb)
      synthRef.current = synth
    }
    setup()
    return () => {
      synthRef.current?.releaseAll()
      synthRef.current?.dispose()
    }
  }, [enabled])

  useEffect(() => {
    if (synthRef.current) {
      synthRef.current.volume.value = -35 + volume * 15
    }
  }, [volume])

  useFrame((state) => {
    if (!enabled || !synthRef.current) return
    const now = state.clock.elapsedTime
    if (now - lastTriggerTime.current < 3) return
    const focus = useStore.getState().presence.focus
    if (focus > 0.3) {
      const note = PENTATONIC[Math.floor(Math.random() * PENTATONIC.length)]
      const octave = OCTAVES[Math.floor(Math.random() * OCTAVES.length)]
      synthRef.current.triggerAttackRelease(`${note}${octave}`, '2n')
      lastTriggerTime.current = now
    }
  })

  return null
}
