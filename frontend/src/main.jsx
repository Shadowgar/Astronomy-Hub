import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/tokens.css'
import "./design/tokens.css";
import "./design/themes.css";
import "./design/semantic.css";
import './styles.css'

const root = createRoot(document.getElementById('root'))
root.render(<App />)
