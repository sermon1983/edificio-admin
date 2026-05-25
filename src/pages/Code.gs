// ============================================================
//  AdminEdificio — Google Apps Script API v4
// ============================================================

var DATA_SHEETS = ['gastos','consumos','rondas','incidentes','ordenes','recaudacion']

var HEADERS = {
  edificios:    ['id','nombre','direccion','unidades','color','activo','tipo','modulos'],
  usuarios:     ['id','nombre','email','password_hash','rol','edificios_ids'],
  sesiones:     ['token','user_id','expiry'],
  notif_config: ['id','edificio_id','nombre','evento','emails','activo','from_name','reply_to'],
  gastos:       ['id','concepto','monto','fecha','categoria','estado','proveedor'],
  consumos:     ['id','tipo','unidad','lectura_anterior','lectura_actual','mes','costo_unitario','estado'],
  rondas:       ['id','guardia','inicio','fin','zonas','novedades','estado','imagenes'],
  incidentes:   ['id','titulo','tipo','prioridad','reportado_por','fecha','estado','descripcion','imagenes','comentarios','fecha_cierre'],
  ordenes:      ['id','titulo','categoria','prioridad','asignado_a','fecha_creacion','fecha_limite','estado','descripcion','imagenes'],
  recaudacion:  ['id','periodo','unidad','propietario','monto','fecha_vencimiento','fecha_pago','estado','observaciones'],
}

var MODULOS_DEFAULT = 'gastos,consumos,rondas,incidentes,ordenes,recaudacion'

var PRIORIDAD_DIAS = { 'Baja':30, 'Media':20, 'Alta':10, 'Crítica':5 }

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

function getImagesFolder() {
  var props    = PropertiesService.getScriptProperties()
  var folderId = props.getProperty('IMAGES_FOLDER_ID')
  if (folderId) { try { return DriveApp.getFolderById(folderId) } catch(e) {} }
  var folder = DriveApp.createFolder('AdminEdificio_Imagenes')
  props.setProperty('IMAGES_FOLDER_ID', folder.getId())
  return folder
}

// ── Formato ───────────────────────────────────────────────────
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
  sheet.appendRow([token, userId, new Date(Date.now()+24*60*60*1000).toISOString()])
  return token
}

function validateToken(token) {
  if (!token) return null
  var ss    = getSpreadsheet()
  var sheet = ss.getSheetByName('sesiones')
  if (!sheet) return null
  var data  = sheet.getDataRange().getValues()
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === token) {
      if (new Date(data[i][2]).getTime() > Date.now()) return getUserById(Number(data[i][1]))
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
    if (action === 'getNotifConfig') {
      var user = validateToken(token)
      if (!user || user.rol !== 'superadmin') return jsonError('Sin permisos')
      return jsonOk(getSheetRows('notif_config'))
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

    // Notificaciones config
    if (action === 'createNotifConfig') {
      if (user.rol !== 'superadmin') return jsonError('Sin permisos')
      var sheet  = getSpreadsheet().getSheetByName('notif_config')
      var newId  = getNextId(sheet)
      var d      = body.data
      sheet.appendRow([newId, d.edificio_id, d.nombre, d.evento, d.emails, d.activo||'true'])
      return jsonOk({ id:newId, ...d })
    }
    if (action === 'updateNotifConfig') {
      if (user.rol !== 'superadmin') return jsonError('Sin permisos')
      updateRow('notif_config', Number(body.id), body.data); return jsonOk({id:body.id})
    }
    if (action === 'deleteNotifConfig') {
      if (user.rol !== 'superadmin') return jsonError('Sin permisos')
      deleteRow('notif_config', Number(body.id)); return jsonOk({id:body.id})
    }

    // Datos por edificio
    var sheetName  = body.sheet
    var buildingId = body.building_id
    var data       = body.data
    var id         = body.id
    if (!canAccessBuilding(user, buildingId)) return jsonError('Sin acceso')
    var fullSheet  = sheetName + '_' + buildingId

    if (action === 'create') {
      var created = createDataRow(fullSheet, sheetName, data)
      // Enviar email si es incidente
      if (sheetName === 'incidentes') {
        try { sendIncidentEmail(buildingId, 'incidente_creado', created, user) } catch(ex) { Logger.log('Email error: '+ex) }
      }
      return jsonOk(created)
    }
    if (action === 'update') {
      updateRow(fullSheet, Number(id), data)
      // Enviar email si es incidente con cambio de estado o comentario
      if (sheetName === 'incidentes' && (data.estado || data.comentarios)) {
        try {
          var updated = getRowById(fullSheet, Number(id))
          sendIncidentEmail(buildingId, 'incidente_actualizado', updated, user)
        } catch(ex) { Logger.log('Email error: '+ex) }
      }
      return jsonOk({id:id})
    }
    if (action === 'delete') { deleteRow(fullSheet, Number(id)); return jsonOk({id:id}) }

    return jsonError('Acción desconocida: ' + action)
  } catch(err) { return jsonError(err.message) }
}

