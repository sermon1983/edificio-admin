import React, { createContext, useContext, useState, useCallback } from 'react'
import { api } from '../api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,     setUser]     = useState(() => { try { return JSON.parse(localStorage.getItem('ae_user')) } catch { return null } })
  const [token,    setToken]    = useState(() => localStorage.getItem('ae_token') || null)
  const [edificios, setEdificios] = useState(() => { try { return JSON.parse(localStorage.getItem('ae_edificios')) || [] } catch { return [] } })
  const [building, setBuilding] = useState(() => { try { return JSON.parse(localStorage.getItem('ae_building')) } catch { return null } })

  const login = useCallback(async (email, password) => {
    const result = await api.login(email, password)
    setUser(result.user)
    setToken(result.token)
    setEdificios(result.edificios || [])
    const first = result.edificios?.[0] || null
    setBuilding(first)
    localStorage.setItem('ae_user',      JSON.stringify(result.user))
    localStorage.setItem('ae_token',     result.token)
    localStorage.setItem('ae_edificios', JSON.stringify(result.edificios || []))
    localStorage.setItem('ae_building',  JSON.stringify(first))
    return result
  }, [])

  const logout = useCallback(() => {
    if (token) api.logout(token).catch(() => {})
    setUser(null); setToken(null); setEdificios([]); setBuilding(null)
    localStorage.removeItem('ae_user')
    localStorage.removeItem('ae_token')
    localStorage.removeItem('ae_edificios')
    localStorage.removeItem('ae_building')
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
    return list
  }, [token])

  return (
    <AuthContext.Provider value={{ user, token, edificios, building, login, logout, selectBuilding, refreshEdificios }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
