import React, { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar.jsx'
import Header from './components/Header.jsx'
import Dashboard from './pages/Dashboard.jsx'
import GastosComunes from './pages/GastosComunes.jsx'
import Consumos from './pages/Consumos.jsx'
import RondasSeguridad from './pages/RondasSeguridad.jsx'
import Incidentes from './pages/Incidentes.jsx'
import OrdenesTrabajos from './pages/OrdenesTrabajos.jsx'
import './App.css'

export default function App() {
  const [mobileOpen, setMobileOpen] = useState(false)
  return (
    <div className="app-layout">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="app-main">
        <Header onMenuClick={() => setMobileOpen(o => !o)} />
        <main className="app-content">
          <Routes>
            <Route path="/"           element={<Dashboard />} />
            <Route path="/gastos"     element={<GastosComunes />} />
            <Route path="/consumos"   element={<Consumos />} />
            <Route path="/rondas"     element={<RondasSeguridad />} />
            <Route path="/incidentes" element={<Incidentes />} />
            <Route path="/ordenes"    element={<OrdenesTrabajos />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