// ── Emails ────────────────────────────────────────────────────
function sendIncidentEmail(edificioId, evento, incidente, actor) {
  var configs = getSheetRows('notif_config').filter(function(c) {
    return String(c.edificio_id) === String(edificioId) &&
           String(c.activo) === 'true' &&
           (c.evento === 'todos' || c.evento === evento)
  })
  if (!configs.length) return

  var edificio   = getSheetRows('edificios').filter(function(e){ return String(e.id)===String(edificioId) })[0]
  var nomEdif    = edificio ? edificio.nombre : 'Edificio ' + edificioId
  var dias       = PRIORIDAD_DIAS[incidente.prioridad] || 30
  var fechaLimite = ''
  if (incidente.fecha) {
    var d = new Date(incidente.fecha)
    d.setDate(d.getDate() + dias)
    fechaLimite = Utilities.formatDate(d, Session.getScriptTimeZone(), 'dd/MM/yyyy')
  }

  var isNew       = evento === 'incidente_creado'
  var asunto      = (isNew ? '[NUEVO INCIDENTE] ' : '[ACTUALIZACIÓN] ') + incidente.titulo + ' — ' + nomEdif
  var colorPrio   = { 'Crítica':'#dc2626','Alta':'#ea580c','Media':'#d97706','Baja':'#16a34a' }
  var color       = colorPrio[incidente.prioridad] || '#1B98E0'

  var html = '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8f9fa;padding:20px;">' +
    '<div style="background:#0F4C75;color:white;padding:20px 24px;border-radius:8px 8px 0 0;">' +
    '<h2 style="margin:0;font-size:20px;">🏢 AdminEdificio</h2>' +
    '<p style="margin:4px 0 0;opacity:0.8;font-size:13px;">' + nomEdif + '</p></div>' +
    '<div style="background:white;padding:24px;border-radius:0 0 8px 8px;border:1px solid #e5e7eb;">' +
    '<h3 style="margin:0 0 16px;color:#111;">' + (isNew ? '🚨 Nuevo Incidente' : '🔄 Actualización de Incidente') + '</h3>' +
    '<table style="width:100%;border-collapse:collapse;font-size:14px;">' +
    '<tr><td style="padding:8px 0;color:#666;width:130px;">Título</td><td style="padding:8px 0;font-weight:600;">' + (incidente.titulo||'') + '</td></tr>' +
    '<tr><td style="padding:8px 0;color:#666;">Tipo</td><td style="padding:8px 0;">' + (incidente.tipo||'') + '</td></tr>' +
    '<tr><td style="padding:8px 0;color:#666;">Prioridad</td><td style="padding:8px 0;"><span style="background:'+color+';color:white;padding:2px 10px;border-radius:12px;font-size:12px;font-weight:600;">' + (incidente.prioridad||'') + '</span></td></tr>' +
    '<tr><td style="padding:8px 0;color:#666;">Estado</td><td style="padding:8px 0;">' + (incidente.estado||'') + '</td></tr>' +
    '<tr><td style="padding:8px 0;color:#666;">Reportado por</td><td style="padding:8px 0;">' + (incidente.reportado_por||'') + '</td></tr>' +
    '<tr><td style="padding:8px 0;color:#666;">Fecha creación</td><td style="padding:8px 0;">' + (incidente.fecha||'') + '</td></tr>' +
    '<tr><td style="padding:8px 0;color:#666;">Fecha límite</td><td style="padding:8px 0;font-weight:600;color:'+color+';">' + fechaLimite + ' (' + dias + ' días)</td></tr>' +
    '</table>' +
    (incidente.descripcion ? '<div style="margin-top:16px;padding:12px;background:#f3f4f6;border-radius:6px;font-size:13px;color:#374151;"><b>Descripción:</b><br>' + incidente.descripcion + '</div>' : '') +
    (!isNew && actor ? '<p style="margin-top:16px;font-size:12px;color:#9ca3af;">Actualizado por: ' + actor.nombre + '</p>' : '') +
    '</div></div>'

  configs.forEach(function(config) {
    var emails   = String(config.emails||'').split(',').map(function(e){return e.trim()}).filter(Boolean)
    var fromName = String(config.from_name||'AdminEdificio')
    var replyTo  = String(config.reply_to||'')
    emails.forEach(function(email) {
      try {
        var opts = { to:email, subject:asunto, htmlBody:html, name:fromName }
        if(replyTo) opts.replyTo = replyTo
        MailApp.sendEmail(opts)
      } catch(ex) { Logger.log('MailApp error: '+ex) }
    })
  })
}

