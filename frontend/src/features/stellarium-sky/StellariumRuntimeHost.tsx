import React from 'react'

const shellStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'grid',
  placeItems: 'center',
  padding: '48px 24px',
  background: 'radial-gradient(circle at top, #17304f 0%, #09111c 52%, #04070d 100%)',
  color: '#f3f7fb',
}

const panelStyle: React.CSSProperties = {
  width: 'min(760px, 100%)',
  padding: '40px 32px',
  borderRadius: '24px',
  border: '1px solid rgba(243, 247, 251, 0.12)',
  background: 'rgba(8, 14, 24, 0.78)',
  boxShadow: '0 24px 80px rgba(0, 0, 0, 0.35)',
}

const eyebrowStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '0.78rem',
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: '#8eb8ea',
}

const titleStyle: React.CSSProperties = {
  margin: '16px 0 12px',
  fontSize: 'clamp(2.3rem, 4vw, 4rem)',
  lineHeight: 1.05,
}

const bodyStyle: React.CSSProperties = {
  margin: 0,
  maxWidth: '42rem',
  fontSize: '1.05rem',
  lineHeight: 1.7,
  color: 'rgba(243, 247, 251, 0.86)',
}

const listStyle: React.CSSProperties = {
  margin: '24px 0 0',
  paddingLeft: '1.2rem',
  color: 'rgba(243, 247, 251, 0.86)',
  lineHeight: 1.8,
}

export default function StellariumRuntimeHost() {
  return (
    <main style={shellStyle}>
      <section style={panelStyle} aria-label="Stellarium sky placeholder">
        <p style={eyebrowStyle}>Sky Engine Reset</p>
        <h1 style={titleStyle}>Stellarium-backed Sky Engine.</h1>
        <p style={bodyStyle}>Legacy custom sky engine has been removed.</p>
        <p style={{ ...bodyStyle, marginTop: '12px' }}>Next step: mount working /study Stellarium runtime.</p>
        <ul style={listStyle}>
          <li>No legacy sky runtime modules are imported here.</li>
          <li>No custom renderer is mounted here.</li>
          <li>No owner or harness trial code is mounted here.</li>
        </ul>
      </section>
    </main>
  )
}