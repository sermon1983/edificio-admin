// URL del Web App de Google Apps Script
// Configúrala en .env.local → VITE_SCRIPT_URL=https://script.google.com/macros/s/TU_ID/exec
const SCRIPT_URL = import.meta.env.VITE_SCRIPT_URL

export function isConfigured() {
  return !!SCRIPT_URL && SCRIPT_URL !== 'undefined'
}

async function request(url, options = {}) {
  const res = await fetch(url, { ...options, redirect: 'follow' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Error desconocido')
  return json.data
}

export const api = {
  // Leer todos los datos de una hoja
  async getSheet(sheetName) {
    return request(`${SCRIPT_URL}?sheet=${sheetName}`)
  },

  // Leer todas las hojas de una vez (para el Dashboard)
  async getAllSheets() {
    return request(SCRIPT_URL)
  },

  // Crear una fila nueva
  async createRow(sheetName, data) {
    return request(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'create', sheet: sheetName, data }),
    })
  },

  // Actualizar campos de una fila existente
  async updateRow(sheetName, id, data) {
    return request(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'update', sheet: sheetName, id, data }),
    })
  },

  // Eliminar una fila
  async deleteRow(sheetName, id) {
    return request(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'delete', sheet: sheetName, id }),
    })
  },

  // Inicializar hojas (ejecutar una sola vez)
  async initSheets() {
    return request(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'init' }),
    })
  },
}
