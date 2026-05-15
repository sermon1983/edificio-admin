import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Receipt, Droplets, AlertTriangle, Wrench, Shield, DollarSign, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useSheetData } from '../hooks/useSheetData.js'
import { useAuth } from '../context/AuthContext.jsx'
import { LoadingState, ErrorState } from '../components/LoadingState.jsx'

const Tip = ({ active, payload, label, prefix='', suffix='' }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'var(--bg-elevated)', border:'1px solid var(--border-main)', borderRadius:8, padding:'10px 14px' }}>
      <p style={{ color:'var(--text-muted)', fontSize:11, marginBottom:4 }}>{label}</p>
      <p style={{ color:'var(--accent-text)', fontWeight:700, fontSize:15 }}>{prefix}{Number(payload[0].value).toLocaleString('es-CL')}{suffix}</p>
    </div>
  )
}

function StatCard({ icon, iconBg, iconColor, label, value, sub, onClick }) {
  return (
    <div className="stat-card" onClick={onClick} style={{ cursor:onClick?'pointer':'default' }}>
      <div className="stat-icon" style={{ background:iconBg }}><span style={{ color:iconColor }}>{icon}</span></div>
      <div className="stat-info">
        <p className="label">{label}</p>
        <p className="value">{value}</p>
        <p className="sub">{sub}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate  = useNavigate()
  const { building } = useAuth()

  const { data: gastos,      loading: l1, error: e1 } = useSheetData('gastos')
  const { data: incidentes,  loading: l2 }             = useSheetData('incidentes')
  const { data: ordenes,     loading: l3 }             = useSheetData('ordenes')
  const { data: rondas,      loading: l4 }             = useSheetData('rondas')
  const { data: recaudacion, loading: l5 }             = useSheetData('recaudacion')

  if (l1||l2||l3||l4||l5) return <LoadingState label="Cargando dashboard..."/>
  if (e1) return <ErrorState message={e1}/>

  // Métricas reales
  const totalGastos        = gastos.reduce((a,g) => a + Number(g.monto||0), 0)
  const gastosPendientes   = gastos.filter(g => g.estado === 'Pendiente').length
  const incidentesAbiertos = incidentes.filter(i => i.estado==='Abierto'||i.estado==='En Proceso').length
  const ordenesPendientes  = ordenes.filter(o => o.estado!=='Completada').length
  const totalRecaudado     = recaudacion.filter(r=>r.estado==='Pagado').reduce((a,r)=>a+Number(r.monto||0),0)
  const totalPorRecaudar   = recaudacion.filter(r=>r.estado!=='Pagado').reduce((a,r)=>a+Number(r.monto||0),0)

  // Gastos por categoría (para gráfico)
  const gastosPorCategoria = Object.entries(
    gastos.reduce((acc, g) => {
      const cat = g.categoria || 'Otros'
      acc[cat]  = (acc[cat] || 0) + Number(g.monto || 0)
      return acc
    }, {})
  ).map(([cat, monto]) => ({ cat, monto })).sort((a,b) => b.monto - a.monto).slice(0,6)

  // Incidentes por tipo (para gráfico)
  const incPorTipo = ['Infraestructura','Convivencia','Equipamiento','Seguridad'].map(tipo => ({
    tipo: tipo.slice(0,7), cnt: incidentes.filter(i=>i.tipo===tipo).length
  })).filter(d => d.cnt > 0)

  const COLORS = ['var(--accent)','var(--yellow)','var(--purple)','var(--red)']

  const tipoUnidad = building?.tipo === 'condominio' ? 'casas/parcelas' : 'deptos'

  return (
    <div className="page">
      {/* Stats */}
      <div className="grid-4" style={{ marginBottom:24 }}>
        <StatCard icon={<Receipt size={20}/>} iconBg="var(--accent-glow)" iconColor="var(--accent-text)"
          label="Gastos del Período" value={totalGastos>0?`$${(totalGastos/1000).toFixed(0)}K`:'$0'}
          sub={`${gastosPendientes} pendientes`} onClick={()=>navigate('/gastos')}/>
        <StatCard icon={<DollarSign size={20}/>} iconBg="rgba(34,197,94,0.12)" iconColor="var(--green)"
          label="GGCC Recaudado" value={totalRecaudado>0?`$${(totalRecaudado/1000).toFixed(0)}K`:'$0'}
          sub={`$${(totalPorRecaudar/1000).toFixed(0)}K por cobrar`} onClick={()=>navigate('/recaudacion')}/>
        <StatCard icon={<AlertTriangle size={20}/>} iconBg="var(--yellow-soft)" iconColor="var(--yellow)"
          label="Incidentes Activos" value={incidentesAbiertos}
          sub={`${incidentes.filter(i=>i.prioridad==='Alta').length} alta prioridad`} onClick={()=>navigate('/incidentes')}/>
        <StatCard icon={<Wrench size={20}/>} iconBg="var(--purple-soft)" iconColor="var(--purple)"
          label="Órdenes Pendientes" value={ordenesPendientes}
          sub={`${ordenes.filter(o=>o.estado==='Completada').length} completadas`} onClick={()=>navigate('/ordenes')}/>
      </div>

      {/* Gráficos */}
      <div className="grid-2" style={{ marginBottom:24 }}>
        <div className="card">
          <p style={{ color:'var(--text-muted)', fontSize:12, fontWeight:600, letterSpacing:'0.05em', textTransform:'uppercase', marginBottom:16 }}>Gastos por Categoría</p>
          {gastosPorCategoria.length === 0
            ? <div className="empty-state" style={{ padding:'32px 0' }}><Receipt size={28}/><p>Sin gastos registrados</p></div>
            : <ResponsiveContainer width="100%" height={180}>
                <BarChart data={gastosPorCategoria} barSize={28}>
                  <XAxis dataKey="cat" tick={{ fill:'var(--text-dim)', fontSize:10 }} axisLine={false} tickLine={false}/>
                  <YAxis hide/>
                  <Tooltip content={<Tip prefix="$"/>}/>
                  <Bar dataKey="monto" fill="var(--accent)" radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
          }
        </div>

        <div className="card">
          <p style={{ color:'var(--text-muted)', fontSize:12, fontWeight:600, letterSpacing:'0.05em', textTransform:'uppercase', marginBottom:16 }}>Incidentes por Tipo</p>
          {incPorTipo.length === 0
            ? <div className="empty-state" style={{ padding:'32px 0' }}><AlertTriangle size={28}/><p>Sin incidentes</p></div>
            : <>
                <ResponsiveContainer width="100%" height={130}>
                  <PieChart>
                    <Pie data={incPorTipo} dataKey="cnt" nameKey="tipo" cx="50%" cy="50%" innerRadius={38} outerRadius={58} paddingAngle={4}>
                      {incPorTipo.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                    </Pie>
                    <Tooltip/>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display:'flex', flexDirection:'column', gap:5, marginTop:8 }}>
                  {incPorTipo.map((d,i)=>(
                    <div key={d.tipo} style={{ display:'flex', justifyContent:'space-between' }}>
                      <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--text-muted)' }}>
                        <span style={{ width:8, height:8, borderRadius:'50%', background:COLORS[i%COLORS.length], display:'inline-block' }}/>{d.tipo}
                      </span>
                      <span style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--text-primary)', fontWeight:600 }}>{d.cnt}</span>
                    </div>
                  ))}
                </div>
              </>
          }
        </div>
      </div>

      {/* Recaudación + Rondas */}
      <div className="grid-2">
        {/* Últimas cobranzas */}
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <p style={{ color:'var(--text-muted)', fontSize:12, fontWeight:600, letterSpacing:'0.05em', textTransform:'uppercase' }}>Cobranzas Recientes</p>
            <button onClick={()=>navigate('/recaudacion')} style={{ background:'none', border:'none', color:'var(--accent-text)', fontSize:12, cursor:'pointer' }}>Ver todo →</button>
          </div>
          {recaudacion.length === 0
            ? <div className="empty-state" style={{ padding:'24px 0' }}><DollarSign size={24}/><p>Sin cobranzas</p></div>
            : [...recaudacion].reverse().slice(0,5).map((r,i)=>(
                <div key={r.id||i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 0', borderBottom:'1px solid var(--border-subtle)' }}>
                  <div>
                    <p style={{ fontWeight:500, color:'var(--text-primary)', fontSize:13 }}>{r.unidad}</p>
                    <p style={{ fontSize:11, color:'var(--text-muted)' }}>{r.propietario} · {String(r.periodo||'').slice(0,7)}</p>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <p style={{ fontFamily:'var(--font-mono)', fontWeight:600, color:'var(--text-primary)', fontSize:13 }}>${Number(r.monto||0).toLocaleString('es-CL')}</p>
                    <span className={`badge ${r.estado==='Pagado'?'badge-green':r.estado==='Vencido'?'badge-red':r.estado==='Pagado Parcial'?'badge-blue':'badge-yellow'}`} style={{ fontSize:10 }}>{r.estado}</span>
                  </div>
                </div>
              ))}
        </div>

        {/* Rondas recientes */}
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <p style={{ color:'var(--text-muted)', fontSize:12, fontWeight:600, letterSpacing:'0.05em', textTransform:'uppercase' }}>Rondas Recientes</p>
            <button onClick={()=>navigate('/rondas')} style={{ background:'none', border:'none', color:'var(--accent-text)', fontSize:12, cursor:'pointer' }}>Ver todo →</button>
          </div>
          {rondas.length === 0
            ? <div className="empty-state" style={{ padding:'24px 0' }}><Shield size={24}/><p>Sin rondas</p></div>
            : [...rondas].reverse().slice(0,5).map((r,i)=>(
                <div key={r.id||i} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 0', borderBottom:'1px solid var(--border-subtle)' }}>
                  <div style={{ width:32, height:32, borderRadius:'50%', background:r.estado==='Completada'?'var(--green-soft)':r.estado==='En Curso'?'var(--accent-glow)':'var(--yellow-soft)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Shield size={14} color={r.estado==='Completada'?'var(--green)':r.estado==='En Curso'?'var(--accent)':'var(--yellow)'}/>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontWeight:500, color:'var(--text-primary)', fontSize:13 }}>{r.guardia}</p>
                    <p style={{ fontSize:11, color:'var(--text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.inicio}</p>
                  </div>
                  <span className={`badge ${r.estado==='Completada'?'badge-green':r.estado==='En Curso'?'badge-blue':'badge-yellow'}`}>{r.estado}</span>
                </div>
              ))}
        </div>
      </div>
    </div>
  )
}
