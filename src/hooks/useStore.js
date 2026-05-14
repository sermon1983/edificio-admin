import { useState, useEffect, useCallback } from 'react'

const INITIAL_DATA = {
  gastos: [
    { id: 1, concepto: 'Mantención Ascensores', monto: 280000, fecha: '2025-04-01', categoria: 'Mantención', estado: 'Pagado', proveedor: 'Ascensores Chile' },
    { id: 2, concepto: 'Agua Potable Abril', monto: 145000, fecha: '2025-04-05', categoria: 'Servicios', estado: 'Pagado', proveedor: 'Aguas Andinas' },
    { id: 3, concepto: 'Energía Eléctrica Áreas Comunes', monto: 92000, fecha: '2025-04-08', categoria: 'Servicios', estado: 'Pagado', proveedor: 'Enel' },
    { id: 4, concepto: 'Servicio Limpieza', monto: 210000, fecha: '2025-04-10', categoria: 'Limpieza', estado: 'Pagado', proveedor: 'CleanPro' },
    { id: 5, concepto: 'Seguro Edificio', monto: 380000, fecha: '2025-04-15', categoria: 'Seguros', estado: 'Pendiente', proveedor: 'Mapfre' },
    { id: 6, concepto: 'Jardinería', monto: 75000, fecha: '2025-04-20', categoria: 'Mantención', estado: 'Pagado', proveedor: 'Verde Vivo' },
  ],
  consumos: [
    { id: 1, tipo: 'Agua', unidad: 'Depto 101', lectura_anterior: 1240, lectura_actual: 1278, mes: '2025-04', costo_unitario: 650, estado: 'Facturado' },
    { id: 2, tipo: 'Agua', unidad: 'Depto 102', lectura_anterior: 890, lectura_actual: 924, mes: '2025-04', costo_unitario: 650, estado: 'Facturado' },
    { id: 3, tipo: 'Agua', unidad: 'Depto 201', lectura_anterior: 2100, lectura_actual: 2141, mes: '2025-04', costo_unitario: 650, estado: 'Pendiente' },
    { id: 4, tipo: 'Luz', unidad: 'Depto 101', lectura_anterior: 4500, lectura_actual: 4563, mes: '2025-04', costo_unitario: 120, estado: 'Facturado' },
    { id: 5, tipo: 'Luz', unidad: 'Depto 102', lectura_anterior: 3200, lectura_actual: 3248, mes: '2025-04', costo_unitario: 120, estado: 'Pendiente' },
    { id: 6, tipo: 'Luz', unidad: 'Depto 201', lectura_anterior: 5800, lectura_actual: 5871, mes: '2025-04', costo_unitario: 120, estado: 'Facturado' },
  ],
  rondas: [
    { id: 1, guardia: 'Carlos Muñoz', inicio: '2025-04-28 08:00', fin: '2025-04-28 08:35', zonas: ['Estacionamiento', 'Hall', 'Azotea'], novedades: 'Sin novedades', estado: 'Completada' },
    { id: 2, guardia: 'Pedro Rojas', inicio: '2025-04-28 14:00', fin: '2025-04-28 14:40', zonas: ['Piscina', 'Gimnasio', 'Escaleras'], novedades: 'Puerta gimnasio sin seguro', estado: 'Completada' },
    { id: 3, guardia: 'Carlos Muñoz', inicio: '2025-04-28 20:00', fin: null, zonas: ['Estacionamiento', 'Perímetro'], novedades: '', estado: 'En Curso' },
    { id: 4, guardia: 'Ana Soto', inicio: '2025-04-29 08:00', fin: null, zonas: [], novedades: '', estado: 'Programada' },
  ],
  incidentes: [
    { id: 1, titulo: 'Filtración en techo piso 10', tipo: 'Infraestructura', prioridad: 'Alta', reportado_por: 'Depto 1001', fecha: '2025-04-25', estado: 'En Proceso', descripcion: 'Filtración de agua en el techo del pasillo piso 10, afecta dos departamentos.' },
    { id: 2, titulo: 'Ruidos molestos nocturnos', tipo: 'Convivencia', prioridad: 'Media', reportado_por: 'Depto 302', fecha: '2025-04-26', estado: 'Abierto', descripcion: 'Ruidos excesivos entre 23:00 y 02:00 provenientes del piso superior.' },
    { id: 3, titulo: 'Ascensor fuera de servicio', tipo: 'Equipamiento', prioridad: 'Alta', reportado_por: 'Conserje', fecha: '2025-04-27', estado: 'Resuelto', descripcion: 'Ascensor Torre B detuvo su funcionamiento a las 09:15.' },
    { id: 4, titulo: 'Bicicleta abandonada', tipo: 'Seguridad', prioridad: 'Baja', reportado_por: 'Guardia', fecha: '2025-04-28', estado: 'Abierto', descripcion: 'Bicicleta sin candado y aparentemente abandonada en estacionamiento.' },
  ],
  ordenes: [
    { id: 1, titulo: 'Reparar portón eléctrico', categoria: 'Eléctrica', asignado_a: 'Técnico López', prioridad: 'Alta', fecha_creacion: '2025-04-26', fecha_limite: '2025-04-29', estado: 'En Proceso', descripcion: 'Portón eléctrico no responde al control remoto.' },
    { id: 2, titulo: 'Pintar hall de entrada', categoria: 'Pintura', asignado_a: 'Pinturas García', prioridad: 'Baja', fecha_creacion: '2025-04-20', fecha_limite: '2025-05-10', estado: 'Pendiente', descripcion: 'Renovar pintura del hall principal, acceso norte.' },
    { id: 3, titulo: 'Cambio bomba de agua', categoria: 'Gasfitería', asignado_a: 'Gasfiter Vargas', prioridad: 'Alta', fecha_creacion: '2025-04-27', fecha_limite: '2025-04-28', estado: 'Completada', descripcion: 'Bomba de presurización con falla intermitente.' },
    { id: 4, titulo: 'Revisión tablero eléctrico', categoria: 'Eléctrica', asignado_a: 'Técnico López', prioridad: 'Media', fecha_creacion: '2025-04-28', fecha_limite: '2025-05-05', estado: 'Pendiente', descripcion: 'Revisión periódica del tablero principal.' },
  ],
}

function loadStore() {
  try {
    const raw = localStorage.getItem('edificio_admin_data')
    if (raw) return JSON.parse(raw)
  } catch {}
  return INITIAL_DATA
}

function saveStore(data) {
  try { localStorage.setItem('edificio_admin_data', JSON.stringify(data)) } catch {}
}

let _store = loadStore()
let _listeners = []

function getStore() { return _store }

function setStore(updater) {
  _store = typeof updater === 'function' ? updater(_store) : updater
  saveStore(_store)
  _listeners.forEach(fn => fn(_store))
}

export function useStore(selector) {
  const [value, setValue] = useState(() => selector(getStore()))

  useEffect(() => {
    const listener = (newStore) => setValue(selector(newStore))
    _listeners.push(listener)
    return () => { _listeners = _listeners.filter(l => l !== listener) }
  }, [])

  const update = useCallback((key, updater) => {
    setStore(s => ({
      ...s,
      [key]: typeof updater === 'function' ? updater(s[key]) : updater
    }))
  }, [])

  return [value, update]
}

export function nextId(arr) {
  return arr.length > 0 ? Math.max(...arr.map(i => i.id)) + 1 : 1
}
