import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import Progress from './pages/Progress'
import './styles/tokens.css'
import "./design/tokens.css";
import "./design/themes.css";
import "./design/semantic.css";
import './styles.css'

const root = createRoot(document.getElementById('root'))

// Mount the Progress page directly when the pathname matches.
// Normalize the pathname (trim trailing slashes + lowercase) so variants
// like `/progress/` or `/Progress` are handled uniformly.
const initialPathRaw = typeof window !== 'undefined' ? (window.location && window.location.pathname) || '' : ''
const initialPath = (initialPathRaw || '').replace(/\/+$/, '').toLowerCase()
// Small boot log to help headless checks observe which branch executed.
// (Remove if noisy later.)
console.debug('[BOOT] initialPath:', initialPathRaw, 'normalized:', initialPath)
if (initialPath === '/progress') {
	root.render(<Progress />)
} else {
	root.render(<App />)
}
