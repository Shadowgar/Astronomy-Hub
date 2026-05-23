import React from 'react'
import AppShell from "./components/layout/AppShell"
import CommandCenterFoundationView from './components/layout/foundation/CommandCenterFoundationView'

export default function App() {
  return (
    <AppShell>
      <div className="app-shell">
        <CommandCenterFoundationView />
      </div>
    </AppShell>
  )
}
