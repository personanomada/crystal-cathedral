interface Props {
  onEnterVR: () => void
}

export function EnterVRButton({ onEnterVR }: Props) {
  return (
    <button
      onClick={onEnterVR}
      style={{
        position: 'fixed',
        bottom: '2rem',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '1rem 2rem',
        fontSize: '1.2rem',
        zIndex: 10,
        background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        cursor: 'pointer',
        fontWeight: 'bold',
        letterSpacing: '0.05em',
        boxShadow: '0 4px 20px rgba(108, 92, 231, 0.4)',
      }}
    >
      Enter VR
    </button>
  )
}
