import React, { useState } from 'react'
import { Plus, X, AlertTriangle, Trash2, Search, ChevronRight } from 'lucide-react'
import { useSheetData } from '../hooks/useSheetData.js'
import { LoadingState, ErrorState } from '../components/LoadingState.jsx'

const TIPOS      = ['Infraestructura','Convivencia','Equipamiento','Seguridad','Otro']
const PRIORIDADES = ['Alta','Media','Baja']
const ESTADOS    = ['Abierto','En Proceso','Resuelto','Cerrado']
const EMPTY = { titulo:'', tipo:'Infraestructura', prioridad:'Media', reportado_por:'', fecha:'', estado:'Abierto', descripcion:'' }

export default function Incidentes() {
  const { data: incidentes, loading, error, create, update, remove, reload } = useSheetData('incidentes')
  const [modal, setModal]   = useState(false)
  const [detail, setDetail] = useState(null)
  const [form, setForm]     = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado]       = useState('Todos')
  const [filtroPrioridad, setFiltroPrioridad] = useState('Todas')

  const filtered = incidentes.filter(i => {
    const q = search.toLowerCase()
    return ((i.titulo||'').toLowerCase().includes(q) || (i.reportado_por||'').toLowerCase().includes(q))
      && (filtroEstado === 'Todos' || i.estado === filtroEstado)
      && (filtroPrioridad === 'Todas' || i.prioridad === filtroPrioridad)
  })

  async function save() {
    if (!form.titulo || !form.fecha) return
    setSaving(true)
    try { await create(form); setModal(false); setForm(EMPTY) }
    catch(e) { alert('Error: '+e.message) }
    finally { setSaving(false) }
  }

  async function del(id) {
    if (!confirm('¿Eliminar este incidente?')) return
    try { await remove(id); setDetail(null) } catch(e) { alert('Error: '+e.message) }
  }

  async function changeEstado(id, est) {
    try {
      await update(id, { estado: est })
      setDetail(d => d ? { ...d, estado: est } : d)
    } catch(e) { alert('Error: '+e.message) }
  }

  const prioColor   = { Alta:'badge-red', Media:'badge-yellow', Baja:'badge-green' }
  const estadoColor = { Abierto:'badge-red', 'En Proceso':'badge-blue', Resuelto:'badge-green', Cerrado:'badge-yellow' }
  const tipoColor   = { Infraestructura:'badge-orange', Convivencia:'badge-purple', Equipamiento:'badge-blue', Seguridad:'badge-red', Otro:'badge-yellow' }

  if (loading) return <LoadingState label="Cargando incidentes..."/>
  if (error)   return <ErrorState message={error} onRetry={reload}/>

  return (
    <div className="page">
      <div className="page-header">
        <div><h1>Gestión de Incidentes</h1><p>Reportes y seguimiento</p></div>
        <button className="btn btn-primary" onClick={()=>{setForm(EMPTY);setModal(true)}}><Plus size={16}/> Nuevo Incidente</button>
      </div>

      <div className="grid-4" style={{ marginBottom:20 }}>
        {ESTADOS.map(e => (
          <div key={e} className="card" style={{ padding:'14px 18px', cursor:'pointer' }} onClick={()=>setFiltroEstado(filtroEstado===e?'Todos':e)}>
            <p style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>{e}</p>
            <p style={{ fontSize:26, fontWeight:700, color:'var(--text-primary)', marginTop:3 }}>{incidentes.filter(i=>i.estado===e).length}</p>
          </div>
        ))}
      </div>

      <div className="filters-row">
        <div className="search-bar"><Search size={15}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar incidente..."/></div>
        <select className="form-control" style={{ width:'auto' }} value={filtroEstado} onChange={e=>setFiltroEstado(e.target.value)}>
          <option>Todos</option>{ESTADOS.map(e=><option key={e}>{e}</option>)}
        </select>
        <select className="form-control" style={{ width:'auto' }} value={filtroPrioridad} onChange={e=>setFiltroPrioridad(e.target.value)}>
          <option>Todas</option>{PRIORIDADES.map(p=><option key={p}>{p}</option>)}
        </select>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {filtered.length === 0
          ? <div className="card"><div className="empty-state"><AlertTriangle size={32}/><p>Sin incidentes</p></div></div>
          : filtered.map(i => (
            <div key={i.id} className="card" style={{ padding:'14px 20px', cursor:'pointer', transition:'border-color 0.15s' }}
              onClick={()=>setDetail(i)}
              onMouseEnter={e=>e.currentTarget.style.borderColor='var(--border-main)'}
              onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border-subtle)'}>
              <div style={{ display:'flex', alignItems:'center', gap:12, justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, minWidth:0 }}>
                  <div style={{ width:38, height:38, borderRadius:10, background:i.prioridad==='Alta'?'var(--red-soft)':i.prioridad==='Media'?'var(--yellow-soft)':'var(--green-soft)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <AlertTriangle size={16} color={i.prioridad==='Alta'?'var(--red)':i.prioridad==='Media'?'var(--yellow)':'var(--green)'}/>
                  </div>
                  <div style={{ minWidth:0 }}>
                    <p style={{ fontWeight:600, color:'var(--text-primary)', fontSize:14, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{i.titulo}</p>
                    <p style={{ color:'var(--text-muted)', fontSize:11.5, marginTop:2 }}>Reportado por: {i.reportado_por} · {i.fecha}</p>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                  <span className={`badge ${tipoColor[i.tipo]||'badge-blue'}`}>{i.tipo}</span>
                  <span className={`badge ${prioColor[i.prioridad]}`}>{i.prioridad}</span>
                  <span className={`badge ${estadoColor[i.estado]}`}>{i.estado}</span>
                  <ChevronRight size={14} color="var(--text-dim)"/>
                </div>
              </div>
            </div>
          ))}
      </div>

      {detail && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setDetail(null)}>
          <div className="modal">
            <div className="modal-header">
              <div><h3 style={{ marginBottom:6 }}>{detail.titulo}</h3>
                <div style={{ display:'flex', gap:8 }}>
                  <span className={`badge ${tipoColor[detail.tipo]||'badge-blue'}`}>{detail.tipo}</span>
                  <span className={`badge ${prioColor[detail.prioridad]}`}>Prioridad {detail.prioridad}</span>
                </div>
              </div>
              <button className="btn btn-icon btn-ghost" onClick={()=>setDetail(null)}><X size={16}/></button>
            </div>
            <div className="modal-body">
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px 20px', marginBottom:16 }}>
                {[['Reportado por',detail.reportado_por],['Fecha',detail.fecha],['Estado',detail.estado]].map(([k,v])=>(
                  <div key={k}><p style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:3 }}>{k}</p>
                    <p style={{ color:'var(--text-primary)', fontWeight:500, fontSize:14 }}>{v}</p></div>
                ))}
              </div>
              <div style={{ background:'var(--bg-elevated)', borderRadius:10, padding:'14px 16px', marginBottom:16 }}>
                <p style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6 }}>Descripción</p>
                <p style={{ color:'var(--text-secondary)', fontSize:13.5, lineHeight:1.6 }}>{detail.descripcion||'Sin descripción.'}</p>
              </div>
              <div><p style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>Cambiar Estado</p>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {ESTADOS.map(e=><button key={e} className={`btn btn-sm ${detail.estado===e?'btn-primary':'btn-ghost'}`} onClick={()=>changeEstado(detail.id,e)}>{e}</button>)}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-danger" onClick={()=>del(detail.id)}><Trash2 size={14}/> Eliminar</button>
              <button className="btn btn-ghost" onClick={()=>setDetail(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div className="modal">
            <div className="modal-header"><h3>Nuevo Incidente</h3>
              <button className="btn btn-icon btn-ghost" onClick={()=>setModal(false)}><X size={16}/></button>
            </div>
            <div className="modal-body">
              <div className="form-group"><label>Título *</label>
                <input className="form-control" value={form.titulo} onChange={e=>setForm(f=>({...f,titulo:e.target.value}))} placeholder="Descripción breve del incidente"/>
              </div>
              <div className="grid-2">
                <div className="form-group"><label>Tipo</label>
                  <select className="form-control" value={form.tipo} onChange={e=>setForm(f=>({...f,tipo:e.target.value}))}>{TIPOS.map(t=><option key={t}>{t}</option>)}</select>
                </div>
                <div className="form-group"><label>Prioridad</label>
                  <select className="form-control" value={form.prioridad} onChange={e=>setForm(f=>({...f,prioridad:e.target.value}))}>{PRIORIDADES.map(p=><option key={p}>{p}</option>)}</select>
                </div>
                <div className="form-group"><label>Reportado por</label>
                  <input className="form-control" value={form.reportado_por} onChange={e=>setForm(f=>({...f,reportado_por:e.target.value}))} placeholder="Depto / Persona"/>
                </div>
                <div className="form-group"><label>Fecha *</label>
                  <input className="form-control" type="date" value={form.fecha} onChange={e=>setForm(f=>({...f,fecha:e.target.value}))}/>
                </div>
              </div>
              <div className="form-group"><label>Descripción</label>
                <textarea className="form-control" value={form.descripcion} onChange={e=>setForm(f=>({...f,descripcion:e.target.value}))} placeholder="Detalle del incidente..."/>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={()=>setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving?'Guardando...':'Crear Incidente'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
