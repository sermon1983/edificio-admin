import React, { useState } from 'react'
import { Plus, Search, Trash2, X, DollarSign, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { useSheetData } from '../hooks/useSheetData.js'
import { useAuth } from '../context/AuthContext.jsx'
import { LoadingState, ErrorState } from '../components/LoadingState.jsx'

const ESTADOS = ['Pendiente','Pagado Parcial','Pagado','Vencido']
const EMPTY   = { periodo:'', unidad:'', propietario:'', monto:'', fecha_vencimiento:'', fecha_pago:'', estado:'Pendiente', observaciones:'' }

// Genera lista de periodos últimos 12 meses
function getPeriodos() {
  const p = []
  const d = new Date()
  for (let i = 0; i < 24; i++) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    p.push(`${y}-${m}`)
    d.setMonth(d.getMonth() - 1)
  }
  return p
}

const PERIODOS = getPeriodos()

export default function Recaudacion() {
  const { building } = useAuth()
  const { data: recaudacion, loading, error, create, update, remove, reload } = useSheetData('recaudacion')

  const [modal,   setModal]   = useState(false)
  const [editItem,setEditItem]= useState(null)
  const [form,    setForm]    = useState(EMPTY)
  const [saving,  setSaving]  = useState(false)
  const [search,  setSearch]  = useState('')
  const [filtroEstado, setFiltroEstado] = useState('Todos')
  const [filtroPeriodo,setFiltroPeriodo]= useState('')

  const tipoUnidad = building?.tipo === 'condominio' ? 'Casa/Parcela' : 'Departamento'

  const filtered = recaudacion.filter(r => {
    const q = search.toLowerCase()
    return (
      (String(r.unidad||'').toLowerCase().includes(q) || String(r.propietario||'').toLowerCase().includes(q)) &&
      (filtroEstado === 'Todos' || r.estado === filtroEstado) &&
      (!filtroPeriodo || String(r.periodo||'').slice(0,7) === filtroPeriodo)
    )
  })

  const totalMonto    = filtered.reduce((a,r) => a + Number(r.monto||0), 0)
  const totalPagado   = filtered.filter(r=>r.estado==='Pagado').reduce((a,r)=>a+Number(r.monto||0),0)
  const totalPendiente= filtered.filter(r=>r.estado==='Pendiente'||r.estado==='Vencido').reduce((a,r)=>a+Number(r.monto||0),0)
  const totalParcial  = filtered.filter(r=>r.estado==='Pagado Parcial').reduce((a,r)=>a+Number(r.monto||0),0)

  function openNew() { setEditItem(null); setForm(EMPTY); setModal(true) }
  function openEdit(r) {
    setEditItem(r)
    setForm({ periodo:r.periodo||'', unidad:r.unidad||'', propietario:r.propietario||'', monto:String(r.monto||''), fecha_vencimiento:r.fecha_vencimiento||'', fecha_pago:r.fecha_pago||'', estado:r.estado||'Pendiente', observaciones:r.observaciones||'' })
    setModal(true)
  }

  async function save() {
    if (!form.unidad || !form.periodo || !form.monto) return
    setSaving(true)
    try {
      const data = { ...form, monto: Number(form.monto) }
      if (editItem) await update(editItem.id, data)
      else          await create(data)
      setModal(false)
    } catch(e) { alert('Error: ' + e.message) }
    finally { setSaving(false) }
  }

  async function del(id) {
    if (!confirm('¿Eliminar este registro?')) return
    try { await remove(id) } catch(e) { alert('Error: ' + e.message) }
  }

  async function marcarPagado(id) {
    const today = new Date().toISOString().slice(0,10)
    try { await update(id, { estado:'Pagado', fecha_pago: today }) } catch(e) { alert('Error: ' + e.message) }
  }

  const estadoIcon  = { Pagado: <CheckCircle size={13} color="var(--green)"/>, Pendiente: <Clock size={13} color="var(--yellow)"/>, 'Pagado Parcial': <Clock size={13} color="var(--accent)"/>, Vencido: <AlertCircle size={13} color="var(--red)"/> }
  const estadoClass = { Pagado:'badge-green', Pendiente:'badge-yellow', 'Pagado Parcial':'badge-blue', Vencido:'badge-red' }

  if (loading) return <LoadingState label="Cargando recaudación..."/>
  if (error)   return <ErrorState message={error} onRetry={reload}/>

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Recaudación GGCC</h1>
          <p>Control de gastos comunes por {tipoUnidad.toLowerCase()} · {building?.nombre}</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}><Plus size={16}/> Nueva Cobranza</button>
      </div>

      {/* Resumen */}
      <div className="grid-4" style={{ marginBottom:20 }}>
        {[
          { label:'Total Emitido',  val:totalMonto,     color:'var(--accent-text)' },
          { label:'Pagado',         val:totalPagado,    color:'var(--green)'       },
          { label:'Pago Parcial',   val:totalParcial,   color:'var(--accent)'      },
          { label:'Pendiente/Vencido', val:totalPendiente, color:'var(--red)'      },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding:'14px 18px' }}>
            <p style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em' }}>{s.label}</p>
            <p style={{ fontSize:20, fontWeight:700, color:s.color, marginTop:4, fontVariantNumeric:'tabular-nums' }}>${Number(s.val).toLocaleString('es-CL')}</p>
          </div>
        ))}
      </div>

      {/* Barra de progreso cobro */}
      {totalMonto > 0 && (
        <div className="card" style={{ padding:'14px 20px', marginBottom:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
            <span style={{ fontSize:13, color:'var(--text-secondary)', fontWeight:500 }}>Avance de cobro</span>
            <span style={{ fontSize:13, fontWeight:700, color:'var(--green)' }}>{Math.round((totalPagado/totalMonto)*100)}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width:`${Math.round((totalPagado/totalMonto)*100)}%`, background:'var(--green)' }}/>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="filters-row">
        <div className="search-bar"><Search size={15}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={`Buscar ${tipoUnidad.toLowerCase()} o propietario...`}/>
        </div>
        <select className="form-control" style={{ width:'auto' }} value={filtroPeriodo} onChange={e=>setFiltroPeriodo(e.target.value)}>
          <option value="">Todos los períodos</option>
          {[...new Set(recaudacion.map(r=>String(r.periodo||'').slice(0,7)).filter(Boolean))].sort().reverse().map(p=><option key={p} value={p}>{p}</option>)}
        </select>
        <select className="form-control" style={{ width:'auto' }} value={filtroEstado} onChange={e=>setFiltroEstado(e.target.value)}>
          <option>Todos</option>{ESTADOS.map(e=><option key={e}>{e}</option>)}
        </select>
      </div>

      {/* Tabla */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>{tipoUnidad}</th><th>Propietario</th><th>Período</th><th>Monto</th><th>Vencimiento</th><th>F. Pago</th><th>Estado</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={8}><div className="empty-state"><DollarSign size={32}/><p>Sin registros de cobro</p></div></td></tr>
                : filtered.map(r => (
                  <tr key={String(r.id)}>
                    <td style={{ fontWeight:600, color:'var(--text-primary)' }}>{r.unidad}</td>
                    <td>{r.propietario}</td>
                    <td style={{ fontFamily:'var(--font-mono)', fontSize:12 }}>{String(r.periodo||'').slice(0,7)}</td>
                    <td style={{ fontFamily:'var(--font-mono)', fontWeight:600, color:'var(--text-primary)' }}>${Number(r.monto||0).toLocaleString('es-CL')}</td>
                    <td style={{ fontFamily:'var(--font-mono)', fontSize:12 }}>{r.fecha_vencimiento}</td>
                    <td style={{ fontFamily:'var(--font-mono)', fontSize:12, color: r.fecha_pago ? 'var(--green)' : 'var(--text-dim)' }}>{r.fecha_pago || '—'}</td>
                    <td><span className={`badge ${estadoClass[r.estado]||'badge-yellow'}`}>{estadoIcon[r.estado]} {r.estado}</span></td>
                    <td>
                      <div style={{ display:'flex', gap:5 }}>
                        {r.estado !== 'Pagado' && (
                          <button className="btn btn-ghost btn-sm" title="Marcar pagado" onClick={() => marcarPagado(r.id)}>
                            <CheckCircle size={13}/>
                          </button>
                        )}
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(r)}>Editar</button>
                        <button className="btn btn-icon btn-danger" onClick={() => del(r.id)}><Trash2 size={13}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>{editItem ? 'Editar Cobranza' : 'Nueva Cobranza GGCC'}</h3>
              <button className="btn btn-icon btn-ghost" onClick={()=>setModal(false)}><X size={16}/></button>
            </div>
            <div className="modal-body">
              <div className="grid-2">
                <div className="form-group">
                  <label>Período *</label>
                  <select className="form-control" value={form.periodo} onChange={e=>setForm(f=>({...f,periodo:e.target.value}))}>
                    <option value="">Seleccionar...</option>
                    {PERIODOS.map(p=><option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Monto (CLP) *</label>
                  <input className="form-control" type="number" value={form.monto} onChange={e=>setForm(f=>({...f,monto:e.target.value}))} placeholder="0"/>
                </div>
                <div className="form-group">
                  <label>{tipoUnidad} *</label>
                  <input className="form-control" value={form.unidad} onChange={e=>setForm(f=>({...f,unidad:e.target.value}))} placeholder={`Ej: ${building?.tipo==='condominio'?'Casa 5 / Parcela 12':'Depto 201'}`}/>
                </div>
                <div className="form-group">
                  <label>Propietario / Residente</label>
                  <input className="form-control" value={form.propietario} onChange={e=>setForm(f=>({...f,propietario:e.target.value}))} placeholder="Nombre"/>
                </div>
                <div className="form-group">
                  <label>Fecha Vencimiento</label>
                  <input className="form-control" type="date" value={form.fecha_vencimiento} onChange={e=>setForm(f=>({...f,fecha_vencimiento:e.target.value}))}/>
                </div>
                <div className="form-group">
                  <label>Estado</label>
                  <select className="form-control" value={form.estado} onChange={e=>setForm(f=>({...f,estado:e.target.value}))}>
                    {ESTADOS.map(e=><option key={e}>{e}</option>)}
                  </select>
                </div>
                {(form.estado==='Pagado'||form.estado==='Pagado Parcial') && (
                  <div className="form-group" style={{ gridColumn:'span 2' }}>
                    <label>Fecha de Pago</label>
                    <input className="form-control" type="date" value={form.fecha_pago} onChange={e=>setForm(f=>({...f,fecha_pago:e.target.value}))}/>
                  </div>
                )}
                <div className="form-group" style={{ gridColumn:'span 2' }}>
                  <label>Observaciones</label>
                  <textarea className="form-control" value={form.observaciones} onChange={e=>setForm(f=>({...f,observaciones:e.target.value}))} placeholder="Notas adicionales..."/>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={()=>setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving?'Guardando...':editItem?'Guardar Cambios':'Crear Cobranza'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
