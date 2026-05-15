import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Receipt, Droplets, Shield, AlertTriangle, Wrench, Building2, ChevronLeft, ChevronRight, X, Settings, DollarSign } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import './Sidebar.css'

const NAV = [
  { to:'/',            icon:LayoutDashboard, label:'Dashboard'          },
  { to:'/gastos',      icon:Receipt,         label:'Gastos Comunes'     },
  { to:'/consumos',    icon:Droplets,        label:'Consumos'           },
  { to:'/recaudacion', icon:DollarSign,      label:'Recaudación GGCC'   },
  { to:'/rondas',      icon:Shield,          label:'Rondas de Seguridad'},
  { to:'/incidentes',  icon:AlertTriangle,   label:'Incidentes'         },
  { to:'/ordenes',     icon:Wrench,          label:'Órdenes de Trabajo' },
]

export default function Sidebar({ mobileOpen, onClose }) {
  const [collapsed, setCollapsed] = useState(false)
  const { user, building } = useAuth()
  const isSuperadmin = user?.rol === 'superadmin'

  return (
    <>
      {mobileOpen && <div className="sidebar-backdrop" onClick={onClose}/>}
      <aside className={`sidebar ${collapsed?'collapsed':''} ${mobileOpen?'mobile-open':''}`}>
        <div className="sidebar-brand">
          <div className="brand-icon"><Building2 size={20}/></div>
          {!collapsed && (
            <div className="brand-text">
              <span className="brand-name">AdminEdificio</span>
              <span className="brand-sub">{building?.nombre||'Sin edificio'}</span>
            </div>
          )}
          <button className="sidebar-close-mobile" onClick={onClose}><X size={16}/></button>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to==='/'} className={({ isActive })=>`nav-item ${isActive?'active':''}`} onClick={onClose}>
              <Icon size={18}/>{!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
          {isSuperadmin && (
            <>
              <div style={{ margin:'10px 8px 4px', height:1, background:'var(--border-subtle)'}}/>
              <NavLink to="/mantenedor" className={({ isActive })=>`nav-item ${isActive?'active':''}`} onClick={onClose}>
                <Settings size={18}/>{!collapsed && <span>Mantenedor</span>}
              </NavLink>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          {!collapsed && (
            <div className="sidebar-user">
              <div className="user-avatar">{(user?.nombre||'U').slice(0,2).toUpperCase()}</div>
              <div className="user-info">
                <p className="user-name">{user?.nombre}</p>
                <p className="user-role">{user?.rol}</p>
              </div>
            </div>
          )}
          <button className="collapse-btn desktop-only" onClick={() => setCollapsed(c=>!c)}>
            {collapsed?<ChevronRight size={14}/>:<ChevronLeft size={14}/>}
          </button>
        </div>
      </aside>
    </>
  )
}
