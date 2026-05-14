# 🏢 AdminEdificio — Sistema de Gestión de Condominios

Aplicación web completa para la administración de edificios y condominios.

## Módulos

- 📊 **Dashboard** — Resumen general con gráficos y estadísticas
- 💰 **Gastos Comunes** — Registro y control de egresos
- 💧 **Consumos** — Lecturas de agua y luz por unidad
- 🛡️ **Rondas de Seguridad** — Control de guardias y novedades
- ⚠️ **Incidentes** — Reportes y seguimiento de eventos
- 🔧 **Órdenes de Trabajo** — Vista Kanban y lista de mantenciones

## Stack Tecnológico

- **React 18** + **Vite**
- **React Router v6**
- **Recharts** (gráficos)
- **Lucide React** (íconos)
- **localStorage** (persistencia de datos)

## Instalación Local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build
```

## Despliegue en Vercel (vía GitHub)

### Opción 1: Interfaz web de Vercel (Recomendado)

1. **Sube el proyecto a GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: AdminEdificio"
   git remote add origin https://github.com/TU_USUARIO/edificio-admin.git
   git push -u origin main
   ```

2. **Conecta con Vercel:**
   - Ve a [vercel.com](https://vercel.com) e inicia sesión con GitHub
   - Haz clic en **"Add New Project"**
   - Selecciona el repositorio `edificio-admin`
   - Vercel detectará automáticamente que es un proyecto Vite
   - Deja la configuración por defecto y haz clic en **"Deploy"**
   - ¡Listo! Tu app estará en `https://edificio-admin.vercel.app`

### Opción 2: Vercel CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Desplegar
vercel --prod
```

## Configuración del Proyecto (Vercel lo detecta automáticamente)

| Campo | Valor |
|-------|-------|
| Framework | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

## Personalización

- **Nombre del edificio:** Edita `brand-sub` en `src/components/Sidebar.jsx`
- **Unidades/Departamentos:** Modifica el array `UNIDADES` en `src/pages/Consumos.jsx`
- **Guardias:** Modifica `GUARDIAS` en `src/pages/RondasSeguridad.jsx`
- **Datos iniciales:** Edita `INITIAL_DATA` en `src/hooks/useStore.js`

## Notas

- Los datos se guardan en **localStorage** del navegador (no requiere backend)
- Para producción con base de datos, conecta una API (Supabase, PlanetScale, etc.)
