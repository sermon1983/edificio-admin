import React, { useState } from 'react'
import { Plus, X, Shield, CheckCircle, Clock, MapPin, Trash2 } from 'lucide-react'
import { useStore, nextId } from '../hooks/useStore.js'

const GUARDIAS = ['Carlos Muñoz','Pedro Rojas','Ana Soto','Luis Pérez']
const ZONAS_DISPONIBLES = ['Estacionamiento','Hall','Azotea','Piscina','Gimnasio','Escaleras','Perímetro','Sala de Reuniones','Bodega','Lobby']
const ESTADOS = ['Programada','En Curso','Completada']
const EMPTY = { guardia: 'Carlos Muñoz', inicio: '', fin: '', zonas: [], novedades: '', estado: 'Programada' }

export default function RondasSeguridad() {
  const [rondas, update] = useStore(s => s.rondas)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)

  const completadas = rondas.filter(r=>r.estado==='Completada').length
  const enCurso     = rondas.filter(r=>r.estado==='En Curso').length
  const programadas = rondas.filter(r=>r.estado==='Programada').length

  function toggleZona(z) {
    setForm(f => ({
      ...f,
      zonas: f.zonas.includes(z) ? f.zonas.filter(x=>x!==z) : [...f.zonas, z]
    }))
  }

  function save() {
    if (!form.inicio) return
    update('rondas', rs => [...rs, { ...form, id: nextId(rs) }])
    setModal(false); setForm(EMPTY)
  }

  function del(id) { update('rondas', rs => rs.filter(r => r.id !== id)) }

  function complete(id) {
    const now = new Date().toLocaleString('sv-SE').replace('T',' ').slice(0,16)
    update('rondas', rs => rs.map(r => r.id===id ? { ...r, estado:'Completada', fin: now } : r))
  }

  const stateIcon = { Completada:<CheckCircle size={16} color="var(--green)" />, 'En Curso':<Clock size={16} color="var(--accent)" />, Programada:<Shield size={16} color="var(--yellow)" /> }
  const stateClass = { Completada:'badge-green', 'En Curso':'badge-blue', Programada:'badge-yellow' }

  return (
    <div className="page">
      <div className="page-header">
        <div><h1>Rondas de Seguridad</h1><p>Registro y control de guardias</p></div>
        <button className="btn btn-primary" onClick={() => { setForm(EMPTY); setModal(true) }}>
          <Plus size={16} /> Nueva Ronda
        </button>
      </div>

      <div className="grid-3" style={{ marginBottom:24 }}>
        {[
          { label:'Completadas', val: completadas, color:'var(--green)', bg:'var(--green-soft)' },
          { label:'En Curso', val: enCurso, color:'var(--accent)', bg:'var(--accent-glow)' },
          { label:'Programadas', val: programadas, color:'var(--yellow)', bg:'var(--yellow-soft)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding:'16px 20px' }}>
            <p style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>{s.label}</p>
            <p style={{ fontSize:28, fontWeight:700, color:s.color, marginTop:4 }}>{s.val}</p>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {rondas.length === 0 ? (
          <div className="card"><div className="empty-state"><Shield size={32} /><p>Sin rondas registradas</p></div></div>
        ) : [...rondas].reverse().map(r => (
          <div key={r.id} className="card" style={{ padding:'16px 20px' }}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
              <div style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
                <div style={{ width:44, height:44, borderRadius:12, background: r.estado==='Completada' ? 'var(--green-soft)' : r.estado==='En Curso' ? 'var(--accent-glow)' : 'var(--yellow-soft)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  {stateIcon[r.estado]}
                </div>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
                    <p style={{ fontWeight:600, color:'var(--text-primary)', fontSize:15 }}>{r.guardia}</p>
                    <span className={`badge ${stateClass[r.estado]}`}>{r.estado}</span>
                  </div>
                  <p style={{ color:'var(--text-muted)', fontSize:12, fontFamily:'var(--font-mono)' }}>
                    Inicio: {r.inicio}{r.fin ? ` · Fin: ${r.fin}` : ''}
                  </p>
                  {r.zonas.length > 0 && (
                    <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginTop:8 }}>
                      {r.zonas.map(z => (
                        <span key={z} style={{ display:'flex', alignItems:'center', gap:4, background:'var(--bg-elevated)', border:'1px solid var(--border-subtle)', borderRadius:6, padding:'2px 8px', fontSize:11, color:'var(--text-secondary)' }}>
                          <MapPin size={10} /> {z}
                        </span>
                      ))}
                    </div>
                  )}
                  {r.novedades && (
                    <p style={{ marginTop:8, fontSize:12.5, color:'var(--text-secondary)', background:'var(--bg-elevated)', borderLeft:'3px solid var(--border-bright)', padding:'6px 10px', borderRadius:'0 6px 6px 0' }}>
                      {r.novedades}
                    </p>
                  )}
                </div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                {r.estado !== 'Completada' && (
                  <button className="btn btn-ghost btn-sm" onClick={() => complete(r.id)}>
                    <CheckCircle size={13} /> Completar
                  </button>
                )}
                <button className="btn btn-icon btn-danger" onClick={() => del(r.id)}><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Nueva Ronda de Seguridad</h3>
              <button className="btn btn-icon btn-ghost" onClick={() => setModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Guardia *</label>
                <select className="form-control" value={form.guardia} onChange={e=>setForm(f=>({...f,guardia:e.target.value}))}>
                  {GUARDIAS.map(g=><option key={g}>{g}</option>)}
                </select>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>Hora Inicio *</label>
                  <input className="form-control" type="datetime-local" value={form.inicio} onChange={e=>setForm(f=>({...f,inicio:e.target.value.replace('T',' ')}))} />
                </div>
                <div className="form-group">
                  <label>Estado</label>
                  <select className="form-control" value={form.estado} onChange={e=>setForm(f=>({...f,estado:e.target.value}))}>
                    {ESTADOS.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Zonas a Cubrir</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:4 }}>
                  {ZONAS_DISPONIBLES.map(z => (
                    <button key={z} type="button" onClick={() => toggleZona(z)}
                      style={{ padding:'5px 12px', borderRadius:6, fontSize:12, cursor:'pointer', border:'1px solid', transition:'all 0.12s',
                        background: form.zonas.includes(z) ? 'var(--accent-glow)' : 'var(--bg-elevated)',
                        color: form.zonas.includes(z) ? 'var(--accent-text)' : 'var(--text-muted)',
                        borderColor: form.zonas.includes(z) ? 'rgba(27,152,224,0.4)' : 'var(--border-subtle)',
                      }}>
                      {z}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Novedades</label>
                <textarea className="form-control" value={form.novedades} onChange={e=>setForm(f=>({...f,novedades:e.target.value}))} placeholder="Observaciones de la ronda..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={save}>Registrar Ronda</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
