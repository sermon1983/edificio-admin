import { useState, useEffect, useCallback } from 'react'
import { api } from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'

export function useSheetData(sheetName) {
  const { token, building } = useAuth()
  const buildingId = building?.id

  const [data,    setData]    = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const load = useCallback(async () => {
    if (!token || !buildingId) { setData([]); setLoading(false); return }
    setLoading(true); setError(null)
    try {
      const rows = await api.getSheet(sheetName, buildingId, token)
      setData(rows)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [sheetName, token, buildingId])

  useEffect(() => { load() }, [load])

  const create = useCallback(async (row) => {
    const created = await api.createRow(sheetName, buildingId, token, row)
    setData(d => [...d, created])
    return created
  }, [sheetName, buildingId, token])

  const update = useCallback(async (id, row) => {
    await api.updateRow(sheetName, buildingId, token, id, row)
    setData(d => d.map(r => Number(r.id) === Number(id) ? { ...r, ...row } : r))
  }, [sheetName, buildingId, token])

  const remove = useCallback(async (id) => {
    await api.deleteRow(sheetName, buildingId, token, id)
    setData(d => d.filter(r => Number(r.id) !== Number(id)))
  }, [sheetName, buildingId, token])

  return { data, loading, error, create, update, remove, reload: load }
}
