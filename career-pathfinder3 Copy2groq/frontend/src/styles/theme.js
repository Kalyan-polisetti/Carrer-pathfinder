export const colors = {
  ink: '#0F1B1A',                   //background colour
  panel: '#16211F',//panel colour 
  line: '#24332F',//border lines
  paper: '#EDEAE0', // welcome
  muted: '#8FA39A',//no account button
  amber: '#E8A33D',//sign in button
  teal: '#4FB3A9',//carrerpath sign in button and signup
  coral: '#E0644A',// signup
}

export const fonts = {
  serif: "'Fraunces', serif",
  sans: "'IBM Plex Sans', sans-serif",
  mono: "'IBM Plex Mono', monospace",
}

export const page = {
  minHeight: '100vh',
  background: colors.ink,
  color: colors.paper,
  fontFamily: fonts.sans,
  display: 'flex',
  flexDirection: 'column',
}

export const btnPrimary = {
  background: colors.amber,
  color: colors.ink,
  border: 'none',
  borderRadius: 10,
  padding: '12px 20px',
  fontFamily: fonts.mono,
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
}

export const inputStyle = {
  width: '100%',
  background: colors.panel,
  border: `1px solid ${colors.line}`,
  borderRadius: 10,
  padding: '12px 14px',
  color: colors.paper,
  fontSize: 14,
  fontFamily: fonts.sans,
  outline: 'none',
  marginBottom: 14,
}
