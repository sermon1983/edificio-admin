import React, { useState, useRef, useEffect } from 'react'
import { Building2, ChevronDown, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

export default function BuildingSelector() {
  const { edificios, building, selectBuilding } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function onClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  if (!edificios?.length) return null

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'var(--bg-surface)', border: '1px solid var(--border-main)',
        borderRadius: 'var(--radius-md)', padding: '7px 12px',
        color: 'var(--text-primary)', cursor: 'pointer', fontFamily: 'var(--font-sans)',
        fontSize: 13, fontWeight: 500, transition: 'all 0.15s', maxWidth: 220,
      }}>
        <div style={{ width: 22, height: 22, borderRadius: 6, background: building?.color || 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Building2 size={12} color="white" />
        </div>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {building?.nombre || 'Seleccionar edificio'}
        </span>
        <ChevronDown size={13} color="var(--text-muted)" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: 0, minWidth: 240, zIndex: 200,
          background: 'var(--bg-elevated)', border: '1px solid var(--border-main)',
          borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)',
          padding: '6px', animation: 'slideUp 0.15s ease',
        }}>
          {edificios.filter(e => e.activo !== 'false' && e.activo !== false).map(ed => (
            <button key={ed.id} onClick={() => { selectBuilding(ed); setOpen(false) }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 'var(--radius-md)', border: 'none',
                background: building?.id === ed.id ? 'var(--accent-glow)' : 'transparent',
                color: building?.id === ed.id ? 'var(--accent-text)' : 'var(--text-secondary)',
                cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13.5,
                textAlign: 'left', transition: 'background 0.12s',
              }}
              onMouseEnter={e => { if (building?.id !== ed.id) e.currentTarget.style.background = 'var(--bg-hover)' }}
              onMouseLeave={e => { if (building?.id !== ed.id) e.currentTarget.style.background = 'transparent' }}
            >
              <div style={{ width: 28, height: 28, borderRadius: 8, background: ed.color || 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Building2 size={13} color="white" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ed.nombre}</p>
                <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 1 }}>{ed.unidades} unidades · {ed.direccion}</p>
              </div>
              {building?.id === ed.id && <Check size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
