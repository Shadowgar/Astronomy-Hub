import React from 'react'
import { createRoot } from 'react-dom/client'
import AppRouter from './routes/AppRouter'
import './styles/tokens.css'
import "./design/tokens.css";
import "./design/themes.css";
import "./design/semantic.css";
import './styles.css'

const root = createRoot(document.getElementById('root'))
root.render(<AppRouter />)
