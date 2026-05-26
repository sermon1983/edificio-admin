import React, { useState } from 'react'
import { Plus, X, AlertTriangle, Trash2, Search, ChevronRight, Clock, MessageSquare, Send, Copy, Check } from 'lucide-react'
import { useSheetData } from '../hooks/useSheetData.js'
import { useAuth } from '../context/AuthContext.jsx'
import { LoadingState, ErrorState } from '../components/LoadingState.jsx'
import ImageUpload, { parseImages } from '../components/ImageUpload.jsx'

const TIPOS       = ['Infraestructura','Equipamiento','Seguridad','Otro']
const PRIORIDADES = ['Crítica','Alta','Media','Baja']
const ESTADOS     = ['Abierto','En Proceso','Resuelto','Cerrado']
const DIAS_PRIORIDAD = { 'Crítica':5, 'Alta':10, 'Media':20, 'Baja':30 }

function getToday() { return new Date().toISOString().slice(0,10) }

const EMPTY = {
  titulo:'', tipo:'Infraestructura', prioridad:'Media',
  reportado_por:'', fecha: getToday(), estado:'Abierto',
  descripcion:'', imagenes:'', comentarios:'[]', codigo:'', fecha_cierre:''
}

function calcVigencia(fecha, prioridad) {
  try {
    if (!fecha) return null
    const fechaStr = String(fecha).trim().slice(0, 10) // tomar solo yyyy-MM-dd
    if (!fechaStr || fechaStr.length < 8) return null
    const dias  = DIAS_PRIORIDAD[prioridad] || 30
    const start = new Date(fechaStr)
    if (isNaN(start.getTime())) return null  // fecha inválida → no crashear
    const limite    = new Date(start.getTime() + dias * 86400000)
    const restantes = Math.ceil((limite - new Date()) / 86400000)
    return { dias, limite: limite.toISOString().slice(0, 10), restantes }
  } catch (_) {
    return null  // nunca crashear el render por una fecha rota
  }
}

function VigenciaBadge({ fecha, prioridad, estado }) {
  if (estado === 'Resuelto' || estado === 'Cerrado') return null
  const v = calcVigencia(fecha, prioridad)
  if (!v) return null
  const color = v.restantes < 0 ? 'var(--red)' : v.restantes <= 1 ? 'var(--orange)' : v.restantes <= 3 ? 'var(--yellow)' : 'var(--green)'
  const bg    = v.restantes < 0 ? 'var(--red-soft)' : v.restantes <= 1 ? 'var(--orange-soft)' : v.restantes <= 3 ? 'var(--yellow-soft)' : 'var(--green-soft)'
  const txt   = v.restantes < 0 ? `Vencido ${Math.abs(v.restantes)}d` : v.restantes === 0 ? 'Vence hoy' : `${v.restantes}d restantes`
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, background:bg, color, fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:99, border:`1px solid ${color}22` }}>
      <Clock size={10}/> {txt}
    </span>
  )
}

// Badge de código con botón copiar
function CodigoBadge({ codigo }) {
  const [copied, setCopied] = useState(false)
  if (!codigo) return null

  function copy(e) {
    e.stopPropagation()
    navigator.clipboard?.writeText(codigo).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:'var(--bg-deep)', border:'1px solid var(--border-main)', borderRadius:6, padding:'2px 8px 2px 10px', fontFamily:'var(--font-mono)', fontSize:12, color:'var(--accent-text)', fontWeight:700, cursor:'pointer', userSelect:'none' }}
      onClick={copy} title="Copiar código">
      {codigo}
      {copied ? <Check size={11} color="var(--green)"/> : <Copy size={11} color="var(--text-dim)"/>}
    </span>
  )
}

