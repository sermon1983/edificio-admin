// ============================================================
//  AdminEdificio — Google Apps Script API v3
//  Multi-edificio, auth, imágenes en Drive, recaudación
// ============================================================

var DATA_SHEETS = ['gastos','consumos','rondas','incidentes','ordenes','recaudacion']

var HEADERS = {
  edificios:   ['id','nombre','direccion','unidades','color','activo','tipo'],
  usuarios:    ['id','nombre','email','password_hash','rol','edificios_ids'],
  sesiones:    ['token','user_id','expiry'],
  gastos:      ['id','concepto','monto','fecha','categoria','estado','proveedor'],
  consumos:    ['id','tipo','unidad','lectura_anterior','lectura_actual','mes','costo_unitario','estado'],
  rondas:      ['id','guardia','inicio','fin','zonas','novedades','estado','imagenes'],
  incidentes:  ['id','titulo','tipo','prioridad','reportado_por','fecha','estado','descripcion','imagenes'],
  ordenes:     ['id','titulo','categoria','prioridad','asignado_a','fecha_creacion','fecha_limite','estado','descripcion','imagenes'],
  recaudacion: ['id','periodo','unidad','propietario','monto','fecha_vencimiento','fecha_pago','estado','observaciones'],
}

var MES_FIELDS  = ['mes']
var DATE_FIELDS = ['fecha','fecha_creacion','fecha_limite','fecha_vencimiento','fecha_pago']
var NUM_FIELDS  = ['id','monto','lectura_anterior','lectura_actual','costo_unitario','unidades']

// ── Planilla ──────────────────────────────────────────────────
function getSpreadsheet() {
  try { var a = SpreadsheetApp.getActiveSpreadsheet(); if (a) return a } catch(e) {}
  var props = PropertiesService.getScriptProperties()
  var id    = props.getProperty('SPREADSHEET_ID')
  if (id) { try { return SpreadsheetApp.openById(id) } catch(e) {} }
  var ss = SpreadsheetApp.create('AdminEdificio — Base de Datos')
  props.setProperty('SPREADSHEET_ID', ss.getId())
  return ss
}

// ── Carpeta de imágenes en Drive ─────────────────────────────
function getImagesFolder() {
  var props    = PropertiesService.getScriptProperties()
  var folderId = props.getProperty('IMAGES_FOLDER_ID')
  if (folderId) { try { return DriveApp.getFolderById(folderId) } catch(e) {} }
  var folder = DriveApp.createFolder('AdminEdificio_Imagenes')
  props.setProperty('IMAGES_FOLDER_ID', folder.getId())
  return folder
}

// ── Formato de valores ───────────────────────────────────────
function fmtVal(header, val) {
  if (val === null || val === undefined || val === '') return ''
  var tz = Session.getScriptTimeZone()
  if (MES_FIELDS.indexOf(header) !== -1) {
    if (val instanceof Date) return Utilities.formatDate(val, tz, 'yyyy-MM')
    return String(val).slice(0,7)
  }
  if (DATE_FIELDS.indexOf(header) !== -1) {
    if (val instanceof Date) return Utilities.formatDate(val, tz, 'yyyy-MM-dd')
    return String(val).slice(0,10)
  }
  if (NUM_FIELDS.indexOf(header) !== -1) { var n = Number(val); return isNaN(n) ? val : n }
  if (val instanceof Date) return Utilities.formatDate(val, tz, 'yyyy-MM-dd HH:mm')
  return val
}

function hashPwd(pwd) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, pwd + 'ae_salt_2025')
  return bytes.map(function(b){ return ('0'+(b&0xff).toString(16)).slice(-2) }).join('')
}

// ── Tokens ───────────────────────────────────────────────────
function createToken(userId) {
  var ss    = getSpreadsheet()
  var sheet = ss.getSheetByName('sesiones')
  var token = Utilities.getUuid()
  var exp   = new Date(Date.now() + 24*60*60*1000).toISOString()
  sheet.appendRow([token, userId, exp])
  return token
}

function validateToken(token) {
  if (!token) return null
  var ss    = getSpreadsheet()
  var sheet = ss.getSheetByName('sesiones')
  if (!sheet) return null
  var data  = sheet.getDataRange().getValues()
  var now   = Date.now()
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === token) {
      if (new Date(data[i][2]).getTime() > now) return getUserById(Number(data[i][1]))
      sheet.deleteRow(i+1); return null
    }
  }
  return null
}

function invalidateToken(token) {
  var ss    = getSpreadsheet()
  var sheet = ss.getSheetByName('sesiones')
  if (!sheet) return
  var data  = sheet.getDataRange().getValues()
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === token) { sheet.deleteRow(i+1); return }
  }
}

