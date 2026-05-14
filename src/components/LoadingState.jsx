import React from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

export function LoadingState({ label = 'Cargando datos...' }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'64px 32px' }}>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
        <div className="spinner" />
        <p style={{ color:'var(--text-muted)', fontSize:13.5 }}>{label}</p>
      </div>
    </div>
  )
}

export function ErrorState({ message, onRetry }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'64px 32px' }}>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14, maxWidth:400, textAlign:'center' }}>
        <div style={{ width:48, height:48, borderRadius:12, background:'var(--red-soft)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <AlertCircle size={22} color="var(--red)" />
        </div>
        <div>
          <p style={{ color:'var(--text-primary)', fontWeight:600, marginBottom:6 }}>Error al cargar datos</p>
          <p style={{ color:'var(--text-muted)', fontSize:13 }}>{message}</p>
        </div>
        {onRetry && (
          <button className="btn btn-ghost" onClick={onRetry}>
            <RefreshCw size={14} /> Reintentar
          </button>
        )}
      </div>
    </div>
  )
}
