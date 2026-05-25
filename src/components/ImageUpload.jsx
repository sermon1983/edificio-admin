import React, { useRef, useState } from 'react'
import { X, ImagePlus, AlertCircle, ZoomIn } from 'lucide-react'

const MAX_PX   = 250    // tamaño máximo en px
const QUALITY  = 0.45   // calidad JPEG (produce ~6-8KB por imagen)
const MAX_IMGS = 3      // máximo de imágenes por registro

// Separador seguro (base64 nunca contiene "|||")
const SEP = '|||'

// Comprime imagen a data URI sin llamadas a API
function compressToDataUri(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Solo se permiten archivos de imagen')); return
    }
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'))
    reader.onload = (e) => {
      const img = new Image()
      img.onerror = () => reject(new Error('Imagen no válida'))
      img.onload = () => {
        let w = img.width, h = img.height
        if (w === 0 || h === 0) { reject(new Error('Imagen vacía')); return }
        // Redimensionar manteniendo proporción
        if (w > MAX_PX || h > MAX_PX) {
          if (w > h) { h = Math.round((h * MAX_PX) / w); w = MAX_PX }
          else       { w = Math.round((w * MAX_PX) / h); h = MAX_PX }
        }
        const canvas = document.createElement('canvas')
        canvas.width = w; canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, w, h)
        ctx.drawImage(img, 0, 0, w, h)
        const dataUri = canvas.toDataURL('image/jpeg', QUALITY)
        if (!dataUri || dataUri === 'data:,') { reject(new Error('Error al comprimir')); return }
        resolve(dataUri)
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

// Parsea imágenes desde el valor almacenado (soporta "|||" y "," para retrocompatibilidad)
export function parseImages(value) {
  if (!value || !String(value).trim()) return []
  const str = String(value).trim()
  // Nuevo formato con base64 (separador |||)
  if (str.includes(SEP)) return str.split(SEP).map(s=>s.trim()).filter(Boolean)
  // Formato antiguo con URLs de Drive (separador ,)
  return str.split(',').map(s=>s.trim()).filter(Boolean)
}

// Componente de miniatura con zoom
function Thumb({ src, onRemove }) {
  const [zoom, setZoom] = useState(false)
  return (
    <>
      <div style={{ position:'relative', width:72, height:72, flexShrink:0 }}>
        <img src={src} alt="" onClick={() => setZoom(true)}
          style={{ width:72, height:72, objectFit:'cover', borderRadius:8, border:'1px solid var(--border-main)', cursor:'zoom-in', display:'block' }}
          onError={e=>{ e.target.style.opacity='0.3' }} />
        {onRemove && (
          <button onClick={onRemove} style={{ position:'absolute', top:-6, right:-6, width:20, height:20, borderRadius:'50%', background:'var(--red)', border:'2px solid var(--bg-surface)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', padding:0 }}>
            <X size={10} color="white"/>
          </button>
        )}
      </div>
      {zoom && (
        <div onClick={() => setZoom(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:999, cursor:'zoom-out', padding:20 }}>
          <img src={src} alt="" style={{ maxWidth:'90vw', maxHeight:'90vh', objectFit:'contain', borderRadius:12 }}/>
        </div>
      )}
    </>
  )
}

export default function ImageUpload({ value = '', onChange, label = 'Adjuntar imágenes', readOnly = false }) {
  const inputRef   = useRef(null)
  const [loading,  setLoading]  = useState(false)
  const [progress, setProgress] = useState(0)
  const [error,    setError]    = useState(null)

  const images = parseImages(value)

  async function handleFiles(files) {
    if (!files?.length) return
    const canAdd = MAX_IMGS - images.length
    if (canAdd <= 0) { setError(`Máximo ${MAX_IMGS} imágenes por registro`); return }
    setLoading(true); setError(null); setProgress(0)
    try {
      const toProcess = Array.from(files).slice(0, canAdd)
      const newUris   = []
      for (let i = 0; i < toProcess.length; i++) {
        setProgress(Math.round(((i) / toProcess.length) * 100))
        const uri = await compressToDataUri(toProcess[i])
        newUris.push(uri)
      }
      setProgress(100)
      onChange([...images, ...newUris].join(SEP))
    } catch(e) {
      setError(e.message || 'Error al procesar imagen')
    } finally {
      setLoading(false); setProgress(0)
    }
  }

  function remove(idx) {
    onChange(images.filter((_,i) => i !== idx).join(SEP))
  }

  if (readOnly && images.length === 0) return null

  return (
    <div>
      {/* Miniaturas */}
      {images.length > 0 && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:10 }}>
          {images.map((src, i) => (
            <Thumb key={i} src={src} onRemove={readOnly ? null : () => remove(i)} />
          ))}
        </div>
      )}

      {/* Botón de carga (solo en modo edición) */}
      {!readOnly && images.length < MAX_IMGS && (
        <button type="button"
          onClick={() => { setError(null); inputRef.current?.click() }}
          disabled={loading}
          style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 14px', borderRadius:'var(--radius-md)', background:'var(--bg-elevated)', border:'1px dashed var(--border-main)', color: loading ? 'var(--accent-text)' : 'var(--text-muted)', cursor: loading ? 'default' : 'pointer', fontSize:13, fontFamily:'var(--font-sans)', transition:'border-color 0.15s', width:'100%', justifyContent:'center' }}
          onMouseEnter={e => { if(!loading) e.currentTarget.style.borderColor='var(--accent)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border-main)' }}
        >
          {loading ? (
            <><span className="spinner" style={{ width:15, height:15, borderWidth:2 }}/>
              Procesando{progress > 0 ? ` ${progress}%` : '...'}
            </>
          ) : (
            <><ImagePlus size={15}/> {label} ({images.length}/{MAX_IMGS})</>
          )}
        </button>
      )}

      <input ref={inputRef} type="file" accept="image/*" multiple style={{ display:'none' }}
        onChange={e => { handleFiles(e.target.files); e.target.value='' }} />

      {error && (
        <div style={{ display:'flex', alignItems:'flex-start', gap:7, background:'var(--red-soft)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'var(--radius-md)', padding:'9px 12px', marginTop:8 }}>
          <AlertCircle size={14} color="var(--red)" style={{ flexShrink:0, marginTop:1 }}/>
          <p style={{ color:'var(--red)', fontSize:12.5, lineHeight:1.5, margin:0 }}>{error}</p>
        </div>
      )}

      {!readOnly && (
        <p style={{ fontSize:11, color:'var(--text-dim)', marginTop:6 }}>
          Imágenes se comprimen automáticamente · Máx {MAX_IMGS} por registro · Sin límite de tamaño
        </p>
      )}
    </div>
  )
}
