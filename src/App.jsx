import React, { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import Sidebar from './components/Sidebar.jsx'
import Header from './components/Header.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import GastosComunes from './pages/GastosComunes.jsx'
import Consumos from './pages/Consumos.jsx'
import RondasSeguridad from './pages/RondasSeguridad.jsx'
import Incidentes from './pages/Incidentes.jsx'
import OrdenesTrabajos from './pages/OrdenesTrabajos.jsx'
import Mantenedor from './pages/Mantenedor.jsx'
import './App.css'

function ProtectedRoute({ children, superadminOnly }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace/>
  if (superadminOnly && user.rol !== 'superadmin') return <Navigate to="/" replace/>
  return children
}

function AppShell() {
  const { user } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login/>}/>
        <Route path="*" element={<Navigate to="/login" replace/>}/>
      </Routes>
    )
  }

  return (
    <div className="app-layout">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)}/>
      <div className="app-main">
        <Header onMenuClick={() => setMobileOpen(o => !o)}/>
        <main className="app-content">
          <Routes>
            <Route path="/"            element={<ProtectedRoute><Dashboard/></ProtectedRoute>}/>
            <Route path="/gastos"      element={<ProtectedRoute><GastosComunes/></ProtectedRoute>}/>
            <Route path="/consumos"    element={<ProtectedRoute><Consumos/></ProtectedRoute>}/>
            <Route path="/rondas"      element={<ProtectedRoute><RondasSeguridad/></ProtectedRoute>}/>
            <Route path="/incidentes"  element={<ProtectedRoute><Incidentes/></ProtectedRoute>}/>
            <Route path="/ordenes"     element={<ProtectedRoute><OrdenesTrabajos/></ProtectedRoute>}/>
            <Route path="/mantenedor"  element={<ProtectedRoute superadminOnly><Mantenedor/></ProtectedRoute>}/>
            <Route path="/login"       element={<Navigate to="/" replace/>}/>
            <Route path="*"            element={<Navigate to="/" replace/>}/>
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell/>
    </AuthProvider>
  )
}
