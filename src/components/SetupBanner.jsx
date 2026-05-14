import React, { useState } from 'react'
import { Settings, X, ExternalLink } from 'lucide-react'

export default function SetupBanner() {
  const [open, setOpen] = useState(true)
  if (!open) return null

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 300,
      background: 'var(--bg-elevated)', border: '1px solid var(--accent)',
      borderRadius: 'var(--radius-lg)', padding: '18px 20px',
      maxWidth: 360, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      animation: 'slideUp 0.3s ease',
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10 }}>
        <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
          <div style={{ width:36, height:36, borderRadius:8, background:'var(--accent-glow)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Settings size={16} color="var(--accent-text)" />
          </div>
          <div>
            <p style={{ fontWeight:700, color:'var(--text-primary)', fontSize:13.5, marginBottom:4 }}>
              Configura Google Sheets
            </p>
            <p style={{ color:'var(--text-muted)', fontSize:12.5, lineHeight:1.5 }}>
              Crea un archivo <code style={{ background:'var(--bg-deep)', padding:'1px 5px', borderRadius:4, color:'var(--accent-text)' }}>.env.local</code> en la raíz del proyecto con tu URL de Apps Script:
            </p>
            <div style={{ marginTop:8, background:'var(--bg-deep)', borderRadius:6, padding:'8px 10px', fontFamily:'var(--font-mono)', fontSize:11.5, color:'var(--green)' }}>
              VITE_SCRIPT_URL=https://script.google.com/...
            </div>
            <a href="https://github.com" target="_blank" rel="noreferrer"
              style={{ display:'inline-flex', alignItems:'center', gap:5, marginTop:10, color:'var(--accent-text)', fontSize:12, textDecoration:'none' }}>
              <ExternalLink size={11} /> Ver instrucciones en README
            </a>
          </div>
        </div>
        <button onClick={() => setOpen(false)} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', padding:2 }}>
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
