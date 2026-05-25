import React, { useState, useEffect } from 'react'
import { Plus, X, Trash2, Edit2, Building2, Users, Check, Bell, Layout } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../api.js'
import { LoadingState, ErrorState } from '../components/LoadingState.jsx'
import { ErrorBoundary } from '../components/ErrorBoundary.jsx'

const COLORES  = ['#1B98E0','#22C55E','#F59E0B','#A855F7','#EF4444','#F97316','#06B6D4','#EC4899']
const ROLES    = ['admin','superadmin']
const TIPOS_ED = ['edificio','condominio']

const MODULOS_LISTA = [
  { id:'gastos',      label:'Gastos Comunes'     },
  { id:'consumos',    label:'Consumos Agua/Luz'  },
  { id:'recaudacion', label:'Recaudación GGCC'   },
  { id:'rondas',      label:'Rondas de Seguridad'},
  { id:'incidentes',  label:'Incidentes'         },
  { id:'ordenes',     label:'Órdenes de Trabajo' },
]

const EVENTOS_NOTIF = [
  { id:'todos',               label:'Todos los eventos de incidentes' },
  { id:'incidente_creado',    label:'Incidente creado (nuevo)'        },
  { id:'incidente_actualizado',label:'Incidente actualizado / comentado'},
]

const EMPTY_ED = { nombre:'', direccion:'', unidades:'', color:'#1B98E0', activo:'true', tipo:'edificio', modulos:'gastos,consumos,rondas,incidentes,ordenes,recaudacion' }
const EMPTY_US = { nombre:'', email:'', password:'', rol:'admin', edificios_ids:'' }
const EMPTY_NF = { edificio_id:'', nombre:'', evento:'todos', emails:'', activo:'true' }

function normIds(val) { return !val && val !== 0 ? '' : String(val).trim() }
function splitIds(val) { return normIds(val).split(',').map(s=>s.trim()).filter(Boolean) }

