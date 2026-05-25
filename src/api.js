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

async function post(body) {
  return request(SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(body),
  })
}

export const api = {
  // ── Auth ──────────────────────────────────────────────────
  login: (email, password) => post({ action: 'login', email, password }),
  logout: (token) => post({ action: 'logout', token }),

  // ── Edificios ─────────────────────────────────────────────
  getEdificios: (token) =>
    request(`${SCRIPT_URL}?action=getEdificios&token=${token}`),
  createEdificio: (token, data) =>
    post({ action: 'createEdificio', token, data }),
  updateEdificio: (token, id, data) =>
    post({ action: 'updateEdificio', token, id, data }),
  deleteEdificio: (token, id) =>
    post({ action: 'deleteEdificio', token, id }),

  // ── Usuarios ──────────────────────────────────────────────
  getUsuarios: (token) =>
    request(`${SCRIPT_URL}?action=getUsuarios&token=${token}`),
  createUsuario: (token, data) =>
    post({ action: 'createUsuario', token, data }),
  updateUsuario: (token, id, data) =>
    post({ action: 'updateUsuario', token, id, data }),
  deleteUsuario: (token, id) =>
    post({ action: 'deleteUsuario', token, id }),

  // ── Datos por edificio ────────────────────────────────────
  getSheet: (sheetName, buildingId, token) =>
    request(`${SCRIPT_URL}?sheet=${sheetName}&building_id=${buildingId}&token=${token}`),
  createRow: (sheetName, buildingId, token, data) =>
    post({ action: 'create', sheet: sheetName, building_id: buildingId, token, data }),
  updateRow: (sheetName, buildingId, token, id, data) =>
    post({ action: 'update', sheet: sheetName, building_id: buildingId, token, id, data }),
  deleteRow: (sheetName, buildingId, token, id) =>
    post({ action: 'delete', sheet: sheetName, building_id: buildingId, token, id }),

  // ── Init ──────────────────────────────────────────────────
  init: () => post({ action: 'init' }),

  // ── Imágenes ──────────────────────────────────────────────
  uploadImage: (token, base64, mimeType, filename) =>
    post({ action: 'uploadImage', token, base64, mimeType, filename }),

  // ── Notificaciones config ─────────────────────────────────
  getNotifConfig: (token) =>
    request(`${SCRIPT_URL}?action=getNotifConfig&token=${token}`),
  createNotifConfig: (token, data) =>
    post({ action: 'createNotifConfig', token, data }),
  updateNotifConfig: (token, id, data) =>
    post({ action: 'updateNotifConfig', token, id, data }),
  deleteNotifConfig: (token, id) =>
    post({ action: 'deleteNotifConfig', token, id }),
}