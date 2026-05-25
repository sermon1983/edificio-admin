import React, { useRef, useState } from 'react'
import { X, ImagePlus, AlertCircle } from 'lucide-react'
import { api } from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'

// Comprime imagen a max 800px, calidad 0.75
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Error al leer archivo'))
    reader.onload = (e) => {
      const img = new Image()
      img.onerror = () => reject(new Error('Imagen inválida'))
      img.onload = () => {
        const MAX = 800
        let w = img.width, h = img.height
        if (w > MAX || h > MAX) {
          if (w > h) { h = Math.round((h * MAX) / w); w = MAX }
          else       { w = Math.round((w * MAX) / h); h = MAX }
        }
        const canvas = document.createElement('canvas')
        canvas.width = w; canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        canvas.toBlob((blob) => {
          if (!blob) { reject(new Error('Error al comprimir imagen')); return }
          const r2 = new FileReader()
          r2.onload = (e2) => {
            const b64 = e2.result.split(',')[1]
            resolve({ base64: b64, mimeType: blob.type, filename: file.name, preview: e2.result })
          }
          r2.readAsDataURL(blob)
        }, 'image/jpeg', 0.75)
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

export default function ImageUpload({ value = '', onChange, label = 'Adjuntar imágenes' }) {
  const { token } = useAuth()
  const inputRef   = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [error,     setError]     = useState(null)

  const urls = value ? value.split(',').map(s => s.trim()).filter(Boolean) : []

  async function handleFiles(files) {
    if (!files?.length) return
    setUploading(true); setError(null)
    try {
      const newUrls = []
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (!file.type.startsWith('image/')) { setError('Solo se permiten imágenes (JPG, PNG, etc.)'); continue }
        if (file.size > 10 * 1024 * 1024) { setError('Imagen muy grande (máx 10MB)'); continue }
        const compressed = await compressImage(file)
        const result = await api.uploadImage(token, compressed.base64, compressed.mimeType, compressed.filename)
        newUrls.push(result.thumbnail || result.url)
      }
      if (newUrls.length > 0) onChange([...urls, ...newUrls].join(','))
    } catch (e) {
      // Mensaje de error más claro
      const msg = e.message || 'Error desconocido'
      if (msg.includes('DriveApp') || msg.includes('drive') || msg.includes('Drive')) {
        setError('Google Drive no está autorizado. Ejecuta "testDriveSetup" en Apps Script primero.')
      } else if (msg.includes('Sesión')) {
        setError('Sesión expirada. Recarga la página.')
      } else {
        setError('Error al subir imagen: ' + msg)
      }
    } finally {
      setUploading(false)
    }
  }

  function remove(idx) {
    onChange(urls.filter((_, i) => i !== idx).join(','))
  }

  return (
    <div>
      {/* Thumbnails */}
      {urls.length > 0 && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:10 }}>
          {urls.map((url, i) => (
            <div key={i} style={{ position:'relative', width:80, height:80 }}>
              <img src={url} alt="" style={{ width:80, height:80, objectFit:'cover', borderRadius:8, border:'1px solid var(--border-main)', cursor:'pointer' }}
                onClick={() => window.open(url, '_blank')} onError={e=>e.target.style.opacity='0.3'} />
              <button onClick={() => remove(i)} style={{ position:'absolute', top:-6, right:-6, width:20, height:20, borderRadius:'50%', background:'var(--red)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <X size={11} color="white"/>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Botón upload */}
      <button type="button" onClick={() => { setError(null); inputRef.current?.click() }}
        disabled={uploading}
        style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 14px', borderRadius:'var(--radius-md)', background:'var(--bg-elevated)', border:'1px dashed var(--border-main)', color:'var(--text-muted)', cursor:'pointer', fontSize:13, fontFamily:'var(--font-sans)', transition:'all 0.15s', width:'100%', justifyContent:'center' }}
        onMouseEnter={e => e.currentTarget.style.borderColor='var(--accent)'}
        onMouseLeave={e => e.currentTarget.style.borderColor='var(--border-main)'}
      >
        {uploading
          ? <><span className="spinner" style={{ width:16, height:16, borderWidth:2 }}/> Subiendo imagen...</>
          : <><ImagePlus size={15}/> {label}</>}
      </button>

      <input ref={inputRef} type="file" accept="image/*" multiple style={{ display:'none' }}
        onChange={e => { handleFiles(e.target.files); e.target.value = '' }}/>

      {error && (
        <div style={{ display:'flex', alignItems:'flex-start', gap:7, background:'var(--red-soft)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:'var(--radius-md)', padding:'9px 12px', marginTop:8 }}>
          <AlertCircle size={14} color="var(--red)" style={{ flexShrink:0, marginTop:1 }}/>
          <p style={{ color:'var(--red)', fontSize:12.5, lineHeight:1.5 }}>{error}</p>
        </div>
      )}
    </div>
  )
}
