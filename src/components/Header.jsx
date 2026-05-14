import React from 'react'
import { useLocation } from 'react-router-dom'
import { Menu, Bell, Calendar } from 'lucide-react'
import './Header.css'

const TITLES = {
  '/':           { title: 'Dashboard', sub: 'Resumen general del edificio' },
  '/gastos':     { title: 'Gastos Comunes', sub: 'Control de egresos y presupuesto' },
  '/consumos':   { title: 'Consumos', sub: 'Agua y electricidad por unidad' },
  '/rondas':     { title: 'Rondas de Seguridad', sub: 'Control de guardias y registro' },
  '/incidentes': { title: 'Gestión de Incidentes', sub: 'Reportes y seguimiento' },
  '/ordenes':    { title: 'Órdenes de Trabajo', sub: 'Mantenimiento y reparaciones' },
}

const TODAY = new Date().toLocaleDateString('es-CL', { weekday:'long', day:'numeric', month:'long', year:'numeric' })

export default function Header({ onMenuClick }) {
  const loc = useLocation()
  const info = TITLES[loc.pathname] || TITLES['/']

  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-btn" onClick={onMenuClick}><Menu size={20} /></button>
        <div>
          <h2 className="header-title">{info.title}</h2>
          <p className="header-sub">{info.sub}</p>
        </div>
      </div>
      <div className="header-right">
        <div className="header-date">
          <Calendar size={14} />
          <span>{TODAY}</span>
        </div>
        <button className="icon-btn notif-btn">
          <Bell size={18} />
          <span className="notif-dot" />
        </button>
      </div>
    </header>
  )
}
