# ── Etapa 1: Build ──────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm ci

# Copiar código y construir
COPY . .

# La variable de entorno se pasa en build time
ARG VITE_SCRIPT_URL
ENV VITE_SCRIPT_URL=$VITE_SCRIPT_URL

RUN npm run build

# ── Etapa 2: Servir con Nginx ────────────────────────────────
FROM nginx:alpine

# Copiar archivos construidos
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuración de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