// ── GET ──────────────────────────────────────────────────────
function doGet(e) {
  try {
    var action     = e.parameter.action
    var token      = e.parameter.token
    var sheetName  = e.parameter.sheet
    var buildingId = e.parameter.building_id

    if (action === 'getEdificios') {
      var user = validateToken(token)
      if (!user) return jsonError('Sesión inválida')
      return jsonOk(getEdificiosForUser(user))
    }
    if (action === 'getUsuarios') {
      var user = validateToken(token)
      if (!user || user.rol !== 'superadmin') return jsonError('Sin permisos')
      return jsonOk(getSheetRows('usuarios').map(function(u){
        return { id:u.id, nombre:u.nombre, email:u.email, rol:u.rol, edificios_ids:u.edificios_ids }
      }))
    }
    if (sheetName && buildingId) {
      var user = validateToken(token)
      if (!user) return jsonError('Sesión inválida')
      if (!canAccessBuilding(user, buildingId)) return jsonError('Sin acceso')
      return jsonOk(getSheetRows(sheetName + '_' + buildingId))
    }
    return jsonError('Parámetros insuficientes')
  } catch(err) { return jsonError(err.message) }
}

// ── POST ─────────────────────────────────────────────────────
function doPost(e) {
  try {
    var body   = JSON.parse(e.postData.contents)
    var action = body.action
    var token  = body.token

    if (action === 'login')  return handleLogin(body)
    if (action === 'logout') { invalidateToken(token); return jsonOk({ok:true}) }
    if (action === 'init')   { initSheets(); return jsonOk({msg:'Inicializado'}) }

    // Subida de imagen (no requiere validación de edificio)
    if (action === 'uploadImage') {
      var user = validateToken(token)
      if (!user) return jsonError('Sesión inválida')
      return jsonOk(uploadImageToDrive(body.base64, body.mimeType, body.filename))
    }

    var user = validateToken(token)
    if (!user) return jsonError('Sesión inválida')

    // Edificios
    if (action === 'createEdificio') {
      if (user.rol !== 'superadmin') return jsonError('Sin permisos')
      return jsonOk(createEdificio(body.data))
    }
    if (action === 'updateEdificio') {
      if (user.rol !== 'superadmin') return jsonError('Sin permisos')
      updateRow('edificios', Number(body.id), body.data); return jsonOk({id:body.id})
    }
    if (action === 'deleteEdificio') {
      if (user.rol !== 'superadmin') return jsonError('Sin permisos')
      deleteEdificio(Number(body.id)); return jsonOk({id:body.id})
    }

    // Usuarios
    if (action === 'createUsuario') {
      if (user.rol !== 'superadmin') return jsonError('Sin permisos')
      return jsonOk(createUsuario(body.data))
    }
    if (action === 'updateUsuario') {
      if (user.rol !== 'superadmin') return jsonError('Sin permisos')
      updateUsuario(Number(body.id), body.data); return jsonOk({id:body.id})
    }
    if (action === 'deleteUsuario') {
      if (user.rol !== 'superadmin') return jsonError('Sin permisos')
      deleteRow('usuarios', Number(body.id)); return jsonOk({id:body.id})
    }

    // Datos por edificio
    var sheet      = body.sheet
    var buildingId = body.building_id
    var data       = body.data
    var id         = body.id
    if (!canAccessBuilding(user, buildingId)) return jsonError('Sin acceso')
    var fullSheet  = sheet + '_' + buildingId

    if (action === 'create') return jsonOk(createDataRow(fullSheet, sheet, data))
    if (action === 'update') { updateRow(fullSheet, Number(id), data); return jsonOk({id:id}) }
    if (action === 'delete') { deleteRow(fullSheet, Number(id));       return jsonOk({id:id}) }

    return jsonError('Acción desconocida: ' + action)
  } catch(err) { return jsonError(err.message) }
}

// ── Upload imagen a Drive ────────────────────────────────────
function uploadImageToDrive(base64Data, mimeType, filename) {
  var folder = getImagesFolder()
  var bytes  = Utilities.base64Decode(base64Data)
  var blob   = Utilities.newBlob(bytes, mimeType || 'image/jpeg', filename || 'imagen.jpg')
  var file   = folder.createFile(blob)
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW)
  var fileId = file.getId()
  return {
    url:       'https://drive.google.com/uc?export=view&id=' + fileId,
    thumbnail: 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w400',
    id:        fileId,
  }
}

