import React, { useState } from 'react'
import { Plus, Search, Trash2, X, Droplets, Zap } from 'lucide-react'
import { useStore, nextId } from '../hooks/useStore.js'

const TIPOS   = ['Agua','Luz']
const ESTADOS = ['Pendiente','Facturado','Pagado']
const MESES   = ['2025-04','2025-03','2025-02','2025-01']
const UNIDADES = ['Depto 101','Depto 102','Depto 103','Depto 201','Depto 202','Depto 203','Depto 301','Depto 302','Depto 303']

const EMPTY = { tipo:'Agua', unidad:'Depto 101', lectura_anterior:'', lectura_actual:'', mes:'2025-04', costo_unitario:'', estado:'Pendiente' }

export default function Consumos() {
  const [consumos, update] = useStore(s => s.consumos)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [search, setSearch] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('Todos')
  const [filtroMes, setFiltroMes] = useState('2025-04')

  const filtered = consumos.filter(c => {
    const matchQ = c.unidad.toLowerCase().includes(search.toLowerCase())
    const matchT = filtroTipo === 'Todos' || c.tipo === filtroTipo
    const matchM = !filtroMes || c.mes === filtroMes
    return matchQ && matchT && matchM
  })

  const totalConsumoAgua = filtered.filter(c=>c.tipo==='Agua').reduce((a,c)=>a+(c.lectura_actual-c.lectura_anterior),0)
  const totalConsumoLuz  = filtered.filter(c=>c.tipo==='Luz').reduce((a,c)=>a+(c.lectura_actual-c.lectura_anterior),0)
  const totalMonto = filtered.reduce((a,c) => a + (c.lectura_actual - c.lectura_anterior) * c.costo_unitario, 0)

  function save() {
    if (!form.lectura_anterior || !form.lectura_actual || !form.costo_unitario) return
    update('consumos', cs => [...cs, { ...form, id: nextId(cs), lectura_anterior: Number(form.lectura_anterior), lectura_actual: Number(form.lectura_actual), costo_unitario: Number(form.costo_unitario) }])
    setModal(false); setForm(EMPTY)
  }

  function del(id) { update('consumos', cs => cs.filter(c => c.id !== id)) }

  const estadoClass = { Pendiente:'badge-yellow', Facturado:'badge-blue', Pagado:'badge-green' }

  return (
    <div className="page">
      <div className="page-header">
        <div><h1>Consumos</h1><p>Lectura de agua y electricidad por unidad</p></div>
        <button className="btn btn-primary" onClick={() => { setForm(EMPTY); setModal(true) }}>
          <Plus size={16} /> Registrar Lectura
        </button>
      </div>

      <div className="grid-3" style={{ marginBottom:20 }}>
        <div className="card" style={{ padding:'16px 20px', display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:40, height:40, borderRadius:10, background:'rgba(34,197,94,0.12)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Droplets size={18} color="var(--green)" />
          </div>
          <div>
            <p style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>Consumo Agua</p>
            <p style={{ fontSize:22, fontWeight:700, color:'var(--green)' }}>{totalConsumoAgua} m³</p>
          </div>
        </div>
        <div className="card" style={{ padding:'16px 20px', display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:40, height:40, borderRadius:10, background:'var(--yellow-soft)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Zap size={18} color="var(--yellow)" />
          </div>
          <div>
            <p style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>Consumo Luz</p>
            <p style={{ fontSize:22, fontWeight:700, color:'var(--yellow)' }}>{totalConsumoLuz} kWh</p>
          </div>
        </div>
        <div className="card" style={{ padding:'16px 20px' }}>
          <p style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>Monto Total</p>
          <p style={{ fontSize:22, fontWeight:700, color:'var(--accent-text)', marginTop:4 }}>${totalMonto.toLocaleString('es-CL')}</p>
        </div>
      </div>

      <div className="filters-row">
        <div className="search-bar">
          <Search size={15} />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar unidad..." />
        </div>
        <select className="form-control" style={{ width:'auto' }} value={filtroTipo} onChange={e=>setFiltroTipo(e.target.value)}>
          <option>Todos</option>
          {TIPOS.map(t=><option key={t}>{t}</option>)}
        </select>
        <select className="form-control" style={{ width:'auto' }} value={filtroMes} onChange={e=>setFiltroMes(e.target.value)}>
          {MESES.map(m=><option key={m}>{m}</option>)}
        </select>
      </div>

      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Unidad</th>
                <th>Mes</th>
                <th>Lect. Anterior</th>
                <th>Lect. Actual</th>
                <th>Consumo</th>
                <th>Costo Unit.</th>
                <th>Total</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={10}><div className="empty-state"><Droplets size={32} /><p>Sin consumos registrados</p></div></td></tr>
              ) : filtered.map(c => {
                const consumo = c.lectura_actual - c.lectura_anterior
                const total = consumo * c.costo_unitario
                return (
                  <tr key={c.id}>
                    <td>
                      <span style={{ display:'flex', alignItems:'center', gap:6 }}>
                        {c.tipo==='Agua' ? <Droplets size={14} color="var(--green)" /> : <Zap size={14} color="var(--yellow)" />}
                        <span style={{ color:'var(--text-primary)', fontWeight:500 }}>{c.tipo}</span>
                      </span>
                    </td>
                    <td>{c.unidad}</td>
                    <td style={{ fontFamily:'var(--font-mono)', fontSize:12 }}>{c.mes}</td>
                    <td style={{ fontFamily:'var(--font-mono)' }}>{c.lectura_anterior.toLocaleString()}</td>
                    <td style={{ fontFamily:'var(--font-mono)' }}>{c.lectura_actual.toLocaleString()}</td>
                    <td style={{ fontFamily:'var(--font-mono)', fontWeight:600, color:'var(--text-primary)' }}>
                      {consumo} {c.tipo==='Agua'?'m³':'kWh'}
                    </td>
                    <td style={{ fontFamily:'var(--font-mono)' }}>${c.costo_unitario}</td>
                    <td style={{ fontFamily:'var(--font-mono)', fontWeight:600, color:'var(--accent-text)' }}>${total.toLocaleString('es-CL')}</td>
                    <td><span className={`badge ${estadoClass[c.estado]}`}>{c.estado}</span></td>
                    <td><button className="btn btn-icon btn-danger" onClick={() => del(c.id)}><Trash2 size={14} /></button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Registrar Lectura de Consumo</h3>
              <button className="btn btn-icon btn-ghost" onClick={() => setModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="grid-2">
                <div className="form-group">
                  <label>Tipo *</label>
                  <select className="form-control" value={form.tipo} onChange={e=>setForm(f=>({...f,tipo:e.target.value}))}>
                    {TIPOS.map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Mes *</label>
                  <select className="form-control" value={form.mes} onChange={e=>setForm(f=>({...f,mes:e.target.value}))}>
                    {MESES.map(m=><option key={m}>{m}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn:'span 2' }}>
                  <label>Unidad *</label>
                  <select className="form-control" value={form.unidad} onChange={e=>setForm(f=>({...f,unidad:e.target.value}))}>
                    {UNIDADES.map(u=><option key={u}>{u}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Lectura Anterior *</label>
                  <input className="form-control" type="number" value={form.lectura_anterior} onChange={e=>setForm(f=>({...f,lectura_anterior:e.target.value}))} placeholder="0" />
                </div>
                <div className="form-group">
                  <label>Lectura Actual *</label>
                  <input className="form-control" type="number" value={form.lectura_actual} onChange={e=>setForm(f=>({...f,lectura_actual:e.target.value}))} placeholder="0" />
                </div>
                <div className="form-group">
                  <label>Costo Unitario ($/unidad)</label>
                  <input className="form-control" type="number" value={form.costo_unitario} onChange={e=>setForm(f=>({...f,costo_unitario:e.target.value}))} placeholder="0" />
                </div>
                <div className="form-group">
                  <label>Estado</label>
                  <select className="form-control" value={form.estado} onChange={e=>setForm(f=>({...f,estado:e.target.value}))}>
                    {ESTADOS.map(e=><option key={e}>{e}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={save}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