// ── Upload imagen ─────────────────────────────────────────────
function uploadImageToDrive(base64Data, mimeType, filename) {
  var folder = getImagesFolder()
  var bytes  = Utilities.base64Decode(base64Data)
  var blob   = Utilities.newBlob(bytes, mimeType||'image/jpeg', filename||'imagen.jpg')
  var file   = folder.createFile(blob)
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW)
  var fileId = file.getId()
  return {
    url:       'https://drive.google.com/uc?export=view&id=' + fileId,
    thumbnail: 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w400',
    id:        fileId,
  }
}

// ── Login ─────────────────────────────────────────────────────
function handleLogin(body) {
  var email = body.email; var password = body.password
  if (!email||!password) return jsonError('Email y contraseña requeridos')
  var usuarios = getSheetRows('usuarios')
  var user = null
  for (var i=0;i<usuarios.length;i++) { if (usuarios[i].email===email){user=usuarios[i];break} }
  if (!user) return jsonError('Email o contraseña incorrectos')
  if (user.password_hash !== hashPwd(password)) return jsonError('Email o contraseña incorrectos')
  return jsonOk({ token:createToken(user.id), user:{id:user.id,nombre:user.nombre,email:user.email,rol:user.rol}, edificios:getEdificiosForUser(user) })
}

// ── Edificios ─────────────────────────────────────────────────
function getEdificiosForUser(user) {
  var all = getSheetRows('edificios')
  if (user.rol==='superadmin') return all
  var ids = (user.edificios_ids||'').split(',').map(function(s){return s.trim()}).filter(Boolean)
  return all.filter(function(e){return ids.indexOf(String(e.id))!==-1})
}

function canAccessBuilding(user, buildingId) {
  if (user.rol==='superadmin') return true
  var ids = (user.edificios_ids||'').split(',').map(function(s){return s.trim()})
  return ids.indexOf(String(buildingId))!==-1
}

