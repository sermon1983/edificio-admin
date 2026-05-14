import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Receipt, Droplets, AlertTriangle, Wrench, TrendingUp, TrendingDown, Shield } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useSheetData } from '../hooks/useSheetData.js'
import { LoadingState, ErrorState } from '../components/LoadingState.jsx'

const GASTO_DATA = [
  { mes:'Ene', monto:1020000 },{ mes:'Feb', monto:980000 },{ mes:'Mar', monto:1150000 },
  { mes:'Abr', monto:1182000 },{ mes:'May', monto:1080000 },{ mes:'Jun', monto:1240000 },
]
const AGUA_DATA = [
  { mes:'Ene', m3:420 },{ mes:'Feb', m3:398 },{ mes:'Mar', m3:445 },
  { mes:'Abr', m3:417 },{ mes:'May', m3:460 },{ mes:'Jun', m3:435 },
]

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
    <div className="stat-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="stat-icon" style={{ background: iconBg }}><span style={{ color: iconColor }}>{icon}</span></div>
      <div className="stat-info">
        <p className="label">{label}</p>
        <p className="value">{value}</p>
        <p className="sub">{sub}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { data: gastos,     loading: l1, error: e1 } = useSheetData('gastos')
  const { data: consumos,   loading: l2 }             = useSheetData('consumos')
  const { data: incidentes, loading: l3 }             = useSheetData('incidentes')
  const { data: ordenes,    loading: l4 }             = useSheetData('ordenes')
  const { data: rondas,     loading: l5 }             = useSheetData('rondas')

  if (l1 || l2 || l3 || l4 || l5) return <LoadingState label="Cargando dashboard..." />
  if (e1) return <ErrorState message={e1} />

  const totalGastos        = gastos.reduce((a,g) => a + Number(g.monto), 0)
  const gastosPendientes   = gastos.filter(g => g.estado === 'Pendiente').length
  const incidentesAbiertos = incidentes.filter(i => i.estado === 'Abierto' || i.estado === 'En Proceso').length
  const ordenesPendientes  = ordenes.filter(o => o.estado !== 'Completada').length

  const incPorTipo = ['Infraestructura','Convivencia','Equipamiento','Seguridad'].map(tipo => ({
    tipo: tipo.slice(0,6) + '.', cnt: incidentes.filter(i => i.tipo === tipo).length
  }))

  return (
    <div className="page">
      <div className="grid-4" style={{ marginBottom:24 }}>
        <StatCard icon={<Receipt size={20}/>} iconBg="var(--accent-glow)" iconColor="var(--accent-text)"
          label="Gastos del Mes" value={`$${(totalGastos/1000).toFixed(0)}K`} sub={`${gastosPendientes} pendientes`} onClick={() => navigate('/gastos')} />
        <StatCard icon={<Droplets size={20}/>} iconBg="rgba(34,197,94,0.12)" iconColor="var(--green)"
          label="Consumos Activos" value={consumos.filter(c=>c.estado==='Pendiente').length} sub="lecturas pendientes" onClick={() => navigate('/consumos')} />
        <StatCard icon={<AlertTriangle size={20}/>} iconBg="var(--yellow-soft)" iconColor="var(--yellow)"
          label="Incidentes Abiertos" value={incidentesAbiertos} sub={`${incidentes.filter(i=>i.prioridad==='Alta').length} de alta prioridad`} onClick={() => navigate('/incidentes')} />
        <StatCard icon={<Wrench size={20}/>} iconBg="var(--purple-soft)" iconColor="var(--purple)"
          label="Órdenes Pendientes" value={ordenesPendientes} sub="órdenes activas" onClick={() => navigate('/ordenes')} />
      </div>

      <div className="grid-2" style={{ marginBottom:24 }}>
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
            <div>
              <p style={{ color:'var(--text-muted)', fontSize:12, fontWeight:600, letterSpacing:'0.05em', textTransform:'uppercase' }}>Gastos Mensuales</p>
              <p style={{ color:'var(--text-primary)', fontWeight:700, fontSize:22, marginTop:2 }}>$1.24M</p>
            </div>
            <span className="badge badge-green"><TrendingDown size={10}/> -4.8%</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={GASTO_DATA}>
              <defs><linearGradient id="gGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.3}/>
                <stop offset="100%" stopColor="var(--accent)" stopOpacity={0}/>
              </linearGradient></defs>
              <XAxis dataKey="mes" tick={{ fill:'var(--text-dim)', fontSize:11 }} axisLine={false} tickLine={false}/>
              <YAxis hide/>
              <Tooltip content={<Tip prefix="$"/>}/>
              <Area type="monotone" dataKey="monto" stroke="var(--accent)" fill="url(#gGrad)" strokeWidth={2} dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
            <div>
              <p style={{ color:'var(--text-muted)', fontSize:12, fontWeight:600, letterSpacing:'0.05em', textTransform:'uppercase' }}>Consumo Agua</p>
              <p style={{ color:'var(--text-primary)', fontWeight:700, fontSize:22, marginTop:2 }}>435 m³</p>
            </div>
            <span className="badge badge-yellow"><TrendingUp size={10}/> +5.2%</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={AGUA_DATA} barSize={24}>
              <XAxis dataKey="mes" tick={{ fill:'var(--text-dim)', fontSize:11 }} axisLine={false} tickLine={false}/>
              <YAxis hide/>
              <Tooltip content={<Tip suffix=" m³"/>}/>
              <Bar dataKey="m3" fill="var(--green)" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid-3">
        <div className="card" style={{ gridColumn:'span 2' }}>
          <p style={{ color:'var(--text-muted)', fontSize:12, fontWeight:600, letterSpacing:'0.05em', textTransform:'uppercase', marginBottom:14 }}>Rondas Recientes</p>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {rondas.slice(0,4).map((r,i) => (
              <div key={r.id||i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 12px', background:'var(--bg-elevated)', borderRadius:'var(--radius-md)' }}>
                <div style={{ width:34, height:34, borderRadius:'50%', background: r.estado==='Completada'?'var(--green-soft)':r.estado==='En Curso'?'var(--accent-glow)':'var(--bg-hover)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Shield size={15} color={r.estado==='Completada'?'var(--green)':r.estado==='En Curso'?'var(--accent)':'var(--text-muted)'}/>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ color:'var(--text-primary)', fontWeight:500, fontSize:13 }}>{r.guardia}</p>
                  <p style={{ color:'var(--text-muted)', fontSize:11 }}>{r.inicio}</p>
                </div>
                <span className={`badge ${r.estado==='Completada'?'badge-green':r.estado==='En Curso'?'badge-blue':'badge-yellow'}`}>{r.estado}</span>
              </div>
            ))}
            {rondas.length === 0 && <p style={{ color:'var(--text-dim)', fontSize:13, textAlign:'center', padding:20 }}>Sin rondas registradas</p>}
          </div>
        </div>
        <div className="card">
          <p style={{ color:'var(--text-muted)', fontSize:12, fontWeight:600, letterSpacing:'0.05em', textTransform:'uppercase', marginBottom:16 }}>Incidentes por Tipo</p>
          <ResponsiveContainer width="100%" height={130}>
            <PieChart>
              <Pie data={incPorTipo} dataKey="cnt" nameKey="tipo" cx="50%" cy="50%" innerRadius={38} outerRadius={60} paddingAngle={4}>
                {incPorTipo.map((_,i) => <Cell key={i} fill={['var(--accent)','var(--yellow)','var(--purple)','var(--red)'][i]}/>)}
              </Pie>
              <Tooltip/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:8 }}>
            {incPorTipo.map((d,i) => (
              <div key={d.tipo} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--text-muted)' }}>
                  <span style={{ width:8, height:8, borderRadius:'50%', background:['var(--accent)','var(--yellow)','var(--purple)','var(--red)'][i], display:'inline-block' }}/>
                  {d.tipo}
                </span>
                <span style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--text-primary)', fontWeight:600 }}>{d.cnt}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
