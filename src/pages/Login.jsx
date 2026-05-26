import React, { useState } from 'react'
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { LOGO_SRC } from '../assets/logo.js'
import './Login.css'

export default function Login() {
  const { login } = useAuth()
  const [form,    setForm]    = useState({ email: '', password: '' })
  const [show,    setShow]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.email || !form.password) return
    setLoading(true); setError(null)
    try {
      await login(form.email, form.password)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-root">
      <div className="login-grid"/>
      <div className="login-card">

        {/* Logo Operapp */}
        <div className="login-brand">
          <div className="login-logo-wrap">
            <img src={LOGO_SRC} alt="Operapp" className="login-logo-img"/>
          </div>
          <p className="login-sub">Gestión de Condominios y Edificios</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label>Correo electrónico</label>
            <div className="login-input-wrap">
              <Mail size={15} className="login-icon"/>
              <input type="email" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="admin@operapp.cl" autoComplete="email" autoFocus/>
            </div>
          </div>

          <div className="login-field">
            <label>Contraseña</label>
            <div className="login-input-wrap">
              <Lock size={15} className="login-icon"/>
              <input type={show ? 'text' : 'password'} value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••" autoComplete="current-password"/>
              <button type="button" className="login-eye" onClick={() => setShow(s => !s)}>
                {show ? <EyeOff size={15}/> : <Eye size={15}/>}
              </button>
            </div>
          </div>

          {error && (
            <div className="login-error">
              <AlertCircle size={14}/>
              <span>{error}</span>
            </div>
          )}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? <><span className="login-spinner"/> Ingresando...</> : 'Ingresar'}
          </button>
        </form>

        <p className="login-hint">
          Primera vez: usa <code>admin@edificio.cl</code> / <code>admin123</code>
        </p>
      </div>
    </div>
  )
}