function createEdificio(data) {
  var ss    = getSpreadsheet()
  var sheet = ss.getSheetByName('edificios')
  var newId = getNextId(sheet)
  data.id   = newId
  if (!data.modulos) data.modulos = MODULOS_DEFAULT
  var row   = HEADERS['edificios'].map(function(h){return data[h]!==undefined?data[h]:''})
  sheet.appendRow(row)
  for (var i=0;i<DATA_SHEETS.length;i++) {
    var name=DATA_SHEETS[i]; var sName=name+'_'+newId
    var ds=ss.getSheetByName(sName); if(!ds) ds=ss.insertSheet(sName)
    ds.clearContents()
    var dh=HEADERS[name]; ds.getRange(1,1,1,dh.length).setValues([dh])
    styleHeader(ds,dh.length)
    if(name==='consumos'){var mi=dh.indexOf('mes');if(mi!==-1)ds.getRange(1,mi+1,ds.getMaxRows(),1).setNumberFormat('@')}
    ds.setFrozenRows(1)
  }
  return data
}

function deleteEdificio(id) {
  var ss=getSpreadsheet()
  for(var i=0;i<DATA_SHEETS.length;i++){var s=ss.getSheetByName(DATA_SHEETS[i]+'_'+id);if(s)ss.deleteSheet(s)}
  deleteRow('edificios',id)
}

// ── Usuarios ──────────────────────────────────────────────────
function getUserById(id) {
  var rows=getSheetRows('usuarios')
  for(var i=0;i<rows.length;i++){if(Number(rows[i].id)===id)return rows[i]}
  return null
}
function createUsuario(data) {
  var sheet=getSpreadsheet().getSheetByName('usuarios')
  var newId=getNextId(sheet)
  sheet.appendRow([newId,data.nombre,data.email,hashPwd(data.password||'admin123'),data.rol||'admin',data.edificios_ids||''])
  return {id:newId,nombre:data.nombre,email:data.email,rol:data.rol,edificios_ids:data.edificios_ids}
}
function updateUsuario(id,data) {
  var sheet=getSpreadsheet().getSheetByName('usuarios')
  var all=sheet.getDataRange().getValues()
  for(var i=1;i<all.length;i++){
    if(Number(all[i][0])===id){
      if(data.nombre) sheet.getRange(i+1,2).setValue(data.nombre)
      if(data.email)  sheet.getRange(i+1,3).setValue(data.email)
      if(data.password) sheet.getRange(i+1,4).setValue(hashPwd(data.password))
      if(data.rol)    sheet.getRange(i+1,5).setValue(data.rol)
      if(data.edificios_ids!==undefined) sheet.getRange(i+1,6).setValue(data.edificios_ids)
      return
    }
  }
}

// ── CRUD ──────────────────────────────────────────────────────
function getSheetRows(sheetName) {
  var ss=getSpreadsheet(); var sheet=ss.getSheetByName(sheetName)
  if(!sheet) return []
  var all=sheet.getDataRange().getValues(); if(all.length<=1) return []
  var headers=all[0]
  return all.slice(1).map(function(row){
    var obj={}
    for(var i=0;i<headers.length;i++) obj[headers[i]]=fmtVal(headers[i],row[i])
    return obj
  })
}

function getRowById(sheetName, id) {
  var rows = getSheetRows(sheetName)
  for (var i=0;i<rows.length;i++){if(Number(rows[i].id)===id)return rows[i]}
  return null
}

function createDataRow(fullSheetName, baseName, data) {
  var ss=getSpreadsheet(); var sheet=ss.getSheetByName(fullSheetName)
  if(!sheet) throw new Error('Hoja no encontrada: '+fullSheetName)
  var headers=HEADERS[baseName]; if(!headers) throw new Error('Headers no definidos: '+baseName)
  data.id=getNextId(sheet)
  var row=headers.map(function(h){return(data[h]!==undefined&&data[h]!==null)?data[h]:''})
  sheet.appendRow(row); return data
}

