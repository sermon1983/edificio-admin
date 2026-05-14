# 🏢 AdminEdificio — Sistema de Gestión de Condominios

Aplicación web conectada a **Google Sheets** como base de datos.

## Módulos
- 📊 Dashboard · 💰 Gastos Comunes · 💧 Consumos (agua/luz)
- 🛡️ Rondas de Seguridad · ⚠️ Incidentes · 🔧 Órdenes de Trabajo

---

## ⚡ Configuración en 3 pasos

### Paso 1 — Crear el Google Apps Script

1. Ve a [script.google.com](https://script.google.com) → **Nuevo proyecto**
2. Borra el código que aparece y pega el contenido de `apps-script/Code.gs`
3. Guarda el proyecto (Ctrl+S) con el nombre `AdminEdificio API`

### Paso 2 — Inicializar las hojas de Google Sheets

1. En el editor de Apps Script, selecciona la función `initSheets` en el menú desplegable
2. Haz clic en **Ejecutar** ▶ → acepta los permisos cuando te lo pida
3. Se crearán automáticamente 5 hojas con datos de ejemplo en tu Google Sheets

### Paso 3 — Desplegar como Web App

1. En el editor de Apps Script: **Implementar → Nueva implementación**
2. Tipo: **Aplicación web**
3. Configuración:
   - Ejecutar como: **Yo** (tu cuenta Google)
   - Quién tiene acceso: **Cualquier persona**
4. Haz clic en **Implementar** y copia la **URL del Web App**

### Paso 4 — Conectar con el frontend

**En desarrollo local:** crea un archivo `.env.local` en la raíz:
```
VITE_SCRIPT_URL=https://script.google.com/macros/s/TU_ID/exec
```

**En Vercel:** ve a tu proyecto → Settings → Environment Variables:
```
Nombre:  VITE_SCRIPT_URL
Valor:   https://script.google.com/macros/s/TU_ID/exec
```

---

## 🚀 Instalación local

```bash
npm install
npm run dev
```

## 🌐 Despliegue en Vercel

1. Sube el proyecto a GitHub
2. Conecta en [vercel.com](https://vercel.com) → Add New Project
3. Agrega la variable de entorno `VITE_SCRIPT_URL` en Settings
4. Haz clic en **Deploy**

---

## Stack
React 18 · Vite · React Router v6 · Recharts · Lucide React · Google Apps Script
