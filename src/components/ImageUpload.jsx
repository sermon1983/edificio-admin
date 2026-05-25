/**
 * ImageUpload v3 — compresión 100% local, sin API, sin Drive
 * Identificador de versión: IMG_UPLOAD_V3
 */
import React, { useRef, useState } from 'react'
import { X, Camera, AlertCircle } from 'lucide-react'

const MAX_PX  = 240
const QUALITY = 0.45
const MAX_IMGS = 3
const SEP = '|||'
const TIMEOUT_MS = 12000

export function parseImages(value) {
  if (!value || !String(value).trim()) return []
  const s = String(value).trim()
  if (s.includes(SEP)) return s.split(SEP).filter(Boolean)
  return s.split(',').map(x => x.trim()).filter(Boolean)
}

function compress(file) {
  return new Promise((resolve, reject) => {
    const tid = setTimeout(() => reject(new Error('Tiempo agotado')), TIMEOUT_MS)
    const done = (v) => { clearTimeout(tid); resolve(v) }
    const fail = (e) => { clearTimeout(tid); reject(e instanceof Error ? e : new Error(String(e))) }

    try {
      const fr = new FileReader()
      fr.onerror = () => fail(new Error('Error al leer el archivo'))
      fr.onload = (ev) => {
        try {
          const img = new Image()
          img.onerror = () => fail(new Error('Formato de imagen no soportado'))
          img.onload = () => {
            try {
              let w = img.naturalWidth || img.width
              let h = img.naturalHeight || img.height
              if (!w || !h) { fail(new Error('Imagen vacía')); return }
              if (w > MAX_PX || h > MAX_PX) {
                if (w >= h) { h = Math.round(h * MAX_PX / w); w = MAX_PX }
                else        { w = Math.round(w * MAX_PX / h); h = MAX_PX }
              }
              const c = document.createElement('canvas')
              c.width = w; c.height = h
              const ctx = c.getContext('2d')
              ctx.fillStyle = '#fff'
              ctx.fillRect(0, 0, w, h)
              ctx.drawImage(img, 0, 0, w, h)
              const uri = c.toDataURL('image/jpeg', QUALITY)
              if (!uri || uri.length < 50) { fail(new Error('No se pudo comprimir')); return }
              done(uri)
            } catch(e) { fail(e) }
          }
          img.src = ev.target.result
        } catch(e) { fail(e) }
      }
      fr.readAsDataURL(file)
    } catch(e) { fail(e) }
  })
}

function Thumb({ src, onRemove }) {
  const [zoom, setZoom] = useState(false)
  return (
    <>
      <div style={{ position:'relative', width:70, height:70 }}>
        <img src={src} alt="foto" onClick={() => setZoom(true)}
          style={{ width:70, height:70, objectFit:'cover', borderRadius:8, border:'1px solid var(--border-main)', cursor:'pointer', display:'block' }}/>
        {onRemove && (
          <button onClick={onRemove} type="button"
            style={{ position:'absolute', top:-6, right:-6, width:20, height:20, borderRadius:'50%', background:'#ef4444', border:'2px solid var(--bg-surface)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', padding:0 }}>
            <X size={11} color="white"/>
          </button>
        )}
      </div>
      {zoom && (
        <div onClick={() => setZoom(false)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', cursor:'zoom-out', padding:20 }}>
          <img src={src} style={{ maxWidth:'92vw', maxHeight:'92vh', objectFit:'contain', borderRadius:10 }}/>
        </div>
      )}
    </>
  )
}

export default function ImageUpload({ value = '', onChange, label = 'Adjuntar fotos', readOnly = false }) {
  const ref = useRef(null)
  const [busy,  setBusy]  = useState(false)
  const [step,  setStep]  = useState('')
  const [err,   setErr]   = useState(null)

  const imgs  = parseImages(value)
  const canAdd = MAX_IMGS - imgs.length

  async function pick(e) {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length) return
    if (canAdd <= 0) { setErr(`Máximo ${MAX_IMGS} fotos`); return }

    setBusy(true); setErr(null)
    const results = []
    try {
      const batch = files.slice(0, canAdd)
      for (let i = 0; i < batch.length; i++) {
        setStep(`Comprimiendo ${i + 1} de ${batch.length}...`)
        results.push(await compress(batch[i]))
      }
      onChange([...imgs, ...results].join(SEP))
    } catch (ex) {
      setErr(ex.message)
    } finally {
      setBusy(false); setStep('')
    }
  }

  if (readOnly && imgs.length === 0) return null

  return (
    <div>
      {imgs.length > 0 && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:10 }}>
          {imgs.map((s, i) => <Thumb key={i} src={s} onRemove={readOnly ? null : () => onChange(imgs.filter((_,j)=>j!==i).join(SEP))}/>)}
        </div>
      )}

      {!readOnly && canAdd > 0 && (
        <button type="button" disabled={busy}
          onClick={() => { setErr(null); ref.current?.click() }}
          style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'10px 14px', borderRadius:8, background:'var(--bg-elevated)', border:'1px dashed var(--border-main)', color: busy ? 'var(--accent-text)' : 'var(--text-muted)', cursor: busy ? 'default' : 'pointer', fontSize:13, fontFamily:'var(--font-sans)' }}>
          {busy
            ? <><span className="spinner" style={{ width:14, height:14, borderWidth:2 }}/> {step || 'Comprimiendo...'}</>
            : <><Camera size={15}/> {label} ({imgs.length}/{MAX_IMGS})</>}
        </button>
      )}

      <input ref={ref} type="file" accept="image/*" multiple style={{ display:'none' }} onChange={pick}/>

      {err && (
        <div style={{ display:'flex', gap:7, alignItems:'flex-start', padding:'8px 12px', marginTop:8, background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8 }}>
          <AlertCircle size={14} color="#ef4444" style={{ marginTop:1, flexShrink:0 }}/>
          <span style={{ fontSize:12.5, color:'#ef4444' }}>{err}</span>
        </div>
      )}
    </div>
  )
}
