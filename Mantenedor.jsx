import React, { useState, useEffect } from 'react'
import { Plus, X, Trash2, Edit2, Building2, Users, Check, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../api.js'
import { LoadingState, ErrorState } from '../components/LoadingState.jsx'

const COLORES = ['#1B98E0','#22C55E','#F59E0B','#A855F7','#EF4444','#F97316','#06B6D4','#EC4899']
const ROLES   = ['admin','superadmin']

const EMPTY_ED = { nombre:'', direccion:'', unidades:'', color:'#1B98E0', activo:'true' }
const EMPTY_US = { nombre:'', email:'', password:'', rol:'admin', edificios_ids:'' }

export default function Mantenedor() {
  const { token, refreshEdificios } = useAuth()
  const [tab, setTab] = useState('edificios')

  // Edificios
  const [edificios, setEdificios] = useState([])
  const [loadingEd, setLoadingEd] = useState(true)
  const [errorEd,   setErrorEd]   = useState(null)
  const [modalEd,   setModalEd]   = useState(false)
  const [editEd,    setEditEd]    = useState(null)
  const [formEd,    setFormEd]    = useState(EMPTY_ED)
  const [savingEd,  setSavingEd]  = useState(false)

  // Usuarios
  const [usuarios, setUsuarios] = useState([])
  const [loadingUs, setLoadingUs] = useState(true)
  const [errorUs,   setErrorUs]   = useState(null)
  const [modalUs,   setModalUs]   = useState(false)
  const [editUs,    setEditUs]    = useState(null)
  const [formUs,    setFormUs]    = useState(EMPTY_US)
  const [savingUs,  setSavingUs]  = useState(false)

  useEffect(() => { loadEdificios(); loadUsuarios() }, [])
  useEffect(() => { if (tab === 'usuarios') loadUsuarios() }, [tab])

  async function loadEdificios() {
    setLoadingEd(true); setErrorEd(null)
    try { setEdificios(await api.getEdificios(token)) }
    catch(e) { setErrorEd(e.message) }
    finally { setLoadingEd(false) }
  }

  async function loadUsuarios() {
    setLoadingUs(true); setErrorUs(null)
    try { setUsuarios(await api.getUsuarios(token)) }
    catch(e) { setErrorUs(e.message) }
    finally { setLoadingUs(false) }
  }

  // ── Edificios CRUD ──────────────────────────────────────────
  function openNewEd()  { setEditEd(null);  setFormEd(EMPTY_ED);  setModalEd(true) }
  function openEditEd(e) { setEditEd(e);    setFormEd({ nombre:e.nombre, direccion:e.direccion, unidades:e.unidades, color:e.color||'#1B98E0', activo:String(e.activo) }); setModalEd(true) }

  async function saveEd() {
    if (!formEd.nombre) return
    setSavingEd(true)
    try {
      if (editEd) {
        await api.updateEdificio(token, editEd.id, formEd)
        setEdificios(es => es.map(e => e.id === editEd.id ? { ...e, ...formEd } : e))
      } else {
        const created = await api.createEdificio(token, formEd)
        setEdificios(es => [...es, created])
      }
      await refreshEdificios()
      setModalEd(false)
    } catch(e) { alert('Error: ' + e.message) }
    finally { setSavingEd(false) }
  }

  async function deleteEd(id) {
    if (!confirm('¿Eliminar este edificio y todos sus datos?')) return
    try {
      await api.deleteEdificio(token, id)
      setEdificios(es => es.filter(e => e.id !== id))
      await refreshEdificios()
    } catch(e) { alert('Error: ' + e.message) }
  }

  // ── Usuarios CRUD ───────────────────────────────────────────
  function openNewUs()  { setEditUs(null);  setFormUs(EMPTY_US);  setModalUs(true) }
  function openEditUs(u) { setEditUs(u);    setFormUs({ nombre:u.nombre, email:u.email, password:'', rol:u.rol, edificios_ids:u.edificios_ids||'' }); setModalUs(true) }

  async function saveUs() {
    if (!formUs.nombre || !formUs.email) return
    if (!editUs && !formUs.password) return
    setSavingUs(true)
    try {
      if (editUs) {
        const data = { ...formUs }
        if (!data.password) delete data.password
        await api.updateUsuario(token, editUs.id, data)
      } else {
        await api.createUsuario(token, formUs)
      }
      setModalUs(false)
      await loadUsuarios()
    } catch(e) { alert('Error: ' + e.message) }
    finally { setSavingUs(false) }
  }

  async function deleteUs(id) {
    if (!confirm('¿Eliminar este usuario?')) return
    try {
      await api.deleteUsuario(token, id)
      setUsuarios(us => us.filter(u => u.id !== id))
    } catch(e) { alert('Error: ' + e.message) }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div><h1>Mantenedor</h1><p>Administración de edificios y usuarios</p></div>
        <button className="btn btn-primary" onClick={tab === 'edificios' ? openNewEd : openNewUs}>
          <Plus size={16}/> {tab === 'edificios' ? 'Nuevo Edificio' : 'Nuevo Usuario'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:24, background:'var(--bg-surface)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-lg)', padding:5, width:'fit-content' }}>
        {[{id:'edificios',icon:Building2,label:'Edificios'},{id:'usuarios',icon:Users,label:'Usuarios'}].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 18px', borderRadius:'var(--radius-md)', border:'none', cursor:'pointer', fontFamily:'var(--font-sans)', fontSize:13.5, fontWeight:500, transition:'all 0.15s',
              background: tab===t.id ? 'var(--accent)' : 'transparent',
              color: tab===t.id ? 'white' : 'var(--text-muted)' }}>
            <t.icon size={15}/>{t.label}
          </button>
        ))}
      </div>

      {/* ── Edificios ── */}
      {tab === 'edificios' && (
        loadingEd ? <LoadingState label="Cargando edificios..."/> :
        errorEd   ? <ErrorState message={errorEd} onRetry={loadEdificios}/> :
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:16 }}>
          {edificios.length === 0 && (
            <div className="card"><div className="empty-state"><Building2 size={32}/><p>Sin edificios creados</p></div></div>
          )}
          {edificios.map(ed => (
            <div key={ed.id} className="card" style={{ padding:'20px 22px', borderTop:`3px solid ${ed.color||'var(--accent)'}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:42, height:42, borderRadius:12, background:ed.color||'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Building2 size={18} color="white"/>
                  </div>
                  <div>
                    <p style={{ fontWeight:700, color:'var(--text-primary)', fontSize:15 }}>{ed.nombre}</p>
                    <p style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{ed.direccion}</p>
                  </div>
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  <button className="btn btn-icon btn-ghost" onClick={() => openEditEd(ed)}><Edit2 size={14}/></button>
                  <button className="btn btn-icon btn-danger" onClick={() => deleteEd(ed.id)}><Trash2 size={14}/></button>
                </div>
              </div>
              <div style={{ display:'flex', gap:16, marginTop:16 }}>
                <div style={{ background:'var(--bg-elevated)', borderRadius:8, padding:'8px 14px', flex:1, textAlign:'center' }}>
                  <p style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em' }}>Unidades</p>
                  <p style={{ fontSize:20, fontWeight:700, color:'var(--text-primary)', marginTop:2 }}>{ed.unidades||'—'}</p>
                </div>
                <div style={{ background:'var(--bg-elevated)', borderRadius:8, padding:'8px 14px', flex:1, textAlign:'center' }}>
                  <p style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em' }}>Estado</p>
                  <p style={{ marginTop:4 }}><span className={`badge ${ed.activo==='true'||ed.activo===true?'badge-green':'badge-red'}`}>{ed.activo==='true'||ed.activo===true?'Activo':'Inactivo'}</span></p>
                </div>
              </div>
              <p style={{ fontSize:11, color:'var(--text-dim)', marginTop:12, fontFamily:'var(--font-mono)' }}>ID: {ed.id}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Usuarios ── */}
      {tab === 'usuarios' && (
        loadingUs ? <LoadingState label="Cargando usuarios..."/> :
        errorUs   ? <ErrorState message={errorUs} onRetry={loadUsuarios}/> :
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Edificios asignados</th><th></th></tr></thead>
              <tbody>
                {usuarios.length === 0
                  ? <tr><td colSpan={5}><div className="empty-state"><Users size={32}/><p>Sin usuarios creados</p></div></td></tr>
                  : usuarios.map(u => (
                    <tr key={u.id}>
                      <td style={{ color:'var(--text-primary)', fontWeight:500 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                          <div style={{ width:30, height:30, borderRadius:'50%', background:'var(--accent-soft)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'white', flexShrink:0 }}>
                            {(u.nombre||'U').slice(0,2).toUpperCase()}
                          </div>
                          {u.nombre}
                        </div>
                      </td>
                      <td style={{ fontFamily:'var(--font-mono)', fontSize:12.5 }}>{u.email}</td>
                      <td><span className={`badge ${u.rol==='superadmin'?'badge-purple':'badge-blue'}`}>{u.rol}</span></td>
                      <td style={{ fontSize:12, color:'var(--text-muted)' }}>
                        {String(u.edificios_ids || '').trim()
                          ? String(u.edificios_ids).split(',').filter(Boolean).map(id => {
                              const ed = edificios.find(e => String(e.id) === id.trim())
                              return ed ? <span key={id} style={{ display:'inline-flex', alignItems:'center', gap:4, background:'var(--bg-elevated)', border:'1px solid var(--border-subtle)', borderRadius:5, padding:'2px 7px', fontSize:11, marginRight:4 }}>{ed.nombre}</span> : null
                            })
                          : <span style={{ color:'var(--text-dim)' }}>Todos</span>}
                      </td>
                      <td>
                        <div style={{ display:'flex', gap:6 }}>
                          <button className="btn btn-icon btn-ghost" onClick={() => openEditUs(u)}><Edit2 size={14}/></button>
                          <button className="btn btn-icon btn-danger" onClick={() => deleteUs(u.id)}><Trash2 size={14}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Edificio */}
      {modalEd && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setModalEd(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>{editEd ? 'Editar Edificio' : 'Nuevo Edificio'}</h3>
              <button className="btn btn-icon btn-ghost" onClick={()=>setModalEd(false)}><X size={16}/></button>
            </div>
            <div className="modal-body">
              <div className="grid-2">
                <div className="form-group" style={{ gridColumn:'span 2' }}>
                  <label>Nombre del Edificio *</label>
                  <input className="form-control" value={formEd.nombre} onChange={e=>setFormEd(f=>({...f,nombre:e.target.value}))} placeholder="Ej: Edificio Las Torres"/>
                </div>
                <div className="form-group" style={{ gridColumn:'span 2' }}>
                  <label>Dirección</label>
                  <input className="form-control" value={formEd.direccion} onChange={e=>setFormEd(f=>({...f,direccion:e.target.value}))} placeholder="Ej: Av. Providencia 1234"/>
                </div>
                <div className="form-group">
                  <label>N° Unidades</label>
                  <input className="form-control" type="number" value={formEd.unidades} onChange={e=>setFormEd(f=>({...f,unidades:e.target.value}))} placeholder="0"/>
                </div>
                <div className="form-group">
                  <label>Estado</label>
                  <select className="form-control" value={formEd.activo} onChange={e=>setFormEd(f=>({...f,activo:e.target.value}))}>
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn:'span 2' }}>
                  <label>Color</label>
                  <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginTop:4 }}>
                    {COLORES.map(c => (
                      <button key={c} type="button" onClick={()=>setFormEd(f=>({...f,color:c}))}
                        style={{ width:34, height:34, borderRadius:8, background:c, border:`3px solid ${formEd.color===c?'white':'transparent'}`, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:formEd.color===c?`0 0 0 2px ${c}`:'none' }}>
                        {formEd.color===c && <Check size={14} color="white"/>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={()=>setModalEd(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={saveEd} disabled={savingEd}>{savingEd?'Guardando...':editEd?'Guardar Cambios':'Crear Edificio'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Usuario */}
      {modalUs && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setModalUs(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>{editUs ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
              <button className="btn btn-icon btn-ghost" onClick={()=>setModalUs(false)}><X size={16}/></button>
            </div>
            <div className="modal-body">
              <div className="grid-2">
                <div className="form-group"><label>Nombre *</label>
                  <input className="form-control" value={formUs.nombre} onChange={e=>setFormUs(f=>({...f,nombre:e.target.value}))} placeholder="Nombre completo"/>
                </div>
                <div className="form-group"><label>Rol</label>
                  <select className="form-control" value={formUs.rol} onChange={e=>setFormUs(f=>({...f,rol:e.target.value}))}>
                    {ROLES.map(r=><option key={r}>{r}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn:'span 2' }}><label>Email *</label>
                  <input className="form-control" type="email" value={formUs.email} onChange={e=>setFormUs(f=>({...f,email:e.target.value}))} placeholder="correo@ejemplo.cl"/>
                </div>
                <div className="form-group" style={{ gridColumn:'span 2' }}>
                  <label>{editUs ? 'Nueva Contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}</label>
                  <input className="form-control" type="password" value={formUs.password} onChange={e=>setFormUs(f=>({...f,password:e.target.value}))} placeholder="••••••••"/>
                </div>
                <div className="form-group" style={{ gridColumn:'span 2' }}>
                  <label>Edificios Asignados</label>
                  <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:4 }}>
                    {edificios.map(ed => {
                      const ids = (formUs.edificios_ids||'').split(',').map(s=>s.trim()).filter(Boolean)
                      const checked = ids.includes(String(ed.id))
                      return (
                        <label key={ed.id} style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', padding:'8px 12px', borderRadius:'var(--radius-md)', background: checked?'var(--accent-glow)':'var(--bg-elevated)', border:`1px solid ${checked?'rgba(27,152,224,0.3)':'var(--border-subtle)'}`, transition:'all 0.12s' }}>
                          <input type="checkbox" checked={checked} style={{ display:'none' }}
                            onChange={()=>{
                              const next = checked ? ids.filter(i=>i!==String(ed.id)) : [...ids, String(ed.id)]
                              setFormUs(f=>({...f,edificios_ids:next.join(',')}))
                            }}/>
                          <div style={{ width:20, height:20, borderRadius:5, background:checked?'var(--accent)':'var(--border-main)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                            {checked && <Check size={12} color="white"/>}
                          </div>
                          <div style={{ width:22, height:22, borderRadius:6, background:ed.color||'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <Building2 size={11} color="white"/>
                          </div>
                          <span style={{ fontSize:13.5, color: checked?'var(--accent-text)':'var(--text-secondary)', fontWeight: checked?600:400 }}>{ed.nombre}</span>
                        </label>
                      )
                    })}
                    {edificios.length === 0 && <p style={{ fontSize:12, color:'var(--text-dim)' }}>Crea edificios primero para asignarlos.</p>}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={()=>setModalUs(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={saveUs} disabled={savingUs}>{savingUs?'Guardando...':editUs?'Guardar Cambios':'Crear Usuario'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
