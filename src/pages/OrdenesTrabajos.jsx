import React, { useState } from 'react'
import { Plus, X, Wrench, Trash2, Search, Calendar, CheckCircle } from 'lucide-react'
import { useStore, nextId } from '../hooks/useStore.js'

const CATEGORIAS  = ['Eléctrica','Gasfitería','Pintura','Carpintería','Limpieza','Jardinería','Ascensores','General']
const PRIORIDADES = ['Alta','Media','Baja']
const ESTADOS     = ['Pendiente','En Proceso','Completada','Cancelada']
const EMPTY = { titulo:'', categoria:'General', prioridad:'Media', asignado_a:'', fecha_creacion:'', fecha_limite:'', estado:'Pendiente', descripcion:'' }

export default function OrdenesTrabajos() {
  const [ordenes, update] = useStore(s => s.ordenes)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('Todos')
  const [filtroCategoria, setFiltroCategoria] = useState('Todas')
  const [view, setView] = useState('kanban') // 'kanban' | 'list'

  const filtered = ordenes.filter(o => {
    const q = search.toLowerCase()
    const matchQ = o.titulo.toLowerCase().includes(q) || o.asignado_a.toLowerCase().includes(q)
    const matchE = filtroEstado === 'Todos' || o.estado === filtroEstado
    const matchC = filtroCategoria === 'Todas' || o.categoria === filtroCategoria
    return matchQ && matchE && matchC
  })

  function save() {
    if (!form.titulo || !form.fecha_creacion) return
    update('ordenes', os => [...os, { ...form, id: nextId(os) }])
    setModal(false); setForm(EMPTY)
  }

  function del(id) { update('ordenes', os => os.filter(o => o.id !== id)) }

  function setEstado(id, est) {
    update('ordenes', os => os.map(o => o.id===id ? { ...o, estado:est } : o))
  }

  const prioColor  = { Alta:'badge-red', Media:'badge-yellow', Baja:'badge-green' }
  const estadoColor = { Pendiente:'badge-yellow', 'En Proceso':'badge-blue', Completada:'badge-green', Cancelada:'badge-red' }

  const kanbanCols = ESTADOS.slice(0,3) // Pendiente, En Proceso, Completada

  return (
    <div className="page">
      <div className="page-header">
        <div><h1>Órdenes de Trabajo</h1><p>Mantenimiento y reparaciones del edificio</p></div>
        <div style={{ display:'flex', gap:10 }}>
          <div style={{ display:'flex', background:'var(--bg-surface)', border:'1px solid var(--border-subtle)', borderRadius:8, overflow:'hidden' }}>
            {['kanban','list'].map(v => (
              <button key={v} onClick={() => setView(v)}
                style={{ padding:'7px 14px', border:'none', cursor:'pointer', fontSize:12.5, fontWeight:500, fontFamily:'var(--font-sans)', transition:'all 0.15s',
                  background: view===v ? 'var(--accent)' : 'transparent',
                  color: view===v ? 'white' : 'var(--text-muted)' }}>
                {v==='kanban' ? 'Kanban' : 'Lista'}
              </button>
            ))}
          </div>
          <button className="btn btn-primary" onClick={() => { setForm(EMPTY); setModal(true) }}>
            <Plus size={16} /> Nueva Orden
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom:20 }}>
        {ESTADOS.map(e => (
          <div key={e} className="card" style={{ padding:'12px 18px', cursor:'pointer' }} onClick={() => setFiltroEstado(filtroEstado===e?'Todos':e)}>
            <p style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>{e}</p>
            <p style={{ fontSize:24, fontWeight:700, color:'var(--text-primary)', marginTop:2 }}>{ordenes.filter(o=>o.estado===e).length}</p>
          </div>
        ))}
      </div>

      <div className="filters-row">
        <div className="search-bar">
          <Search size={15} />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar orden o técnico..." />
        </div>
        <select className="form-control" style={{ width:'auto' }} value={filtroEstado} onChange={e=>setFiltroEstado(e.target.value)}>
          <option>Todos</option>
          {ESTADOS.map(e=><option key={e}>{e}</option>)}
        </select>
        <select className="form-control" style={{ width:'auto' }} value={filtroCategoria} onChange={e=>setFiltroCategoria(e.target.value)}>
          <option>Todas</option>
          {CATEGORIAS.map(c=><option key={c}>{c}</option>)}
        </select>
      </div>

      {view === 'kanban' ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
          {kanbanCols.map(col => (
            <div key={col}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12, padding:'6px 10px', background:'var(--bg-surface)', border:'1px solid var(--border-subtle)', borderRadius:8 }}>
                <span className={`badge ${estadoColor[col]}`}>{col}</span>
                <span style={{ marginLeft:'auto', fontFamily:'var(--font-mono)', fontSize:12, color:'var(--text-muted)' }}>
                  {filtered.filter(o=>o.estado===col).length}
                </span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {filtered.filter(o=>o.estado===col).map(o => (
                  <OrdCard key={o.id} o={o} prioColor={prioColor} onDel={del} onEstado={setEstado} />
                ))}
                {filtered.filter(o=>o.estado===col).length === 0 && (
                  <div style={{ padding:'20px', textAlign:'center', color:'var(--text-dim)', fontSize:12, border:'1px dashed var(--border-subtle)', borderRadius:10 }}>Sin órdenes</div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Categoría</th>
                  <th>Asignado a</th>
                  <th>Prioridad</th>
                  <th>F. Creación</th>
                  <th>F. Límite</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8}><div className="empty-state"><Wrench size={32}/><p>Sin órdenes</p></div></td></tr>
                ) : filtered.map(o => (
                  <tr key={o.id}>
                    <td style={{ color:'var(--text-primary)', fontWeight:500 }}>{o.titulo}</td>
                    <td><span className="badge badge-blue">{o.categoria}</span></td>
                    <td>{o.asignado_a}</td>
                    <td><span className={`badge ${prioColor[o.prioridad]}`}>{o.prioridad}</span></td>
                    <td style={{ fontFamily:'var(--font-mono)', fontSize:12 }}>{o.fecha_creacion}</td>
                    <td style={{ fontFamily:'var(--font-mono)', fontSize:12 }}>{o.fecha_limite}</td>
                    <td>
                      <select value={o.estado} onChange={e=>setEstado(o.id,e.target.value)}
                        style={{ background:'var(--bg-deep)', border:'1px solid var(--border-subtle)', borderRadius:6, padding:'4px 8px', color:'var(--text-secondary)', fontFamily:'var(--font-sans)', fontSize:12, cursor:'pointer' }}>
                        {ESTADOS.map(e=><option key={e}>{e}</option>)}
                      </select>
                    </td>
                    <td><button className="btn btn-icon btn-danger" onClick={()=>del(o.id)}><Trash2 size={14}/></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Nueva Orden de Trabajo</h3>
              <button className="btn btn-icon btn-ghost" onClick={() => setModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Título *</label>
                <input className="form-control" value={form.titulo} onChange={e=>setForm(f=>({...f,titulo:e.target.value}))} placeholder="Descripción de la orden" />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>Categoría</label>
                  <select className="form-control" value={form.categoria} onChange={e=>setForm(f=>({...f,categoria:e.target.value}))}>
                    {CATEGORIAS.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Prioridad</label>
                  <select className="form-control" value={form.prioridad} onChange={e=>setForm(f=>({...f,prioridad:e.target.value}))}>
                    {PRIORIDADES.map(p=><option key={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn:'span 2' }}>
                  <label>Asignado a</label>
                  <input className="form-control" value={form.asignado_a} onChange={e=>setForm(f=>({...f,asignado_a:e.target.value}))} placeholder="Nombre del técnico o empresa" />
                </div>
                <div className="form-group">
                  <label>Fecha Creación *</label>
                  <input className="form-control" type="date" value={form.fecha_creacion} onChange={e=>setForm(f=>({...f,fecha_creacion:e.target.value}))} />
                </div>
                <div className="form-group">
                  <label>Fecha Límite</label>
                  <input className="form-control" type="date" value={form.fecha_limite} onChange={e=>setForm(f=>({...f,fecha_limite:e.target.value}))} />
                </div>
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <textarea className="form-control" value={form.descripcion} onChange={e=>setForm(f=>({...f,descripcion:e.target.value}))} placeholder="Detalle de los trabajos a realizar..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={save}>Crear Orden</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function OrdCard({ o, prioColor, onDel, onEstado }) {
  return (
    <div className="card" style={{ padding:'14px 16px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
        <p style={{ fontWeight:600, color:'var(--text-primary)', fontSize:13.5, lineHeight:1.4 }}>{o.titulo}</p>
        <button className="btn btn-icon btn-danger" style={{ width:28, height:28, flexShrink:0 }} onClick={() => onDel(o.id)}><Trash2 size={12} /></button>
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginTop:8 }}>
        <span className="badge badge-blue">{o.categoria}</span>
        <span className={`badge ${prioColor[o.prioridad]}`}>{o.prioridad}</span>
      </div>
      {o.asignado_a && (
        <p style={{ marginTop:8, fontSize:12, color:'var(--text-muted)' }}>👷 {o.asignado_a}</p>
      )}
      {o.fecha_limite && (
        <p style={{ marginTop:4, fontSize:11.5, color:'var(--text-dim)', display:'flex', alignItems:'center', gap:5 }}>
          <Calendar size={11} /> {o.fecha_limite}
        </p>
      )}
      <div style={{ marginTop:10, display:'flex', gap:6 }}>
        {o.estado !== 'Completada' && (
          <button className="btn btn-ghost btn-sm" style={{ fontSize:11 }} onClick={() => onEstado(o.id, o.estado==='Pendiente' ? 'En Proceso' : 'Completada')}>
            <CheckCircle size={11} /> {o.estado==='Pendiente' ? 'Iniciar' : 'Completar'}
          </button>
        )}
      </div>
    </div>
  )
}
