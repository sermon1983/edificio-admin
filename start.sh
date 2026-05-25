#!/bin/bash
# ============================================================
#  AdminEdificio — Script de inicio rápido
# ============================================================

set -e

echo ""
echo "🏢  AdminEdificio — Configuración local"
echo "========================================"
echo ""

# Verificar si existe .env
if [ ! -f .env ]; then
  echo "⚠️  No se encontró el archivo .env"
  echo ""
  read -p "📋 Pega la URL de tu Google Apps Script Web App: " SCRIPT_URL
  echo "VITE_SCRIPT_URL=$SCRIPT_URL" > .env
  echo ""
  echo "✅ Archivo .env creado"
else
  echo "✅ Archivo .env encontrado"
fi

echo ""

# Verificar modo
echo "¿Cómo quieres ejecutar la aplicación?"
echo ""
echo "  1) Docker (recomendado para red local)"
echo "  2) Node.js / Vite (solo desarrollo)"
echo ""
read -p "Elige [1/2]: " MODE

if [ "$MODE" = "1" ]; then
  # Verificar Docker
  if ! command -v docker &> /dev/null; then
    echo ""
    echo "❌ Docker no está instalado."
    echo "   Descárgalo en: https://docs.docker.com/get-docker/"
    exit 1
  fi

  echo ""
  echo "🐳 Construyendo imagen Docker..."
  docker compose up -d --build

  # Obtener IP local
  if command -v ip &> /dev/null; then
    IP=$(ip route get 1 | awk '{print $7; exit}')
  else
    IP=$(ipconfig getifaddr en0 2>/dev/null || echo "tu-ip-local")
  fi

  echo ""
  echo "✅ ¡Listo! La aplicación está corriendo."
  echo ""
  echo "   🌐 Local:   http://localhost:8080"
  echo "   📱 Red:     http://$IP:8080"
  echo ""
  echo "   Para detener: docker compose down"
  echo "   Para ver logs: docker compose logs -f"

elif [ "$MODE" = "2" ]; then
  # Verificar Node
  if ! command -v node &> /dev/null; then
    echo ""
    echo "❌ Node.js no está instalado."
    echo "   Descárgalo en: https://nodejs.org"
    exit 1
  fi

  # Copiar .env a .env.local para Vite
  cp .env .env.local

  echo ""
  echo "📦 Instalando dependencias..."
  npm install

  echo ""
  echo "🚀 Iniciando servidor de desarrollo..."
  echo "   Presiona Ctrl+C para detener"
  echo ""
  npm run dev
fi