// Hilo de observaciones
function ComentariosThread({ comentariosJson, onAdd, userName }) {
  const [texto,  setTexto]  = useState('')
  const [saving, setSaving] = useState(false)
  let comentarios = []
  try { comentarios = JSON.parse(comentariosJson || '[]') } catch { comentarios = [] }
  if (!Array.isArray(comentarios)) comentarios = []

  async function add() {
    if (!texto.trim()) return
    setSaving(true)
    const nuevo = { fecha: new Date().toLocaleString('sv-SE').replace('T',' ').slice(0,16), usuario: userName||'Usuario', texto: texto.trim() }
    await onAdd([...comentarios, nuevo])
    setTexto(''); setSaving(false)
  }

  return (
    <div>
      <p style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:10 }}>
        <MessageSquare size={12} style={{ marginRight:5, verticalAlign:'middle' }}/>
        Observaciones ({comentarios.length})
      </p>
      {comentarios.length === 0 && <p style={{ fontSize:12.5, color:'var(--text-dim)', fontStyle:'italic', marginBottom:12 }}>Sin observaciones aún.</p>}
      {comentarios.map((c,i) => (
        <div key={i} style={{ display:'flex', gap:10, marginBottom:12 }}>
          <div style={{ width:28, height:28, borderRadius:'50%', background:'var(--accent-soft)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'white', flexShrink:0, marginTop:2 }}>
            {String(c.usuario||'U').slice(0,2).toUpperCase()}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
              <span style={{ fontSize:12.5, fontWeight:600, color:'var(--text-primary)' }}>{c.usuario}</span>
              <span style={{ fontSize:11, color:'var(--text-dim)', fontFamily:'var(--font-mono)' }}>{c.fecha}</span>
            </div>
            <p style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.5, background:'var(--bg-elevated)', padding:'8px 12px', borderRadius:'0 8px 8px 8px', margin:0 }}>{c.texto}</p>
          </div>
        </div>
      ))}
      <div style={{ display:'flex', gap:8, marginTop:8 }}>
        <input value={texto} onChange={e=>setTexto(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&add()}
          placeholder="Agregar observación..." className="form-control" style={{ fontSize:13 }}/>
        <button className="btn btn-primary btn-sm" onClick={add} disabled={saving||!texto.trim()}>
          <Send size={13}/>
        </button>
      </div>
    </div>
  )
}

