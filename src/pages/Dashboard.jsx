import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Receipt, Droplets, Shield, AlertTriangle, Wrench,
  TrendingUp, TrendingDown, CheckCircle, Clock, AlertCircle
} from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useStore } from '../hooks/useStore.js'

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun']
const GASTO_DATA = [
  { mes:'Ene', monto: 1020000 },
  { mes:'Feb', monto: 980000 },
  { mes:'Mar', monto: 1150000 },
  { mes:'Abr', monto: 1182000 },
  { mes:'May', monto: 1080000 },
  { mes:'Jun', monto: 1240000 },
]

const AGUA_DATA = [
  { mes:'Ene', m3: 420 },
  { mes:'Feb', m3: 398 },
  { mes:'Mar', m3: 445 },
  { mes:'Abr', m3: 417 },
  { mes:'May', m3: 460 },
  { mes:'Jun', m3: 435 },
]

const CustomTooltip = ({ active, payload, label, prefix = '', suffix = '' }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-main)', borderRadius: 8, padding: '10px 14px' }}>
      <p style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 4 }}>{label}</p>
      <p style={{ color: 'var(--accent-text)', fontWeight: 700, fontSize: 15 }}>
        {prefix}{payload[0].value.toLocaleString('es-CL')}{suffix}
      </p>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [gastos] = useStore(s => s.gastos)
  const [consumos] = useStore(s => s.consumos)
  const [rondas] = useStore(s => s.rondas)
  const [incidentes] = useStore(s => s.incidentes)
  const [ordenes] = useStore(s => s.ordenes)

  const totalGastos = gastos.reduce((a, g) => a + g.monto, 0)
  const gastosPendientes = gastos.filter(g => g.estado === 'Pendiente').length
  const incidentesAbiertos = incidentes.filter(i => i.estado === 'Abierto' || i.estado === 'En Proceso').length
  const ordenesPendientes = ordenes.filter(o => o.estado !== 'Completada').length
  const rondasHoy = rondas.filter(r => r.inicio.startsWith('2025-04-28')).length

  const pieData = [
    { name:'Pagados', value: gastos.filter(g=>g.estado==='Pagado').length, color:'var(--green)' },
    { name:'Pendientes', value: gastosPendientes, color:'var(--yellow)' },
  ]

  const incPorTipo = [
    { tipo:'Infra.', cnt: incidentes.filter(i=>i.tipo==='Infraestructura').length },
    { tipo:'Conviv.', cnt: incidentes.filter(i=>i.tipo==='Convivencia').length },
    { tipo:'Equip.', cnt: incidentes.filter(i=>i.tipo==='Equipamiento').length },
    { tipo:'Seg.', cnt: incidentes.filter(i=>i.tipo==='Seguridad').length },
  ]

  return (
    <div className="page">
      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <StatCard icon={<Receipt size={20} />} iconBg="var(--accent-glow)" iconColor="var(--accent-text)"
          label="Gastos del Mes" value={`$${(totalGastos/1000).toFixed(0)}K`} sub={`${gastosPendientes} pendientes`}
          onClick={() => navigate('/gastos')} />
        <StatCard icon={<Droplets size={20} />} iconBg="rgba(34,197,94,0.12)" iconColor="var(--green)"
          label="Consumos Activos" value={consumos.filter(c=>c.estado==='Pendiente').length} sub="lecturas pendientes"
          onClick={() => navigate('/consumos')} />
        <StatCard icon={<AlertTriangle size={20} />} iconBg="var(--yellow-soft)" iconColor="var(--yellow)"
          label="Incidentes Abiertos" value={incidentesAbiertos} sub={`${incidentes.filter(i=>i.prioridad==='Alta').length} de alta prioridad`}
          onClick={() => navigate('/incidentes')} />
        <StatCard icon={<Wrench size={20} />} iconBg="var(--purple-soft)" iconColor="var(--purple)"
          label="Órdenes Pendientes" value={ordenesPendientes} sub="órdenes activas"
          onClick={() => navigate('/ordenes')} />
      </div>

      {/* Charts row */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
            <div>
              <p style={{ color:'var(--text-muted)', fontSize:12, fontWeight:600, letterSpacing:'0.05em', textTransform:'uppercase' }}>Gastos Mensuales</p>
              <p style={{ color:'var(--text-primary)', fontWeight:700, fontSize:22, marginTop:2 }}>$1.24M</p>
            </div>
            <span className="badge badge-green"><TrendingDown size={10} /> -4.8%</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={GASTO_DATA}>
              <defs>
                <linearGradient id="gGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="mes" tick={{ fill:'var(--text-dim)', fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip prefix="$" />} />
              <Area type="monotone" dataKey="monto" stroke="var(--accent)" fill="url(#gGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
            <div>
              <p style={{ color:'var(--text-muted)', fontSize:12, fontWeight:600, letterSpacing:'0.05em', textTransform:'uppercase' }}>Consumo Agua</p>
              <p style={{ color:'var(--text-primary)', fontWeight:700, fontSize:22, marginTop:2 }}>435 m³</p>
            </div>
            <span className="badge badge-yellow"><TrendingUp size={10} /> +5.2%</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={AGUA_DATA} barSize={24}>
              <XAxis dataKey="mes" tick={{ fill:'var(--text-dim)', fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip suffix=" m³" />} />
              <Bar dataKey="m3" fill="var(--green)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid-3">
        {/* Rondas */}
        <div className="card" style={{ gridColumn:'span 2' }}>
          <p style={{ color:'var(--text-muted)', fontSize:12, fontWeight:600, letterSpacing:'0.05em', textTransform:'uppercase', marginBottom:14 }}>Rondas Recientes</p>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {rondas.slice(0,4).map(r => (
              <div key={r.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 12px', background:'var(--bg-elevated)', borderRadius:'var(--radius-md)' }}>
                <div style={{ width:34, height:34, borderRadius:'50%', background: r.estado==='Completada' ? 'var(--green-soft)' : r.estado==='En Curso' ? 'var(--accent-glow)' : 'var(--bg-hover)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Shield size={15} color={r.estado==='Completada' ? 'var(--green)' : r.estado==='En Curso' ? 'var(--accent)' : 'var(--text-muted)'} />
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ color:'var(--text-primary)', fontWeight:500, fontSize:13 }}>{r.guardia}</p>
                  <p style={{ color:'var(--text-muted)', fontSize:11 }}>{r.inicio} · {r.zonas.slice(0,2).join(', ')}{r.zonas.length>2 ? '...' : ''}</p>
                </div>
                <span className={`badge ${r.estado==='Completada' ? 'badge-green' : r.estado==='En Curso' ? 'badge-blue' : 'badge-yellow'}`}>
                  {r.estado}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Incidentes por tipo */}
        <div className="card">
          <p style={{ color:'var(--text-muted)', fontSize:12, fontWeight:600, letterSpacing:'0.05em', textTransform:'uppercase', marginBottom:16 }}>Incidentes por Tipo</p>
          <ResponsiveContainer width="100%" height={130}>
            <PieChart>
              <Pie data={incPorTipo} dataKey="cnt" nameKey="tipo" cx="50%" cy="50%" innerRadius={38} outerRadius={60} paddingAngle={4}>
                {incPorTipo.map((_, i) => (
                  <Cell key={i} fill={['var(--accent)','var(--yellow)','var(--purple)','var(--red)'][i]} />
                ))}
              </Pie>
              <Tooltip formatter={(v,n) => [v, n]} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:8 }}>
            {incPorTipo.map((d,i) => (
              <div key={d.tipo} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--text-muted)' }}>
                  <span style={{ width:8, height:8, borderRadius:'50%', background:['var(--accent)','var(--yellow)','var(--purple)','var(--red)'][i], display:'inline-block' }} />
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

function StatCard({ icon, iconBg, iconColor, label, value, sub, onClick }) {
  return (
    <div className="stat-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="stat-icon" style={{ background: iconBg }}>
        <span style={{ color: iconColor }}>{icon}</span>
      </div>
      <div className="stat-info">
        <p className="label">{label}</p>
        <p className="value">{value}</p>
        <p className="sub">{sub}</p>
      </div>
    </div>
  )
}
