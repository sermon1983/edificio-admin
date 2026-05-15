import React from 'react'
import { useLocation } from 'react-router-dom'
import { Menu, Bell, LogOut, Settings } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import BuildingSelector from './BuildingSelector.jsx'
import './Header.css'

const TITLES = {
  '/':            { title: 'Dashboard',             sub: 'Resumen general del edificio' },
  '/gastos':      { title: 'Gastos Comunes',         sub: 'Control de egresos y presupuesto' },
  '/consumos':    { title: 'Consumos',               sub: 'Agua y electricidad por unidad' },
  '/rondas':      { title: 'Rondas de Seguridad',    sub: 'Control de guardias y registro' },
  '/incidentes':  { title: 'Gestión de Incidentes',  sub: 'Reportes y seguimiento' },
  '/ordenes':     { title: 'Órdenes de Trabajo',     sub: 'Mantenimiento y reparaciones' },
  '/recaudacion': { title: 'Recaudación GGCC', sub: 'Cobro de gastos comunes por unidad' },
  '/mantenedor':  { title: 'Mantenedor',             sub: 'Edificios y usuarios del sistema' },
}

export default function Header({ onMenuClick }) {
  const loc  = useLocation()
  const info = TITLES[loc.pathname] || TITLES['/']
  const { user, logout } = useAuth()

  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-btn" onClick={onMenuClick}><Menu size={20}/></button>
        <div>
          <h2 className="header-title">{info.title}</h2>
          <p className="header-sub">{info.sub}</p>
        </div>
      </div>

      <div className="header-right">
        <BuildingSelector />

        <div style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 10px', background:'var(--bg-surface)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-md)' }}>
          <div style={{ width:26, height:26, borderRadius:'50%', background:'var(--accent-soft)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'white' }}>
            {(user?.nombre || 'U').slice(0,2).toUpperCase()}
          </div>
          <div className="header-user-info">
            <span style={{ fontSize:12.5, fontWeight:600, color:'var(--text-primary)' }}>{user?.nombre}</span>
            <span style={{ fontSize:10.5, color:'var(--text-muted)', marginLeft:5, background:'var(--bg-elevated)', padding:'1px 6px', borderRadius:4 }}>{user?.rol}</span>
          </div>
        </div>

        <button className="icon-btn" onClick={logout} title="Cerrar sesión">
          <LogOut size={16}/>
        </button>
      </div>
    </header>
  )
}

// CSS extra para mobile header-user-info
// Handled via index.css media queries