export default function Mantenedor() {
  const { token, refreshEdificios } = useAuth()
  const [tab, setTab] = useState('edificios')

  const [edificios,  setEdificios]  = useState([])
  const [loadingEd,  setLoadingEd]  = useState(true)
  const [errorEd,    setErrorEd]    = useState(null)
  const [modalEd,    setModalEd]    = useState(false)
  const [editEd,     setEditEd]     = useState(null)
  const [formEd,     setFormEd]     = useState(EMPTY_ED)
  const [savingEd,   setSavingEd]   = useState(false)

  const [usuarios,   setUsuarios]   = useState([])
  const [loadingUs,  setLoadingUs]  = useState(false)
  const [errorUs,    setErrorUs]    = useState(null)
  const [modalUs,    setModalUs]    = useState(false)
  const [editUs,     setEditUs]     = useState(null)
  const [formUs,     setFormUs]     = useState(EMPTY_US)
  const [savingUs,   setSavingUs]   = useState(false)

  const [notifs,     setNotifs]     = useState([])
  const [loadingNf,  setLoadingNf]  = useState(false)
  const [errorNf,    setErrorNf]    = useState(null)
  const [modalNf,    setModalNf]    = useState(false)
  const [editNf,     setEditNf]     = useState(null)
  const [formNf,     setFormNf]     = useState(EMPTY_NF)
  const [savingNf,   setSavingNf]   = useState(false)

  useEffect(() => { loadEdificios() }, [])
  useEffect(() => { if (tab==='usuarios' && !usuarios.length) loadUsuarios() }, [tab])
  useEffect(() => { if (tab==='notificaciones' && !notifs.length) loadNotifs() }, [tab])

  async function loadEdificios() { setLoadingEd(true); setErrorEd(null); try { setEdificios(await api.getEdificios(token)) } catch(e){ setErrorEd(e.message) } finally { setLoadingEd(false) } }
  async function loadUsuarios()  { setLoadingUs(true); setErrorUs(null); try { setUsuarios(await api.getUsuarios(token)) }  catch(e){ setErrorUs(e.message)  } finally { setLoadingUs(false) } }
  async function loadNotifs()    { setLoadingNf(true); setErrorNf(null); try { setNotifs(await api.getNotifConfig(token)) } catch(e){ setErrorNf(e.message)  } finally { setLoadingNf(false) } }

  // ── Edificios ────────────────────────────────────────────────
  function openNewEd()   { setEditEd(null); setFormEd(EMPTY_ED); setModalEd(true) }
  function openEditEd(e) {
    setEditEd(e)
    const mods = normIds(e.modulos) || 'gastos,consumos,rondas,incidentes,ordenes,recaudacion'
    setFormEd({ nombre:String(e.nombre||''), direccion:String(e.direccion||''), unidades:String(e.unidades||''), color:String(e.color||'#1B98E0'), activo:String(e.activo||'true'), tipo:String(e.tipo||'edificio'), modulos:mods })
    setModalEd(true)
  }

  async function saveEd() {
    if (!formEd.nombre) return
    setSavingEd(true)
    try {
      if (editEd) { await api.updateEdificio(token, editEd.id, formEd); setEdificios(es=>es.map(e=>String(e.id)===String(editEd.id)?{...e,...formEd}:e)) }
      else        { const c=await api.createEdificio(token,formEd); setEdificios(es=>[...es,c]) }
      await refreshEdificios(); setModalEd(false)
    } catch(e){ alert('Error: '+e.message) } finally { setSavingEd(false) }
  }

  async function deleteEd(id) {
    if(!confirm('¿Eliminar edificio y todos sus datos?')) return
    try { await api.deleteEdificio(token,id); setEdificios(es=>es.filter(e=>String(e.id)!==String(id))); await refreshEdificios() } catch(e){ alert('Error: '+e.message) }
  }

  function toggleModulo(mod) {
    const list = splitIds(formEd.modulos)
    const next = list.includes(mod) ? list.filter(m=>m!==mod) : [...list,mod]
    setFormEd(f=>({...f, modulos:next.join(',')}))
  }

  // ── Usuarios ─────────────────────────────────────────────────
  function openNewUs()   { setEditUs(null); setFormUs(EMPTY_US); setModalUs(true) }
  function openEditUs(u) { setEditUs(u); setFormUs({ nombre:String(u.nombre||''), email:String(u.email||''), password:'', rol:String(u.rol||'admin'), edificios_ids:normIds(u.edificios_ids) }); setModalUs(true) }

  async function saveUs() {
    if(!formUs.nombre||!formUs.email) return
    if(!editUs&&!formUs.password) return
    setSavingUs(true)
    try {
      const d={...formUs}; if(!d.password)delete d.password
      if(editUs) await api.updateUsuario(token,editUs.id,d)
      else       await api.createUsuario(token,d)
      setModalUs(false); await loadUsuarios()
    } catch(e){ alert('Error: '+e.message) } finally { setSavingUs(false) }
  }

  async function deleteUs(id) {
    if(!confirm('¿Eliminar usuario?')) return
    try { await api.deleteUsuario(token,id); setUsuarios(us=>us.filter(u=>String(u.id)!==String(id))) } catch(e){ alert('Error: '+e.message) }
  }

  // ── Notificaciones ────────────────────────────────────────────
  function openNewNf()   { setEditNf(null); setFormNf(EMPTY_NF); setModalNf(true) }
  function openEditNf(n) { setEditNf(n); setFormNf({ edificio_id:String(n.edificio_id||''), nombre:String(n.nombre||''), evento:String(n.evento||'todos'), emails:String(n.emails||''), activo:String(n.activo||'true') }); setModalNf(true) }

  async function saveNf() {
    if(!formNf.emails||!formNf.edificio_id) return
    setSavingNf(true)
    try {
      if(editNf) await api.updateNotifConfig(token,editNf.id,formNf)
      else       await api.createNotifConfig(token,formNf)
      setModalNf(false); await loadNotifs()
    } catch(e){ alert('Error: '+e.message) } finally { setSavingNf(false) }
  }

  async function deleteNf(id) {
    if(!confirm('¿Eliminar configuración?')) return
    try { await api.deleteNotifConfig(token,id); setNotifs(ns=>ns.filter(n=>String(n.id)!==String(id))) } catch(e){ alert('Error: '+e.message) }
  }

  function renderEdBadges(ids_str) {
    return splitIds(ids_str).map(id=>{
      const ed=edificios.find(e=>String(e.id)===id)
      return ed?<span key={id} style={{ display:'inline-flex',alignItems:'center',gap:4,background:'var(--bg-elevated)',border:'1px solid var(--border-subtle)',borderRadius:5,padding:'2px 7px',fontSize:11,marginRight:4 }}>{ed.nombre}</span>:null
    })
  }

  const TABS = [
    { id:'edificios',      icon:Building2, label:'Edificios'        },
    { id:'usuarios',       icon:Users,     label:'Usuarios'         },
    { id:'notificaciones', icon:Bell,      label:'Notificaciones'   },
  ]

  return (
    <div className="page">
      <div className="page-header">
        <div><h1>Mantenedor</h1><p>Configuración del sistema</p></div>
        <button className="btn btn-primary" onClick={tab==='edificios'?openNewEd:tab==='usuarios'?openNewUs:openNewNf}>
          <Plus size={16}/> {tab==='edificios'?'Nuevo Edificio':tab==='usuarios'?'Nuevo Usuario':'Nueva Regla'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:24, background:'var(--bg-surface)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-lg)', padding:5, width:'fit-content', flexWrap:'wrap' }}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{ display:'flex',alignItems:'center',gap:7,padding:'8px 18px',borderRadius:'var(--radius-md)',border:'none',cursor:'pointer',fontFamily:'var(--font-sans)',fontSize:13.5,fontWeight:500,transition:'all 0.15s',
              background:tab===t.id?'var(--accent)':'transparent', color:tab===t.id?'white':'var(--text-muted)' }}>
            <t.icon size={15}/>{t.label}
          </button>
        ))}
      </div>

      {/* ── Edificios ── */}
      {tab==='edificios' && (
        <ErrorBoundary>
          {loadingEd?<LoadingState label="Cargando edificios..."/>:errorEd?<ErrorState message={errorEd} onRetry={loadEdificios}/>:
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
            {edificios.length===0 && <div className="card"><div className="empty-state"><Building2 size={32}/><p>Sin edificios</p></div></div>}
            {edificios.map(ed=>(
              <div key={String(ed.id)} className="card" style={{ padding:'20px 22px', borderTop:`3px solid ${ed.color||'var(--accent)'}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:42,height:42,borderRadius:12,background:ed.color||'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}><Building2 size={18} color="white"/></div>
                    <div>
                      <p style={{ fontWeight:700,color:'var(--text-primary)',fontSize:15 }}>{String(ed.nombre||'')}</p>
                      <p style={{ fontSize:12,color:'var(--text-muted)',marginTop:2 }}>{String(ed.direccion||'')}</p>
                    </div>
                  </div>
                  <div style={{ display:'flex',gap:6 }}>
                    <button className="btn btn-icon btn-ghost" onClick={()=>openEditEd(ed)}><Edit2 size={14}/></button>
                    <button className="btn btn-icon btn-danger" onClick={()=>deleteEd(ed.id)}><Trash2 size={14}/></button>
                  </div>
                </div>
                <div style={{ display:'flex', gap:10, marginTop:14, flexWrap:'wrap' }}>
                  <span className="badge badge-blue">{String(ed.tipo||'edificio')}</span>
                  <span className={`badge ${String(ed.activo)==='true'?'badge-green':'badge-red'}`}>{String(ed.activo)==='true'?'Activo':'Inactivo'}</span>
                  <span className="badge badge-yellow">{ed.unidades||0} unid.</span>
                </div>
                {/* Módulos activos */}
                <div style={{ marginTop:12 }}>
                  <p style={{ fontSize:10.5,color:'var(--text-dim)',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.04em',marginBottom:6 }}>Módulos activos</p>
                  <div style={{ display:'flex',flexWrap:'wrap',gap:4 }}>
                    {MODULOS_LISTA.filter(m=>splitIds(ed.modulos).includes(m.id)).map(m=>(
                      <span key={m.id} style={{ fontSize:10.5,background:'var(--accent-glow)',color:'var(--accent-text)',padding:'2px 7px',borderRadius:4 }}>{m.label}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>}
        </ErrorBoundary>
      )}

      {/* ── Usuarios ── */}
      {tab==='usuarios' && (
        <ErrorBoundary>
          {loadingUs?<LoadingState label="Cargando usuarios..."/>:errorUs?<ErrorState message={errorUs} onRetry={loadUsuarios}/>:
          <div className="card" style={{ padding:0,overflow:'hidden' }}>
            <div className="table-wrap"><table>
              <thead><tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Edificios</th><th></th></tr></thead>
              <tbody>
                {usuarios.length===0
                  ?<tr><td colSpan={5}><div className="empty-state"><Users size={32}/><p>Sin usuarios</p></div></td></tr>
                  :usuarios.map((u,idx)=>(
                  <tr key={String(u.id??idx)}>
                    <td style={{ color:'var(--text-primary)',fontWeight:500 }}>
                      <div style={{ display:'flex',alignItems:'center',gap:9 }}>
                        <div style={{ width:30,height:30,borderRadius:'50%',background:'var(--accent-soft)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'white',flexShrink:0 }}>
                          {String(u.nombre||'U').slice(0,2).toUpperCase()}
                        </div>{String(u.nombre||'')}
                      </div>
                    </td>
                    <td style={{ fontFamily:'var(--font-mono)',fontSize:12.5 }}>{String(u.email||'')}</td>
                    <td><span className={`badge ${String(u.rol)==='superadmin'?'badge-purple':'badge-blue'}`}>{String(u.rol||'admin')}</span></td>
                    <td style={{ fontSize:12 }}>{renderEdBadges(u.edificios_ids)}</td>
                    <td><div style={{ display:'flex',gap:6 }}>
                      <button className="btn btn-icon btn-ghost" onClick={()=>openEditUs(u)}><Edit2 size={14}/></button>
                      <button className="btn btn-icon btn-danger" onClick={()=>deleteUs(u.id)}><Trash2 size={14}/></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>}
        </ErrorBoundary>
      )}

      {/* ── Notificaciones ── */}
      {tab==='notificaciones' && (
        <ErrorBoundary>
          <div style={{ marginBottom:16, padding:'14px 18px', background:'var(--bg-elevated)', borderRadius:'var(--radius-md)', border:'1px solid var(--border-subtle)', fontSize:13, color:'var(--text-muted)', lineHeight:1.6 }}>
            <strong style={{ color:'var(--text-primary)' }}>📧 Notificaciones por email</strong><br/>
            Configura a qué correos se envían alertas cuando ocurren eventos en incidentes. Usa <strong>Google Apps Script MailApp</strong> (hasta 100 emails/día gratis). Puedes agregar múltiples correos separados por coma.
          </div>
          {loadingNf?<LoadingState label="Cargando..."/>:errorNf?<ErrorState message={errorNf} onRetry={loadNotifs}/>:
          <div className="card" style={{ padding:0,overflow:'hidden' }}>
            <div className="table-wrap"><table>
              <thead><tr><th>Nombre/Descripción</th><th>Edificio</th><th>Evento</th><th>Correos</th><th>Activo</th><th></th></tr></thead>
              <tbody>
                {notifs.length===0
                  ?<tr><td colSpan={6}><div className="empty-state"><Bell size={32}/><p>Sin reglas configuradas</p></div></td></tr>
                  :notifs.map((n,idx)=>{
                    const ed=edificios.find(e=>String(e.id)===String(n.edificio_id))
                    const ev=EVENTOS_NOTIF.find(e=>e.id===n.evento)
                    return (
                      <tr key={String(n.id??idx)}>
                        <td style={{ fontWeight:500,color:'var(--text-primary)' }}>{n.nombre}</td>
                        <td>{ed?<span className="badge badge-blue">{ed.nombre}</span>:<span style={{ color:'var(--text-dim)' }}>ID:{n.edificio_id}</span>}</td>
                        <td style={{ fontSize:12.5 }}>{ev?.label||n.evento}</td>
                        <td style={{ fontFamily:'var(--font-mono)',fontSize:11.5,maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{n.emails}</td>
                        <td><span className={`badge ${String(n.activo)==='true'?'badge-green':'badge-red'}`}>{String(n.activo)==='true'?'Sí':'No'}</span></td>
                        <td><div style={{ display:'flex',gap:6 }}>
                          <button className="btn btn-icon btn-ghost" onClick={()=>openEditNf(n)}><Edit2 size={14}/></button>
                          <button className="btn btn-icon btn-danger" onClick={()=>deleteNf(n.id)}><Trash2 size={14}/></button>
                        </div></td>
                      </tr>
                    )
                  })}
              </tbody>
            </table></div>
          </div>}
        </ErrorBoundary>
      )}

      {/* ── Modal Edificio ── */}
      {modalEd && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setModalEd(false)}>
          <div className="modal" style={{ maxWidth:560 }}>
            <div className="modal-header"><h3>{editEd?'Editar Edificio':'Nuevo Edificio'}</h3>
              <button className="btn btn-icon btn-ghost" onClick={()=>setModalEd(false)}><X size={16}/></button>
            </div>
            <div className="modal-body">
              <div className="grid-2">
                <div className="form-group" style={{ gridColumn:'span 2' }}><label>Nombre *</label>
                  <input className="form-control" value={formEd.nombre} onChange={e=>setFormEd(f=>({...f,nombre:e.target.value}))} placeholder="Ej: Edificio Las Torres"/>
                </div>
                <div className="form-group" style={{ gridColumn:'span 2' }}><label>Dirección</label>
                  <input className="form-control" value={formEd.direccion} onChange={e=>setFormEd(f=>({...f,direccion:e.target.value}))} placeholder="Dirección completa"/>
                </div>
                <div className="form-group"><label>N° Unidades</label>
                  <input className="form-control" type="number" value={formEd.unidades} onChange={e=>setFormEd(f=>({...f,unidades:e.target.value}))} placeholder="0"/>
                </div>
                <div className="form-group"><label>Tipo</label>
                  <select className="form-control" value={formEd.tipo} onChange={e=>setFormEd(f=>({...f,tipo:e.target.value}))}>
                    {TIPOS_ED.map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Estado</label>
                  <select className="form-control" value={formEd.activo} onChange={e=>setFormEd(f=>({...f,activo:e.target.value}))}>
                    <option value="true">Activo</option><option value="false">Inactivo</option>
                  </select>
                </div>
                <div className="form-group"><label>Color</label>
                  <div style={{ display:'flex',gap:8,flexWrap:'wrap',marginTop:4 }}>
                    {COLORES.map(c=>(
                      <button key={c} type="button" onClick={()=>setFormEd(f=>({...f,color:c}))}
                        style={{ width:32,height:32,borderRadius:8,background:c,border:`3px solid ${formEd.color===c?'white':'transparent'}`,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:formEd.color===c?`0 0 0 2px ${c}`:'none' }}>
                        {formEd.color===c&&<Check size={13} color="white"/>}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Módulos */}
                <div className="form-group" style={{ gridColumn:'span 2' }}>
                  <label>Módulos activos</label>
                  <div style={{ display:'flex',flexDirection:'column',gap:8,marginTop:4 }}>
                    {MODULOS_LISTA.map(m=>{
                      const active=splitIds(formEd.modulos).includes(m.id)
                      return (
                        <label key={m.id} onClick={()=>toggleModulo(m.id)} style={{ display:'flex',alignItems:'center',gap:10,cursor:'pointer',padding:'8px 12px',borderRadius:'var(--radius-md)',background:active?'var(--accent-glow)':'var(--bg-elevated)',border:`1px solid ${active?'rgba(27,152,224,0.3)':'var(--border-subtle)'}`,transition:'all 0.12s',userSelect:'none' }}>
                          <div style={{ width:20,height:20,borderRadius:5,background:active?'var(--accent)':'var(--border-main)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                            {active&&<Check size={12} color="white"/>}
                          </div>
                          <span style={{ fontSize:13.5,color:active?'var(--accent-text)':'var(--text-secondary)',fontWeight:active?600:400 }}>{m.label}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={()=>setModalEd(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={saveEd} disabled={savingEd}>{savingEd?'Guardando...':editEd?'Guardar':'Crear Edificio'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Usuario ── */}
      {modalUs && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setModalUs(false)}>
          <div className="modal">
            <div className="modal-header"><h3>{editUs?'Editar Usuario':'Nuevo Usuario'}</h3>
              <button className="btn btn-icon btn-ghost" onClick={()=>setModalUs(false)}><X size={16}/></button>
            </div>
            <div className="modal-body">
              <div className="grid-2">
                <div className="form-group"><label>Nombre *</label>
                  <input className="form-control" value={formUs.nombre} onChange={e=>setFormUs(f=>({...f,nombre:e.target.value}))} placeholder="Nombre completo"/>
                </div>
                <div className="form-group"><label>Rol</label>
                  <select className="form-control" value={formUs.rol} onChange={e=>setFormUs(f=>({...f,rol:e.target.value}))}>{ROLES.map(r=><option key={r}>{r}</option>)}</select>
                </div>
                <div className="form-group" style={{ gridColumn:'span 2' }}><label>Email *</label>
                  <input className="form-control" type="email" value={formUs.email} onChange={e=>setFormUs(f=>({...f,email:e.target.value}))} placeholder="correo@ejemplo.cl"/>
                </div>
                <div className="form-group" style={{ gridColumn:'span 2' }}>
                  <label>{editUs?'Nueva Contraseña (vacío = sin cambio)':'Contraseña *'}</label>
                  <input className="form-control" type="password" value={formUs.password} onChange={e=>setFormUs(f=>({...f,password:e.target.value}))} placeholder="••••••••"/>
                </div>
                <div className="form-group" style={{ gridColumn:'span 2' }}><label>Edificios Asignados</label>
                  <div style={{ display:'flex',flexDirection:'column',gap:8,marginTop:4 }}>
                    {edificios.length===0?<p style={{ fontSize:12,color:'var(--text-dim)' }}>Crea edificios primero.</p>
                    :edificios.map(ed=>{
                      const ids=splitIds(formUs.edificios_ids); const checked=ids.includes(String(ed.id))
                      return (
                        <label key={String(ed.id)} onClick={()=>{const next=checked?ids.filter(i=>i!==String(ed.id)):[...ids,String(ed.id)];setFormUs(f=>({...f,edificios_ids:next.join(',')}))}}
                          style={{ display:'flex',alignItems:'center',gap:10,cursor:'pointer',padding:'8px 12px',borderRadius:'var(--radius-md)',background:checked?'var(--accent-glow)':'var(--bg-elevated)',border:`1px solid ${checked?'rgba(27,152,224,0.3)':'var(--border-subtle)'}`,transition:'all 0.12s',userSelect:'none' }}>
                          <div style={{ width:20,height:20,borderRadius:5,background:checked?'var(--accent)':'var(--border-main)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                            {checked&&<Check size={12} color="white"/>}
                          </div>
                          <div style={{ width:22,height:22,borderRadius:6,background:ed.color||'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center' }}><Building2 size={11} color="white"/></div>
                          <span style={{ fontSize:13.5,color:checked?'var(--accent-text)':'var(--text-secondary)',fontWeight:checked?600:400 }}>{String(ed.nombre||'')}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={()=>setModalUs(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={saveUs} disabled={savingUs}>{savingUs?'Guardando...':editUs?'Guardar':'Crear Usuario'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Notificación ── */}
      {modalNf && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setModalNf(false)}>
          <div className="modal">
            <div className="modal-header"><h3>{editNf?'Editar Regla':'Nueva Regla de Notificación'}</h3>
              <button className="btn btn-icon btn-ghost" onClick={()=>setModalNf(false)}><X size={16}/></button>
            </div>
            <div className="modal-body">
              <div className="form-group"><label>Nombre / Descripción *</label>
                <input className="form-control" value={formNf.nombre} onChange={e=>setFormNf(f=>({...f,nombre:e.target.value}))} placeholder="Ej: Alertas Urgentes Edificio A"/>
              </div>
              <div className="form-group"><label>Edificio *</label>
                <select className="form-control" value={formNf.edificio_id} onChange={e=>setFormNf(f=>({...f,edificio_id:e.target.value}))}>
                  <option value="">Seleccionar...</option>
                  {edificios.map(ed=><option key={String(ed.id)} value={String(ed.id)}>{ed.nombre}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Evento que activa el envío</label>
                <select className="form-control" value={formNf.evento} onChange={e=>setFormNf(f=>({...f,evento:e.target.value}))}>
                  {EVENTOS_NOTIF.map(ev=><option key={ev.id} value={ev.id}>{ev.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Correos destinatarios *</label>
                <textarea className="form-control" value={formNf.emails} onChange={e=>setFormNf(f=>({...f,emails:e.target.value}))} placeholder="admin@empresa.cl, gerencia@empresa.cl" style={{ minHeight:70 }}/>
                <p style={{ fontSize:11.5,color:'var(--text-dim)',marginTop:5 }}>Separa múltiples correos con coma.</p>
              </div>
              <div className="form-group"><label>Estado</label>
                <select className="form-control" value={formNf.activo} onChange={e=>setFormNf(f=>({...f,activo:e.target.value}))}>
                  <option value="true">Activo</option><option value="false">Inactivo</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={()=>setModalNf(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={saveNf} disabled={savingNf}>{savingNf?'Guardando...':editNf?'Guardar':'Crear Regla'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
