import React from 'react'
import { useStore } from '../store/useStore'
import type {
  AudioMode,
  LocomotionMode,
  SessionMode,
  QualityOverride,
  BreathingSpeed,
  ThemeKey,
} from '../store/useStore'

const buttonStyle = (active: boolean): React.CSSProperties => ({
  padding: '4px 8px',
  fontSize: '11px',
  background: active ? '#6c5ce7' : '#2d2d44',
  color: active ? '#fff' : '#b2bec3',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
})

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '8px' }}>
      <div
        style={{
          fontSize: '10px',
          color: '#636e72',
          textTransform: 'uppercase',
          marginBottom: '3px',
        }}
      >
        {label}
      </div>
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>{children}</div>
    </div>
  )
}

export function DesktopOverlay() {
  const settings = useStore((s) => s.settings)
  const setSetting = useStore((s) => s.setSetting)
  const qualityTier = useStore((s) => s.qualityTier)
  const presence = useStore((s) => s.presence)
  const mandalaStage = useStore((s) => s.mandalaStage)

  return (
    <div
      style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        background: 'rgba(13, 13, 26, 0.9)',
        borderRadius: '12px',
        padding: '12px',
        color: '#dfe6e9',
        fontSize: '12px',
        width: '220px',
        zIndex: 10,
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(108, 92, 231, 0.3)',
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '10px', textAlign: 'center' }}>
        Settings
      </div>
      <SettingRow label="Audio">
        {(['drone', 'lofi', 'nature', 'spatialFx'] as AudioMode[]).map((m) => (
          <button
            key={m}
            style={buttonStyle(settings.audioMode === m)}
            onClick={() => setSetting('audioMode', m)}
          >
            {m === 'spatialFx' ? 'FX' : m}
          </button>
        ))}
      </SettingRow>
      <SettingRow label="Volume">
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={settings.volume}
          onChange={(e) => setSetting('volume', parseFloat(e.target.value))}
          style={{ width: '100%' }}
        />
      </SettingRow>
      <SettingRow label="Crystal Sounds">
        <button
          style={buttonStyle(settings.crystalSounds)}
          onClick={() => setSetting('crystalSounds', !settings.crystalSounds)}
        >
          {settings.crystalSounds ? 'ON' : 'OFF'}
        </button>
      </SettingRow>
      <SettingRow label="Theme">
        {(['auto', 'amethyst', 'celestial', 'rose', 'citrine'] as ThemeKey[]).map((t) => (
          <button
            key={t}
            style={buttonStyle(settings.theme === t)}
            onClick={() => setSetting('theme', t)}
          >
            {t}
          </button>
        ))}
      </SettingRow>
      <SettingRow label="Breathing">
        {(['slow', 'medium', 'fast'] as BreathingSpeed[]).map((s) => (
          <button
            key={s}
            style={buttonStyle(settings.breathingSpeed === s)}
            onClick={() => setSetting('breathingSpeed', s)}
          >
            {s}
          </button>
        ))}
      </SettingRow>
      <SettingRow label="Movement">
        {(['gaze', 'teleport', 'static'] as LocomotionMode[]).map((m) => (
          <button
            key={m}
            style={buttonStyle(settings.locomotion === m)}
            onClick={() => setSetting('locomotion', m)}
          >
            {m}
          </button>
        ))}
      </SettingRow>
      <SettingRow label="Session">
        {(['arc', 'freeform'] as SessionMode[]).map((m) => (
          <button
            key={m}
            style={buttonStyle(settings.sessionMode === m)}
            onClick={() => setSetting('sessionMode', m)}
          >
            {m}
          </button>
        ))}
      </SettingRow>
      <SettingRow label="Quality">
        {(['auto', 'high', 'medium', 'low'] as QualityOverride[]).map((q) => (
          <button
            key={q}
            style={buttonStyle(settings.qualityOverride === q)}
            onClick={() => setSetting('qualityOverride', q)}
          >
            {q}
          </button>
        ))}
      </SettingRow>
      <div
        style={{
          borderTop: '1px solid #2d2d44',
          paddingTop: '8px',
          marginTop: '8px',
          fontSize: '10px',
          color: '#636e72',
        }}
      >
        <div>
          Quality: {qualityTier} | Mandala: {mandalaStage}
        </div>
        <div>
          Depth: {presence.sessionDepth.toFixed(2)} | Still:{' '}
          {presence.stillness.toFixed(2)}
        </div>
        <div>
          Focus: {presence.focus.toFixed(2)} | Engage:{' '}
          {presence.engagement.toFixed(2)}
        </div>
      </div>
    </div>
  )
}