function updateRow(sheetName, id, data) {
  var ss=getSpreadsheet(); var sheet=ss.getSheetByName(sheetName); if(!sheet) return
  var all=sheet.getDataRange().getValues(); var headers=all[0].slice()

  // Agrega columnas faltantes dinámicamente (ej: modulos, fecha_cierre)
  for(var key in data){
    if(!data.hasOwnProperty(key)||key==='id') continue
    if(headers.indexOf(key)===-1){
      var newCol=headers.length+1
      var hCell=sheet.getRange(1,newCol)
      hCell.setValue(key); hCell.setBackground('#0F4C75'); hCell.setFontColor('#FFFFFF'); hCell.setFontWeight('bold')
      headers.push(key)
      Logger.log('Columna agregada: '+key+' en '+sheetName)
    }
  }
  for(var i=1;i<all.length;i++){
    if(Number(all[i][0])===id){
      for(var j=0;j<headers.length;j++){if(data[headers[j]]!==undefined)sheet.getRange(i+1,j+1).setValue(data[headers[j]])}
      return
    }
  }
}

function deleteRow(sheetName, id) {
  var ss=getSpreadsheet(); var sheet=ss.getSheetByName(sheetName); if(!sheet) return
  var all=sheet.getDataRange().getValues()
  for(var i=1;i<all.length;i++){if(Number(all[i][0])===id){sheet.deleteRow(i+1);return}}
}

function getNextId(sheet) {
  var last=sheet.getLastRow(); if(last<=1) return 1
  var ids=sheet.getRange(2,1,last-1,1).getValues(); var maxId=0
  for(var i=0;i<ids.length;i++){var v=Number(ids[i][0]);if(!isNaN(v)&&v>maxId)maxId=v}
  return maxId+1
}

// ── Init ──────────────────────────────────────────────────────
function initSheets() {
  var ss=getSpreadsheet()
  Logger.log('Planilla: '+ss.getName())
  var masterSheets=['edificios','usuarios','sesiones','notif_config']
  for(var m=0;m<masterSheets.length;m++){
    var name=masterSheets[m]; var sheet=ss.getSheetByName(name)
    if(!sheet){sheet=ss.insertSheet(name);Logger.log('Creada: '+name)}
    if(sheet.getLastRow()===0){var h=HEADERS[name];sheet.getRange(1,1,1,h.length).setValues([h]);styleHeader(sheet,h.length);sheet.setFrozenRows(1)}
  }
  var usSheet=ss.getSheetByName('usuarios')
  if(usSheet.getLastRow()<=1){usSheet.appendRow([1,'Administrador','admin@edificio.cl',hashPwd('admin123'),'superadmin','']);Logger.log('Admin creado')}
  var edSheet=ss.getSheetByName('edificios')
  if(edSheet.getLastRow()<=1){
    edSheet.appendRow([1,'Edificio Las Torres','Av. Providencia 1234',48,'#1B98E0','true','edificio',MODULOS_DEFAULT])
    for(var d=0;d<DATA_SHEETS.length;d++){
      var dName=DATA_SHEETS[d]; var sName=dName+'_1'
      var ds=ss.getSheetByName(sName); if(!ds){ds=ss.insertSheet(sName)}
      if(ds.getLastRow()===0){
        var dh=HEADERS[dName]; ds.getRange(1,1,1,dh.length).setValues([dh]); styleHeader(ds,dh.length)
        if(dName==='consumos'){var mi=dh.indexOf('mes');if(mi!==-1)ds.getRange(1,mi+1,ds.getMaxRows(),1).setNumberFormat('@')}
        ds.setFrozenRows(1)
      }
    }
    Logger.log('Edificio ejemplo creado')
  }
  var def=ss.getSheetByName('Hoja 1')||ss.getSheetByName('Sheet1')
  if(def&&ss.getSheets().length>1){try{ss.deleteSheet(def)}catch(e){}}
  Logger.log('✅ initSheets OK — '+ss.getUrl())
  Logger.log('🔑 admin@edificio.cl / admin123')
}

function styleHeader(sheet,cols){
  var r=sheet.getRange(1,1,1,cols)
  r.setBackground('#0F4C75');r.setFontColor('#FFFFFF');r.setFontWeight('bold')
  sheet.autoResizeColumns(1,cols)
}

