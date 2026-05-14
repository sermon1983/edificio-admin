// ============================================================
//  AdminEdificio — Google Apps Script API
//  Pega este código en script.google.com y despliega como Web App
// ============================================================

const SHEETS = ['gastos', 'consumos', 'rondas', 'incidentes', 'ordenes']

// ── Encabezados de cada hoja ─────────────────────────────────
const HEADERS = {
  gastos:     ['id','concepto','monto','fecha','categoria','estado','proveedor'],
  consumos:   ['id','tipo','unidad','lectura_anterior','lectura_actual','mes','costo_unitario','estado'],
  rondas:     ['id','guardia','inicio','fin','zonas','novedades','estado'],
  incidentes: ['id','titulo','tipo','prioridad','reportado_por','fecha','estado','descripcion'],
  ordenes:    ['id','titulo','categoria','prioridad','asignado_a','fecha_creacion','fecha_limite','estado','descripcion'],
}

// ── Datos iniciales de ejemplo ───────────────────────────────
const SEED = {
  gastos: [
    [1,'Mantención Ascensores',280000,'2025-04-01','Mantención','Pagado','Ascensores Chile'],
    [2,'Agua Potable Abril',145000,'2025-04-05','Servicios','Pagado','Aguas Andinas'],
    [3,'Energía Eléctrica Áreas Comunes',92000,'2025-04-08','Servicios','Pagado','Enel'],
    [4,'Servicio Limpieza',210000,'2025-04-10','Limpieza','Pagado','CleanPro'],
    [5,'Seguro Edificio',380000,'2025-04-15','Seguros','Pendiente','Mapfre'],
  ],
  consumos: [
    [1,'Agua','Depto 101',1240,1278,'2025-04',650,'Facturado'],
    [2,'Agua','Depto 102',890,924,'2025-04',650,'Facturado'],
    [3,'Luz','Depto 101',4500,4563,'2025-04',120,'Pendiente'],
    [4,'Luz','Depto 102',3200,3248,'2025-04',120,'Facturado'],
  ],
  rondas: [
    [1,'Carlos Muñoz','2025-04-28 08:00','2025-04-28 08:35','Estacionamiento,Hall,Azotea','Sin novedades','Completada'],
    [2,'Pedro Rojas','2025-04-28 14:00','2025-04-28 14:40','Piscina,Gimnasio','Puerta gimnasio sin seguro','Completada'],
    [3,'Carlos Muñoz','2025-04-28 20:00','','Estacionamiento,Perímetro','','En Curso'],
  ],
  incidentes: [
    [1,'Filtración en techo piso 10','Infraestructura','Alta','Depto 1001','2025-04-25','En Proceso','Filtración de agua en pasillo piso 10'],
    [2,'Ruidos molestos nocturnos','Convivencia','Media','Depto 302','2025-04-26','Abierto','Ruidos entre 23:00 y 02:00'],
    [3,'Ascensor fuera de servicio','Equipamiento','Alta','Conserje','2025-04-27','Resuelto','Ascensor Torre B detuvo funcionamiento'],
  ],
  ordenes: [
    [1,'Reparar portón eléctrico','Eléctrica','Alta','Técnico López','2025-04-26','2025-04-29','En Proceso','Portón no responde al control remoto'],
    [2,'Pintar hall de entrada','Pintura','Baja','Pinturas García','2025-04-20','2025-05-10','Pendiente','Renovar pintura del hall principal'],
    [3,'Cambio bomba de agua','Gasfitería','Alta','Gasfiter Vargas','2025-04-27','2025-04-28','Completada','Bomba con falla intermitente'],
  ],
}

// ── GET: leer hoja ───────────────────────────────────────────
function doGet(e) {
  try {
    const sheetName = e.parameter.sheet
    if (!sheetName) return jsonOk(getAllSheets())
    return jsonOk(getSheetData(sheetName))
  } catch(err) {
    return jsonError(err.message)
  }
}

