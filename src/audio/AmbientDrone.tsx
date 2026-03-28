import { useEffect, useRef } from 'react'
import * as Tone from 'tone'
import { useStore } from '../store/useStore'

export function AmbientDrone() {
  const isActive = useStore((s) => s.settings.audioMode === 'drone')
  const volume = useStore((s) => s.settings.volume)
  const synthRef = useRef<Tone.PolySynth | null>(null)
  const reverbRef = useRef<Tone.Reverb | null>(null)
  const filterRef = useRef<Tone.AutoFilter | null>(null)

  useEffect(() => {
    if (!isActive) {
      synthRef.current?.releaseAll()
      return
    }
    const setupDrone = async () => {
      await Tone.start()
      const reverb = new Tone.Reverb({ decay: 10, wet: 0.8 }).toDestination()
      const filter = new Tone.AutoFilter({
        frequency: 0.05,
        baseFrequency: 100,
        octaves: 4,
      })
        .connect(reverb)
        .start()
      const synth = new Tone.PolySynth(Tone.FMSynth, {
        volume: -20,
        envelope: { attack: 4, decay: 2, sustain: 0.8, release: 8 },
        modulationIndex: 2,
        harmonicity: 1.5,
      }).connect(filter)
      reverbRef.current = reverb
      filterRef.current = filter
      synthRef.current = synth
      synth.triggerAttack(['C2', 'G2', 'C3', 'E3'])
    }
    setupDrone()
    return () => {
      synthRef.current?.releaseAll()
      synthRef.current?.dispose()
      filterRef.current?.dispose()
      reverbRef.current?.dispose()
    }
  }, [isActive])

  useEffect(() => {
    if (synthRef.current) {
      synthRef.current.volume.value = -30 + volume * 20
    }
  }, [volume])

  return null
}