// ── Login ────────────────────────────────────────────────────
function handleLogin(body) {
  var email    = body.email
  var password = body.password
  if (!email || !password) return jsonError('Email y contraseña requeridos')
  var usuarios = getSheetRows('usuarios')
  var user     = null
  for (var i = 0; i < usuarios.length; i++) {
    if (usuarios[i].email === email) { user = usuarios[i]; break }
  }
  if (!user) return jsonError('Email o contraseña incorrectos')
  if (user.password_hash !== hashPwd(password)) return jsonError('Email o contraseña incorrectos')
  var token    = createToken(user.id)
  return jsonOk({
    token:     token,
    user:      { id:user.id, nombre:user.nombre, email:user.email, rol:user.rol },
    edificios: getEdificiosForUser(user),
  })
}

// ── Edificios ─────────────────────────────────────────────────
function getEdificiosForUser(user) {
  var all = getSheetRows('edificios')
  if (user.rol === 'superadmin') return all
  var ids = (user.edificios_ids||'').split(',').map(function(s){return s.trim()}).filter(Boolean)
  return all.filter(function(e){return ids.indexOf(String(e.id)) !== -1})
}

function canAccessBuilding(user, buildingId) {
  if (user.rol === 'superadmin') return true
  var ids = (user.edificios_ids||'').split(',').map(function(s){return s.trim()})
  return ids.indexOf(String(buildingId)) !== -1
}

function createEdificio(data) {
  var ss     = getSpreadsheet()
  var sheet  = ss.getSheetByName('edificios')
  var newId  = getNextId(sheet)
  data.id    = newId
  var headers = HEADERS['edificios']
  var row    = headers.map(function(h){ return data[h] !== undefined ? data[h] : '' })
  sheet.appendRow(row)
  for (var i = 0; i < DATA_SHEETS.length; i++) {
    var name  = DATA_SHEETS[i]
    var sName = name + '_' + newId
    var ds    = ss.getSheetByName(sName)
    if (!ds) ds = ss.insertSheet(sName)
    ds.clearContents()
    var dh = HEADERS[name]
    ds.getRange(1,1,1,dh.length).setValues([dh])
    styleHeader(ds, dh.length)
    if (name === 'consumos') {
      var mi = dh.indexOf('mes')
      if (mi !== -1) ds.getRange(1, mi+1, ds.getMaxRows(), 1).setNumberFormat('@')
    }
    ds.setFrozenRows(1)
  }
  return data
}

function deleteEdificio(id) {
  var ss = getSpreadsheet()
  for (var i = 0; i < DATA_SHEETS.length; i++) {
    var s = ss.getSheetByName(DATA_SHEETS[i] + '_' + id)
    if (s) ss.deleteSheet(s)
  }
  deleteRow('edificios', id)
}

// ── Usuarios ──────────────────────────────────────────────────
function getUserById(id) {
  var rows = getSheetRows('usuarios')
  for (var i = 0; i < rows.length; i++) {
    if (Number(rows[i].id) === id) return rows[i]
  }
  return null
}

function createUsuario(data) {
  var sheet = getSpreadsheet().getSheetByName('usuarios')
  var newId = getNextId(sheet)
  var hash  = hashPwd(data.password || 'admin123')
  sheet.appendRow([newId, data.nombre, data.email, hash, data.rol||'admin', data.edificios_ids||''])
  return { id:newId, nombre:data.nombre, email:data.email, rol:data.rol, edificios_ids:data.edificios_ids }
}

function updateUsuario(id, data) {
  var sheet = getSpreadsheet().getSheetByName('usuarios')
  var all   = sheet.getDataRange().getValues()
  for (var i = 1; i < all.length; i++) {
    if (Number(all[i][0]) === id) {
      if (data.nombre)                      sheet.getRange(i+1,2).setValue(data.nombre)
      if (data.email)                       sheet.getRange(i+1,3).setValue(data.email)
      if (data.password)                    sheet.getRange(i+1,4).setValue(hashPwd(data.password))
      if (data.rol)                         sheet.getRange(i+1,5).setValue(data.rol)
      if (data.edificios_ids !== undefined) sheet.getRange(i+1,6).setValue(data.edificios_ids)
      return
    }
  }
}

// ── CRUD genérico ────────────────────────────────────────────
function getSheetRows(sheetName) {
  var ss    = getSpreadsheet()
  var sheet = ss.getSheetByName(sheetName)
  if (!sheet) return []
  var all   = sheet.getDataRange().getValues()
  if (all.length <= 1) return []
  var headers = all[0]
  return all.slice(1).map(function(row){
    var obj = {}
    for (var i = 0; i < headers.length; i++) obj[headers[i]] = fmtVal(headers[i], row[i])
    return obj
  })
}