function jsonOk(data){return ContentService.createTextOutput(JSON.stringify({ok:true,data:data})).setMimeType(ContentService.MimeType.JSON)}
function jsonError(msg){return ContentService.createTextOutput(JSON.stringify({ok:false,error:msg})).setMimeType(ContentService.MimeType.JSON)}

// ════════════════════════════════════════════════════════════
//  VERIFICACIÓN DE INCIDENTES VENCIDOS — trigger diario
// ════════════════════════════════════════════════════════════

var DIAS_PRIORIDAD = { 'Crítica':5, 'Alta':10, 'Media':20, 'Baja':30 }

/**
 * Ejecutar manualmente UNA VEZ para autorizar DriveApp.
 * Luego puedes subir imágenes desde la app.
 */
function testDriveSetup() {
  var folder = getImagesFolder()
  Logger.log('✅ DriveApp autorizado. Carpeta: ' + folder.getName())
  Logger.log('🔗 URL: ' + folder.getUrl())
}

/**
 * Revisa todos los edificios buscando incidentes vencidos
 * y envía notificaciones por email.
 * Configurar como trigger: Tiempo → Cada día → 9:00am
 */
function checkExpiredIncidents() {
  var ss        = getSpreadsheet()
  var edificios = getSheetRows('edificios')
  var configs   = getSheetRows('notif_config').filter(function(c){ return String(c.activo)==='true' })
  var hoy       = new Date(); hoy.setHours(0,0,0,0)
  var manana    = new Date(hoy.getTime()+86400000)
  var resumen   = []

  Logger.log('=== checkExpiredIncidents: ' + Utilities.formatDate(hoy, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm') + ' ===')

  for(var e=0; e<edificios.length; e++){
    var edif = edificios[e]
    var sheetName = 'incidentes_' + edif.id
    var sheet = ss.getSheetByName(sheetName)
    if(!sheet) continue

    var incidentes = getSheetRows(sheetName).filter(function(i){
      return i.estado !== 'Resuelto' && i.estado !== 'Cerrado' && i.fecha
    })

    for(var i=0; i<incidentes.length; i++){
      var inc  = incidentes[i]
      var dias = DIAS_PRIORIDAD[inc.prioridad] || 30
      var inicio  = new Date(inc.fecha); inicio.setHours(0,0,0,0)
      var limite  = new Date(inicio.getTime() + dias*86400000)
      var restantes = Math.round((limite - hoy) / 86400000)

      var tipo_alerta = null
      if(restantes < 0)           tipo_alerta = 'vencido'     // ya venció
      else if(restantes === 0)    tipo_alerta = 'vence_hoy'   // vence hoy
      else if(restantes === 1)    tipo_alerta = 'vence_manana' // vence mañana

      if(!tipo_alerta) continue

      // Construir y enviar emails para este edificio
      var cfgList = configs.filter(function(c){
        return String(c.edificio_id)===String(edif.id) &&
               (c.evento==='todos' || c.evento==='incidente_creado' || c.evento==='incidente_actualizado')
      })
      if(!cfgList.length) continue

      var tz       = Session.getScriptTimeZone()
      var fechaLimStr = Utilities.formatDate(limite, tz, 'dd/MM/yyyy')
      var colorPrio   = { 'Crítica':'#dc2626','Alta':'#ea580c','Media':'#d97706','Baja':'#16a34a' }
      var color       = colorPrio[inc.prioridad]||'#1B98E0'
      var alertaTexto = tipo_alerta==='vencido' ? '⚠️ INCIDENTE VENCIDO' : tipo_alerta==='vence_hoy' ? '🔔 VENCE HOY' : '⏰ VENCE MAÑANA'
      var asunto      = alertaTexto + ': ' + inc.titulo + ' — ' + edif.nombre

      var html = '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8f9fa;padding:20px;">' +
        '<div style="background:'+color+';color:white;padding:20px 24px;border-radius:8px 8px 0 0;">' +
        '<h2 style="margin:0;font-size:20px;">'+alertaTexto+'</h2>' +
        '<p style="margin:4px 0 0;opacity:0.9;font-size:13px;">' + edif.nombre + '</p></div>' +
        '<div style="background:white;padding:24px;border-radius:0 0 8px 8px;border:1px solid #e5e7eb;">' +
        '<table style="width:100%;border-collapse:collapse;font-size:14px;">' +
        '<tr><td style="padding:8px 0;color:#666;width:130px;">Título</td><td style="padding:8px 0;font-weight:600;">'+(inc.titulo||'')+'</td></tr>' +
        '<tr><td style="padding:8px 0;color:#666;">Tipo</td><td style="padding:8px 0;">'+(inc.tipo||'')+'</td></tr>' +
        '<tr><td style="padding:8px 0;color:#666;">Prioridad</td><td style="padding:8px 0;"><span style="background:'+color+';color:white;padding:2px 10px;border-radius:12px;font-size:12px;font-weight:600;">'+(inc.prioridad||'')+'</span></td></tr>' +
        '<tr><td style="padding:8px 0;color:#666;">Estado</td><td style="padding:8px 0;">'+(inc.estado||'')+'</td></tr>' +
        '<tr><td style="padding:8px 0;color:#666;">Reportado por</td><td style="padding:8px 0;">'+(inc.reportado_por||'')+'</td></tr>' +
        '<tr><td style="padding:8px 0;color:#666;">Fecha creación</td><td style="padding:8px 0;">'+(inc.fecha||'')+'</td></tr>' +
        '<tr><td style="padding:8px 0;color:#666;">Fecha límite</td><td style="padding:8px 0;font-weight:700;color:'+color+';">'+fechaLimStr+' ('+dias+' días)</td></tr>' +
        (restantes<0?'<tr><td style="padding:8px 0;color:#dc2626;font-weight:700;" colspan="2">⚠️ Venció hace '+Math.abs(restantes)+' días — Requiere atención inmediata</td></tr>':'') +
        '</table>' +
        (inc.descripcion?'<div style="margin-top:16px;padding:12px;background:#f3f4f6;border-radius:6px;font-size:13px;"><b>Descripción:</b><br>'+inc.descripcion+'</div>':'') +
        '</div></div>'

      cfgList.forEach(function(cfg){
        var emails   = String(cfg.emails||'').split(',').map(function(em){return em.trim()}).filter(Boolean)
        var fromName = String(cfg.from_name||'AdminEdificio')
        var replyTo  = String(cfg.reply_to||'')
        emails.forEach(function(email){
          try {
            var opts = { to:email, subject:asunto, htmlBody:html, name:fromName }
            if(replyTo) opts.replyTo = replyTo
            MailApp.sendEmail(opts)
            Logger.log('Email enviado a: '+email+' | '+asunto)
          } catch(ex){ Logger.log('Error email: '+ex) }
        })
      })

      resumen.push(edif.nombre + ' | ' + inc.titulo + ' | ' + tipo_alerta)
    }
  }

  Logger.log('=== Resumen: ' + resumen.length + ' alertas enviadas ===')
  if(resumen.length) resumen.forEach(function(r){ Logger.log('  - '+r) })
  return resumen.length
}

/**
 * Crea el trigger automático diario para checkExpiredIncidents.
 * Ejecutar UNA SOLA VEZ desde el editor de Apps Script.
 */
function crearTriggerDiario() {
  // Eliminar triggers existentes de esta función
  var triggers = ScriptApp.getProjectTriggers()
  for(var i=0; i<triggers.length; i++){
    if(triggers[i].getHandlerFunction()==='checkExpiredIncidents'){
      ScriptApp.deleteTrigger(triggers[i])
    }
  }
  // Crear nuevo trigger diario a las 9am
  ScriptApp.newTrigger('checkExpiredIncidents')
    .timeBased()
    .everyDays(1)
    .atHour(9)
    .create()
  Logger.log('✅ Trigger diario creado: checkExpiredIncidents se ejecutará cada día a las 9am')
}
