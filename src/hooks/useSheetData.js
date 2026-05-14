import { useState, useEffect, useCallback } from 'react'
import { api } from '../api.js'

export function useSheetData(sheetName) {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const rows = await api.getSheet(sheetName)
      setData(rows)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [sheetName])

  useEffect(() => { load() }, [load])

  // Crear fila nueva → optimistic update
  const create = useCallback(async (row) => {
    const created = await api.createRow(sheetName, row)
    setData(d => [...d, created])
    return created
  }, [sheetName])

  // Actualizar fila existente → optimistic update
  const update = useCallback(async (id, row) => {
    await api.updateRow(sheetName, id, row)
    setData(d => d.map(r => Number(r.id) === Number(id) ? { ...r, ...row } : r))
  }, [sheetName])

  // Eliminar fila → optimistic update
  const remove = useCallback(async (id) => {
    await api.deleteRow(sheetName, id)
    setData(d => d.filter(r => Number(r.id) !== Number(id)))
  }, [sheetName])

  return { data, loading, error, create, update, remove, reload: load }
}