export default function Incidentes() {
  const { data: incidentes, loading, error, create, update, remove, reload } = useSheetData('incidentes')
  const { user } = useAuth()

  const [modal,  setModal]  = useState(false)
  const [detail, setDetail] = useState(null)
  const [form,   setForm]   = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filtroEstado,    setFiltroEstado]    = useState('Todos')
  const [filtroPrioridad, setFiltroPrioridad] = useState('Todas')

  const filtered = incidentes.filter(i => {
    const q = search.toLowerCase()
    return (
      ((i.titulo||'').toLowerCase().includes(q) ||
       (i.reportado_por||'').toLowerCase().includes(q) ||
       (i.codigo||'').toLowerCase().includes(q)) &&
      (filtroEstado === 'Todos' || i.estado === filtroEstado) &&
      (filtroPrioridad === 'Todas' || i.prioridad === filtroPrioridad)
    )
  })

  async function save() {
    if (!form.titulo) return
    setSaving(true)
    try {
      await create({ ...form, fecha: form.fecha || getToday() })
      setModal(false); setForm({ ...EMPTY, fecha: getToday() })
    } catch(e) { alert('Error: ' + e.message) }
    finally { setSaving(false) }
  }

  async function del(id) {
    if (!confirm('¿Eliminar este incidente?')) return
    try { await remove(id); setDetail(null) } catch(e) { alert('Error: ' + e.message) }
  }

  async function changeEstado(id, est) {
    try {
      const now    = new Date().toLocaleString('sv-SE').replace('T',' ').slice(0,16)
      const fields = { estado: est }
      if (est === 'Resuelto' || est === 'Cerrado') fields.fecha_cierre = now
      else fields.fecha_cierre = ''
      await update(id, fields)
      setDetail(d => d ? { ...d, ...fields } : d)
    } catch(e) { alert('Error: ' + e.message) }
  }

  async function addComment(id, arr) {
    const json = JSON.stringify(arr)
    try {
      await update(id, { comentarios: json })
      setDetail(d => d ? { ...d, comentarios: json } : d)
    } catch(e) { alert('Error: ' + e.message) }
  }

  const prioColor   = { 'Crítica':'badge-red', Alta:'badge-red', Media:'badge-yellow', Baja:'badge-green' }
  const estadoColor = { Abierto:'badge-red', 'En Proceso':'badge-blue', Resuelto:'badge-green', Cerrado:'badge-yellow' }
  const tipoColor   = { Infraestructura:'badge-orange', Equipamiento:'badge-blue', Seguridad:'badge-red', Otro:'badge-yellow' }

  if (loading) return <LoadingState label="Cargando incidentes..."/>
  if (error)   return <ErrorState message={error} onRetry={reload}/>

  return (
    <div className="page">
      <div className="page-header">
        <div><h1>Gestión de Incidentes</h1><p>{incidentes.length} registros totales</p></div>
        <button className="btn btn-primary" onClick={()=>{ setForm({...EMPTY,fecha:getToday()}); setModal(true) }}>
          <Plus size={16}/> Nuevo Incidente
        </button>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom:20 }}>
        {ESTADOS.map(e => (
          <div key={e} className="card" style={{ padding:'12px 18px', cursor:'pointer', borderLeft:`3px solid ${filtroEstado===e?'var(--accent)':'transparent'}` }}
            onClick={()=>setFiltroEstado(filtroEstado===e?'Todos':e)}>
            <p style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>{e}</p>
            <p style={{ fontSize:26, fontWeight:700, color:'var(--text-primary)', marginTop:3 }}>{incidentes.filter(i=>i.estado===e).length}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="filters-row">
        <div className="search-bar" style={{ width:280 }}>
          <Search size={15}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por código, título o reportante..."/>
        </div>
        <select className="form-control" style={{ width:'auto' }} value={filtroEstado} onChange={e=>setFiltroEstado(e.target.value)}>
          <option>Todos</option>{ESTADOS.map(e=><option key={e}>{e}</option>)}
        </select>
        <select className="form-control" style={{ width:'auto' }} value={filtroPrioridad} onChange={e=>setFiltroPrioridad(e.target.value)}>
          <option>Todas</option>{PRIORIDADES.map(p=><option key={p}>{p}</option>)}
        </select>
      </div>

      {/* Lista */}
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {filtered.length === 0
          ? <div className="card"><div className="empty-state"><AlertTriangle size={32}/><p>Sin incidentes</p></div></div>
          : filtered.map(i => (
            <div key={String(i.id)} className="card" style={{ padding:'14px 20px', cursor:'pointer', transition:'border-color 0.15s',
              borderLeft: i.prioridad==='Crítica' ? '4px solid var(--red)' : '1px solid var(--border-subtle)' }}
              onClick={()=>setDetail(i)}
              onMouseEnter={e=>{if(i.prioridad!=='Crítica')e.currentTarget.style.borderColor='var(--border-main)'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=i.prioridad==='Crítica'?'var(--red)':'var(--border-subtle)'}}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:12, justifyContent:'space-between', flexWrap:'wrap' }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:12, minWidth:0, flex:1 }}>
                  <div style={{ width:38, height:38, borderRadius:10, flexShrink:0,
                    background: i.prioridad==='Crítica'||i.prioridad==='Alta'?'var(--red-soft)':i.prioridad==='Media'?'var(--yellow-soft)':'var(--green-soft)',
                    display:'flex', alignItems:'center', justifyContent:'center', marginTop:2 }}>
                    <AlertTriangle size={16} color={i.prioridad==='Crítica'||i.prioridad==='Alta'?'var(--red)':i.prioridad==='Media'?'var(--yellow)':'var(--green)'}/>
                  </div>
                  <div style={{ minWidth:0, flex:1 }}>
                    {/* Código + Título */}
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:3 }}>
                      <CodigoBadge codigo={i.codigo}/>
                      <p style={{ fontWeight:600, color:'var(--text-primary)', fontSize:14 }}>{i.titulo}</p>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                      <span style={{ fontSize:11.5, color:'var(--text-muted)' }}>{i.reportado_por} · {i.fecha}</span>
                      <VigenciaBadge fecha={i.fecha} prioridad={i.prioridad} estado={i.estado}/>
                    </div>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0, flexWrap:'wrap' }}>
                  <span className={`badge ${tipoColor[i.tipo]||'badge-blue'}`}>{i.tipo}</span>
                  <span className={`badge ${prioColor[i.prioridad]||'badge-yellow'}`}
                    style={i.prioridad==='Crítica'?{background:'rgba(239,68,68,0.15)',color:'var(--red)',border:'1px solid rgba(239,68,68,0.3)',fontWeight:800}:{}}>
                    {i.prioridad}
                  </span>
                  <span className={`badge ${estadoColor[i.estado]||'badge-yellow'}`}>{i.estado}</span>
                  <ChevronRight size={14} color="var(--text-dim)"/>
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* ── Modal detalle ── */}
      {detail && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setDetail(null)}>
          <div className="modal" style={{ maxWidth:620 }}>
            <div className="modal-header">
              <div style={{ flex:1, minWidth:0, paddingRight:10 }}>
                {/* Código prominente */}
                <div style={{ marginBottom:8 }}>
                  <CodigoBadge codigo={detail.codigo}/>
                </div>
                <h3 style={{ marginBottom:6, wordBreak:'break-word', fontSize:16 }}>{detail.titulo}</h3>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  <span className={`badge ${tipoColor[detail.tipo]||'badge-blue'}`}>{detail.tipo}</span>
                  <span className={`badge ${prioColor[detail.prioridad]||'badge-yellow'}`}
                    style={detail.prioridad==='Crítica'?{background:'rgba(239,68,68,0.15)',color:'var(--red)',border:'1px solid rgba(239,68,68,0.3)',fontWeight:800}:{}}>
                    {detail.prioridad}
                  </span>
                  <VigenciaBadge fecha={detail.fecha} prioridad={detail.prioridad} estado={detail.estado}/>
                </div>
              </div>
              <button className="btn btn-icon btn-ghost" onClick={()=>setDetail(null)}><X size={16}/></button>
            </div>
            <div className="modal-body" style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {/* Info grid */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px 20px', background:'var(--bg-elevated)', borderRadius:10, padding:'14px 16px' }}>
                {[
                  ['Estado',        detail.estado],
                  ['Reportado por', detail.reportado_por],
                  ['Fecha creación',detail.fecha],
                  ['Vigencia',      `${DIAS_PRIORIDAD[detail.prioridad]||30} días`],
                  ['Fecha límite',  calcVigencia(detail.fecha, detail.prioridad)?.limite || '—'],
                  ...(detail.fecha_cierre ? [['Fecha cierre', detail.fecha_cierre]] : []),
                ].map(([k,v]) => (
                  <div key={k}>
                    <p style={{ fontSize:10.5, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:2 }}>{k}</p>
                    <p style={{ color:'var(--text-primary)', fontSize:13 }}>{v}</p>
                  </div>
                ))}
              </div>

              {/* Descripción */}
              {detail.descripcion && (
                <div style={{ background:'var(--bg-elevated)', borderRadius:10, padding:'12px 14px' }}>
                  <p style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6 }}>Descripción</p>
                  <p style={{ color:'var(--text-secondary)', fontSize:13.5, lineHeight:1.6 }}>{detail.descripcion}</p>
                </div>
              )}

              {/* Imágenes */}
              {detail.imagenes && String(detail.imagenes).trim() && (
                <div>
                  <p style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>Imágenes</p>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                    {parseImages(detail.imagenes).map((url,i)=>(
                      <img key={i} src={url.trim()} alt="" onClick={()=>window.open(url.trim(),'_blank')} style={{ width:80,height:80,objectFit:'cover',borderRadius:8,border:'1px solid var(--border-main)',cursor:'pointer' }}/>
                    ))}
                  </div>
                </div>
              )}

              {/* Cambiar estado */}
              <div>
                <p style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>Cambiar Estado</p>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {ESTADOS.map(e=>(
                    <button key={e} className={`btn btn-sm ${detail.estado===e?'btn-primary':'btn-ghost'}`}
                      onClick={()=>changeEstado(detail.id, e)}>{e}</button>
                  ))}
                </div>
              </div>

              {/* Observaciones */}
              <div style={{ borderTop:'1px solid var(--border-subtle)', paddingTop:16 }}>
                <ComentariosThread
                  comentariosJson={detail.comentarios}
                  userName={user?.nombre}
                  onAdd={(arr)=>addComment(detail.id, arr)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-danger" onClick={()=>del(detail.id)}><Trash2 size={14}/> Eliminar</button>
              <button className="btn btn-ghost" onClick={()=>setDetail(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal nuevo incidente ── */}
      {modal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Nuevo Incidente</h3>
              <button className="btn btn-icon btn-ghost" onClick={()=>setModal(false)}><X size={16}/></button>
            </div>
            <div className="modal-body">
              <div className="grid-2">
                <div className="form-group" style={{ gridColumn:'span 2' }}>
                  <label>Título *</label>
                  <input className="form-control" value={form.titulo} onChange={e=>setForm(f=>({...f,titulo:e.target.value}))} placeholder="Descripción breve del incidente" autoFocus/>
                </div>
                <div className="form-group">
                  <label>Tipo</label>
                  <select className="form-control" value={form.tipo} onChange={e=>setForm(f=>({...f,tipo:e.target.value}))}>
                    {TIPOS.map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Prioridad</label>
                  <select className="form-control" value={form.prioridad} onChange={e=>setForm(f=>({...f,prioridad:e.target.value}))}>
                    {PRIORIDADES.map(p=><option key={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Reportado por</label>
                  <input className="form-control" value={form.reportado_por} onChange={e=>setForm(f=>({...f,reportado_por:e.target.value}))} placeholder="Depto / Persona"/>
                </div>
                <div className="form-group">
                  <label>Fecha de creación</label>
                  <div style={{ padding:'9px 13px', background:'var(--bg-deep)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-md)' }}>
                    <p style={{ color:'var(--text-primary)', fontSize:14, fontFamily:'var(--font-mono)', fontWeight:500, margin:0 }}>📅 {form.fecha}</p>
                    <p style={{ fontSize:11, color:'var(--text-dim)', marginTop:4, marginBottom:0 }}>El código único (INC-XXXXXX) se asignará al guardar</p>
                  </div>
                </div>
                <div className="form-group" style={{ gridColumn:'span 2' }}>
                  <label>Descripción</label>
                  <textarea className="form-control" value={form.descripcion} onChange={e=>setForm(f=>({...f,descripcion:e.target.value}))} placeholder="Detalle del incidente..."/>
                </div>
                <div className="form-group" style={{ gridColumn:'span 2' }}>
                  <label>Imágenes</label>
                  <ImageUpload value={form.imagenes} onChange={v=>setForm(f=>({...f,imagenes:v}))} label="Adjuntar fotos del incidente"/>
                </div>
              </div>

              {/* Vigencia preview */}
              {form.prioridad && (
                <div style={{ marginTop:8, padding:'10px 14px', background:'var(--bg-elevated)', borderRadius:8, display:'flex', alignItems:'center', gap:8 }}>
                  <Clock size={14} color="var(--text-muted)"/>
                  <span style={{ fontSize:12.5, color:'var(--text-muted)' }}>
                    Vigencia <strong style={{ color:'var(--text-primary)' }}>{form.prioridad}</strong>: {DIAS_PRIORIDAD[form.prioridad]} días · se enviará alerta por email al vencer
                  </span>
                </div>
              )}
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
