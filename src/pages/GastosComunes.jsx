import React, { useState } from 'react'
import { Plus, Search, Trash2, X, DollarSign } from 'lucide-react'
import { useStore, nextId } from '../hooks/useStore.js'

const CATEGORIAS = ['Mantención','Servicios','Limpieza','Seguros','Administración','Otros']
const ESTADOS    = ['Pagado','Pendiente','Vencido']

const EMPTY = { concepto:'', monto:'', fecha:'', categoria:'Mantención', estado:'Pendiente', proveedor:'' }

export default function GastosComunes() {
  const [gastos, update] = useStore(s => s.gastos)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('Todos')
  const [filtroCategoria, setFiltroCategoria] = useState('Todas')

  const filtered = gastos.filter(g => {
    const q = search.toLowerCase()
    const matchQ = g.concepto.toLowerCase().includes(q) || g.proveedor.toLowerCase().includes(q)
    const matchE = filtroEstado === 'Todos' || g.estado === filtroEstado
    const matchC = filtroCategoria === 'Todas' || g.categoria === filtroCategoria
    return matchQ && matchE && matchC
  })

  const totalMonto   = filtered.reduce((a,g) => a + g.monto, 0)
  const totalPagado  = filtered.filter(g=>g.estado==='Pagado').reduce((a,g) => a+g.monto, 0)
  const totalPendiente = filtered.filter(g=>g.estado==='Pendiente').reduce((a,g) => a+g.monto, 0)

  function save() {
    if (!form.concepto || !form.monto || !form.fecha) return
    update('gastos', gs => [...gs, { ...form, id: nextId(gs), monto: Number(form.monto) }])
    setModal(false)
    setForm(EMPTY)
  }

  function del(id) {
    update('gastos', gs => gs.filter(g => g.id !== id))
  }

  const estadoClass = { Pagado:'badge-green', Pendiente:'badge-yellow', Vencido:'badge-red' }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Gastos Comunes</h1>
          <p>{gastos.length} registros totales</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(EMPTY); setModal(true) }}>
          <Plus size={16} /> Nuevo Gasto
        </button>
      </div>

      {/* Summary */}
      <div className="grid-3" style={{ marginBottom:20 }}>
        {[
          { label:'Total Período', val: totalMonto, color:'var(--accent-text)' },
          { label:'Pagado', val: totalPagado, color:'var(--green)' },
          { label:'Pendiente', val: totalPendiente, color:'var(--yellow)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding:'16px 20px' }}>
            <p style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600, letterSpacing:'0.05em', textTransform:'uppercase' }}>{s.label}</p>
            <p style={{ fontSize:22, fontWeight:700, color: s.color, marginTop:4, fontVariantNumeric:'tabular-nums' }}>
              ${s.val.toLocaleString('es-CL')}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="filters-row">
        <div className="search-bar">
          <Search size={15} />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar concepto o proveedor..." />
        </div>
        <select className="form-control" style={{ width:'auto' }} value={filtroEstado} onChange={e=>setFiltroEstado(e.target.value)}>
          <option>Todos</option>
          {ESTADOS.map(e => <option key={e}>{e}</option>)}
        </select>
        <select className="form-control" style={{ width:'auto' }} value={filtroCategoria} onChange={e=>setFiltroCategoria(e.target.value)}>
          <option>Todas</option>
          {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Concepto</th>
                <th>Categoría</th>
                <th>Proveedor</th>
                <th>Fecha</th>
                <th>Monto</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7}>
                  <div className="empty-state"><DollarSign size={32} /><p>Sin gastos registrados</p></div>
                </td></tr>
              ) : filtered.map(g => (
                <tr key={g.id}>
                  <td style={{ color:'var(--text-primary)', fontWeight:500 }}>{g.concepto}</td>
                  <td><span className="badge badge-blue">{g.categoria}</span></td>
                  <td>{g.proveedor}</td>
                  <td style={{ fontFamily:'var(--font-mono)', fontSize:12 }}>{g.fecha}</td>
                  <td style={{ fontFamily:'var(--font-mono)', fontWeight:600, color:'var(--text-primary)' }}>
                    ${g.monto.toLocaleString('es-CL')}
                  </td>
                  <td><span className={`badge ${estadoClass[g.estado]}`}>{g.estado}</span></td>
                  <td>
                    <button className="btn btn-icon btn-danger" onClick={() => del(g.id)}><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Nuevo Gasto</h3>
              <button className="btn btn-icon btn-ghost" onClick={() => setModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="grid-2">
                <div className="form-group" style={{ gridColumn:'span 2' }}>
                  <label>Concepto *</label>
                  <input className="form-control" value={form.concepto} onChange={e=>setForm(f=>({...f,concepto:e.target.value}))} placeholder="Ej: Mantención ascensor" />
                </div>
                <div className="form-group">
                  <label>Monto (CLP) *</label>
                  <input className="form-control" type="number" value={form.monto} onChange={e=>setForm(f=>({...f,monto:e.target.value}))} placeholder="0" />
                </div>
                <div className="form-group">
                  <label>Fecha *</label>
                  <input className="form-control" type="date" value={form.fecha} onChange={e=>setForm(f=>({...f,fecha:e.target.value}))} />
                </div>
                <div className="form-group">
                  <label>Categoría</label>
                  <select className="form-control" value={form.categoria} onChange={e=>setForm(f=>({...f,categoria:e.target.value}))}>
                    {CATEGORIAS.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Estado</label>
                  <select className="form-control" value={form.estado} onChange={e=>setForm(f=>({...f,estado:e.target.value}))}>
                    {ESTADOS.map(e=><option key={e}>{e}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn:'span 2' }}>
                  <label>Proveedor</label>
                  <input className="form-control" value={form.proveedor} onChange={e=>setForm(f=>({...f,proveedor:e.target.value}))} placeholder="Nombre del proveedor" />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={save}>Guardar Gasto</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