function createDataRow(fullSheetName, baseName, data) {
  var ss      = getSpreadsheet()
  var sheet   = ss.getSheetByName(fullSheetName)
  if (!sheet) throw new Error('Hoja no encontrada: ' + fullSheetName)
  var headers = HEADERS[baseName]
  if (!headers) throw new Error('Headers no definidos para: ' + baseName)
  data.id = getNextId(sheet)
  var row = headers.map(function(h){ return (data[h] !== undefined && data[h] !== null) ? data[h] : '' })
  sheet.appendRow(row)
  return data
}

function updateRow(sheetName, id, data) {
  var ss    = getSpreadsheet()
  var sheet = ss.getSheetByName(sheetName)
  if (!sheet) return
  var all     = sheet.getDataRange().getValues()
  var headers = all[0]
  for (var i = 1; i < all.length; i++) {
    if (Number(all[i][0]) === id) {
      for (var j = 0; j < headers.length; j++) {
        if (data[headers[j]] !== undefined) sheet.getRange(i+1,j+1).setValue(data[headers[j]])
      }
      return
    }
  }
}

function deleteRow(sheetName, id) {
  var ss    = getSpreadsheet()
  var sheet = ss.getSheetByName(sheetName)
  if (!sheet) return
  var all   = sheet.getDataRange().getValues()
  for (var i = 1; i < all.length; i++) {
    if (Number(all[i][0]) === id) { sheet.deleteRow(i+1); return }
  }
}

function getNextId(sheet) {
  var last = sheet.getLastRow()
  if (last <= 1) return 1
  var ids   = sheet.getRange(2,1,last-1,1).getValues()
  var maxId = 0
  for (var i = 0; i < ids.length; i++) {
    var v = Number(ids[i][0])
    if (!isNaN(v) && v > maxId) maxId = v
  }
  return maxId + 1
}

// ── Init ─────────────────────────────────────────────────────
function initSheets() {
  var ss = getSpreadsheet()
  Logger.log('Planilla: ' + ss.getName())

  var masterSheets = ['edificios','usuarios','sesiones']
  for (var m = 0; m < masterSheets.length; m++) {
    var name  = masterSheets[m]
    var sheet = ss.getSheetByName(name)
    if (!sheet) { sheet = ss.insertSheet(name); Logger.log('Creada: ' + name) }
    if (sheet.getLastRow() === 0) {
      var h = HEADERS[name]
      sheet.getRange(1,1,1,h.length).setValues([h])
      styleHeader(sheet, h.length)
      sheet.setFrozenRows(1)
    }
  }

  var usSheet = ss.getSheetByName('usuarios')
  if (usSheet.getLastRow() <= 1) {
    usSheet.appendRow([1,'Administrador','admin@edificio.cl',hashPwd('admin123'),'superadmin',''])
    Logger.log('Usuario admin creado')
  }

  var edSheet = ss.getSheetByName('edificios')
  if (edSheet.getLastRow() <= 1) {
    edSheet.appendRow([1,'Edificio Las Torres','Av. Providencia 1234, Santiago',48,'#1B98E0','true','edificio'])
    Logger.log('Edificio ejemplo creado')
    for (var d = 0; d < DATA_SHEETS.length; d++) {
      var dName  = DATA_SHEETS[d]
      var sName  = dName + '_1'
      var ds     = ss.getSheetByName(sName)
      if (!ds) { ds = ss.insertSheet(sName); Logger.log('Creada: ' + sName) }
      if (ds.getLastRow() === 0) {
        var dh = HEADERS[dName]
        ds.getRange(1,1,1,dh.length).setValues([dh])
        styleHeader(ds, dh.length)
        if (dName === 'consumos') {
          var mi = dh.indexOf('mes')
          if (mi !== -1) ds.getRange(1,mi+1,ds.getMaxRows(),1).setNumberFormat('@')
        }
        ds.setFrozenRows(1)
      }
    }
  }

  var def = ss.getSheetByName('Hoja 1') || ss.getSheetByName('Sheet1')
  if (def && ss.getSheets().length > 1) { try { ss.deleteSheet(def) } catch(e) {} }

  Logger.log('✅ initSheets OK — ' + ss.getUrl())
  Logger.log('🔑 admin@edificio.cl / admin123')
}

function styleHeader(sheet, cols) {
  var r = sheet.getRange(1,1,1,cols)
  r.setBackground('#0F4C75'); r.setFontColor('#FFFFFF'); r.setFontWeight('bold')
  sheet.autoResizeColumns(1, cols)
}

function jsonOk(data) {
  return ContentService.createTextOutput(JSON.stringify({ok:true,data:data})).setMimeType(ContentService.MimeType.JSON)
}
function jsonError(msg) {
  return ContentService.createTextOutput(JSON.stringify({ok:false,error:msg})).setMimeType(ContentService.MimeType.JSON)
}
