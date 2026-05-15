import React, { useRef, useState } from 'react'
import { Camera, X, Loader, ImagePlus } from 'lucide-react'
import { api } from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'

// Comprime imagen a max 800px y calidad 0.75 antes de subir
function compressImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
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
          const reader2 = new FileReader()
          reader2.onload = (e2) => {
            const b64 = e2.result.split(',')[1]
            resolve({ base64: b64, mimeType: blob.type, filename: file.name, preview: e2.result })
          }
          reader2.readAsDataURL(blob)
        }, 'image/jpeg', 0.75)
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

export default function ImageUpload({ value = '', onChange, label = 'Adjuntar imágenes' }) {
  const { token } = useAuth()
  const inputRef  = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  // value es string de URLs separadas por coma
  const urls = value ? value.split(',').map(s => s.trim()).filter(Boolean) : []

  async function handleFiles(files) {
    if (!files?.length) return
    setUploading(true); setError(null)
    try {
      const newUrls = []
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (!file.type.startsWith('image/')) continue
        const { base64, mimeType, filename } = await compressImage(file)
        const result = await api.uploadImage(token, base64, mimeType, filename)
        newUrls.push(result.thumbnail || result.url)
      }
      const all = [...urls, ...newUrls].join(',')
      onChange(all)
    } catch (e) {
      setError('Error al subir: ' + e.message)
    } finally {
      setUploading(false)
    }
  }

  function remove(idx) {
    const next = urls.filter((_, i) => i !== idx).join(',')
    onChange(next)
  }

  return (
    <div>
      {/* Thumbnails */}
      {urls.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
          {urls.map((url, i) => (
            <div key={i} style={{ position: 'relative', width: 80, height: 80 }}>
              <img src={url} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border-main)', cursor: 'pointer' }}
                onClick={() => window.open(url, '_blank')} />
              <button onClick={() => remove(i)} style={{
                position: 'absolute', top: -6, right: -6,
                width: 20, height: 20, borderRadius: '50%',
                background: 'var(--red)', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <X size={11} color="white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      <button type="button" onClick={() => inputRef.current?.click()}
        disabled={uploading}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 14px', borderRadius: 'var(--radius-md)',
          background: 'var(--bg-elevated)', border: '1px dashed var(--border-main)',
          color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13,
          fontFamily: 'var(--font-sans)', transition: 'all 0.15s', width: '100%',
          justifyContent: 'center',
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-main)'}
      >
        {uploading
          ? <><span className="spinner" style={{ width:16, height:16, borderWidth:2 }}/> Subiendo...</>
          : <><ImagePlus size={15}/> {label}</>}
      </button>

      <input ref={inputRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
        onChange={e => handleFiles(e.target.files)} />

      {error && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 6 }}>{error}</p>}
    </div>
  )
}