// ── POST: crear / actualizar / eliminar ──────────────────────
function doPost(e) {
  try {
    const body   = JSON.parse(e.postData.contents)
    const { action, sheet, data, id } = body

    if (action === 'create') return jsonOk(createRow(sheet, data))
    if (action === 'update') { updateRow(sheet, Number(id), data); return jsonOk({ id }) }
    if (action === 'delete') { deleteRow(sheet, Number(id));       return jsonOk({ id }) }
    if (action === 'init')   { initSheets(); return jsonOk({ msg: 'Hojas inicializadas' }) }

    return jsonError('Acción desconocida: ' + action)
  } catch(err) {
    return jsonError(err.message)
  }
}

// ── Helpers de lectura ───────────────────────────────────────
function getSheetData(sheetName) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet()
  const sheet = ss.getSheetByName(sheetName)
  if (!sheet) throw new Error('Hoja no encontrada: ' + sheetName)

  const all = sheet.getDataRange().getValues()
  if (all.length <= 1) return []

  const headers = all[0]
  return all.slice(1).map(row => {
    const obj = {}
    headers.forEach((h, i) => { obj[h] = row[i] })
    return obj
  })
}

function getAllSheets() {
  const result = {}
  SHEETS.forEach(s => { try { result[s] = getSheetData(s) } catch(_) { result[s] = [] } })
  return result
}

// ── Helpers de escritura ─────────────────────────────────────
function createRow(sheetName, data) {
  const ss      = SpreadsheetApp.getActiveSpreadsheet()
  const sheet   = ss.getSheetByName(sheetName)
  if (!sheet) throw new Error('Hoja no encontrada: ' + sheetName)

  const headers = HEADERS[sheetName]
  const newId   = getNextId(sheet)
  data.id = newId

  const row = headers.map(h => (data[h] !== undefined && data[h] !== null) ? data[h] : '')
  sheet.appendRow(row)
  return data
}

function updateRow(sheetName, id, data) {
  const ss      = SpreadsheetApp.getActiveSpreadsheet()
  const sheet   = ss.getSheetByName(sheetName)
  const all     = sheet.getDataRange().getValues()
  const headers = all[0]

  for (let i = 1; i < all.length; i++) {
    if (Number(all[i][0]) === id) {
      headers.forEach((h, col) => {
        if (data[h] !== undefined) sheet.getRange(i + 1, col + 1).setValue(data[h])
      })
      return
    }
  }
  throw new Error('Fila no encontrada con id: ' + id)
}

function deleteRow(sheetName, id) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet()
  const sheet = ss.getSheetByName(sheetName)
  const all   = sheet.getDataRange().getValues()

  for (let i = 1; i < all.length; i++) {
    if (Number(all[i][0]) === id) {
      sheet.deleteRow(i + 1)
      return
    }
  }
  throw new Error('Fila no encontrada con id: ' + id)
}

function getNextId(sheet) {
  const lastRow = sheet.getLastRow()
  if (lastRow <= 1) return 1
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat().filter(v => v !== '')
  if (ids.length === 0) return 1
  return Math.max(...ids.map(Number)) + 1
}

// ── Inicializar hojas con encabezados y datos de ejemplo ─────
function initSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet()

  SHEETS.forEach(name => {
    let sheet = ss.getSheetByName(name)
    if (!sheet) sheet = ss.insertSheet(name)
    sheet.clearContents()

    const headers = HEADERS[name]
    sheet.getRange(1, 1, 1, headers.length).setValues([headers])

    // Formato encabezado
    const headerRange = sheet.getRange(1, 1, 1, headers.length)
    headerRange.setBackground('#0F4C75')
    headerRange.setFontColor('#FFFFFF')
    headerRange.setFontWeight('bold')

    // Datos de ejemplo
    if (SEED[name] && SEED[name].length > 0) {
      sheet.getRange(2, 1, SEED[name].length, headers.length).setValues(SEED[name])
    }

    sheet.setFrozenRows(1)
    sheet.autoResizeColumns(1, headers.length)
  })
}

// ── Respuestas JSON ──────────────────────────────────────────
function jsonOk(data) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, data }))
    .setMimeType(ContentService.MimeType.JSON)
}

function jsonError(msg) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: false, error: msg }))
    .setMimeType(ContentService.MimeType.JSON)
}
