import React from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import AppRouter from './routes/AppRouter'
import { queryClient } from './app/queryClient'
import './styles/tokens.css'
import "./design/themes.css";
import "./design/semantic.css";
import './styles.css'

const root = createRoot(document.getElementById('root'))
root.render(
  <QueryClientProvider client={queryClient}>
    <AppRouter />
  </QueryClientProvider>
)
