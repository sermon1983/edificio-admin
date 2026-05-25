import React, { createContext, useContext, useState, useCallback } from 'react'
import { api } from '../api.js'

const AuthContext = createContext(null)

const ALL_MODULES  = ['gastos','consumos','rondas','incidentes','ordenes','recaudacion']
export const ALL_WIDGETS = [
  'card_gastos','card_recaudacion','card_incidentes','card_ordenes',
  'chart_gastos','chart_incidentes','list_cobranzas','list_rondas'
]

function parseList(val, defaults) {
  if (!val || !String(val).trim()) return defaults
  const list = String(val).split(',').map(s => s.trim()).filter(Boolean)
  return list.length > 0 ? list : defaults
}

export function AuthProvider({ children }) {
  const [user,      setUser]      = useState(() => { try { return JSON.parse(localStorage.getItem('ae_user')) } catch { return null } })
  const [token,     setToken]     = useState(() => localStorage.getItem('ae_token') || null)
  const [edificios, setEdificios] = useState(() => { try { return JSON.parse(localStorage.getItem('ae_edificios')) || [] } catch { return [] } })
  const [building,  setBuilding]  = useState(() => { try { return JSON.parse(localStorage.getItem('ae_building')) } catch { return null } })

  const activeModules   = building ? parseList(building.modulos,          ALL_MODULES) : ALL_MODULES
  const dashboardWidgets = building ? parseList(building.dashboard_widgets, ALL_WIDGETS) : ALL_WIDGETS

  const login = useCallback(async (email, password) => {
    const result = await api.login(email, password)
    const first  = result.edificios?.[0] || null
    setUser(result.user); setToken(result.token)
    setEdificios(result.edificios || []); setBuilding(first)
    localStorage.setItem('ae_user',      JSON.stringify(result.user))
    localStorage.setItem('ae_token',     result.token)
    localStorage.setItem('ae_edificios', JSON.stringify(result.edificios || []))
    localStorage.setItem('ae_building',  JSON.stringify(first))
    return result
  }, [])

  const logout = useCallback(() => {
    if (token) api.logout(token).catch(() => {})
    setUser(null); setToken(null); setEdificios([]); setBuilding(null)
    ;['ae_user','ae_token','ae_edificios','ae_building'].forEach(k => localStorage.removeItem(k))
  }, [token])

  const selectBuilding = useCallback((edificio) => {
    setBuilding(edificio)
    localStorage.setItem('ae_building', JSON.stringify(edificio))
  }, [])

  const refreshEdificios = useCallback(async () => {
    if (!token) return
    const list = await api.getEdificios(token)
    setEdificios(list)
    localStorage.setItem('ae_edificios', JSON.stringify(list))
    if (building) {
      const updated = list.find(e => String(e.id) === String(building.id))
      if (updated) { setBuilding(updated); localStorage.setItem('ae_building', JSON.stringify(updated)) }
    }
    return list
  }, [token, building])

  return (
    <AuthContext.Provider value={{ user, token, edificios, building, activeModules, dashboardWidgets, login, logout, selectBuilding, refreshEdificios }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
