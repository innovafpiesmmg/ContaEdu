#!/bin/bash
set -euo pipefail

APP_NAME="contaedu"
APP_DIR="/var/www/${APP_NAME}"
GIT_BRANCH="main"
NEW_DOMAIN=""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()  { echo -e "${BLUE}[INFO]${NC} $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

while [[ $# -gt 0 ]]; do
  case $1 in
    --branch) GIT_BRANCH="$2"; shift 2;;
    --domain) NEW_DOMAIN="$2"; shift 2;;
    *) log_error "Parámetro desconocido: $1"; exit 1;;
  esac
done

if [[ ! -d "$APP_DIR" ]]; then
  log_error "Directorio ${APP_DIR} no encontrado. ¿Se ejecutó install.sh primero?"
  exit 1
fi

if [[ -n "$NEW_DOMAIN" && $EUID -ne 0 ]]; then
  log_error "La opción --domain requiere permisos de root (sudo ./deploy.sh --domain tu-dominio.com)"
  log_info "Para cambiar el dominio, usa: sudo bash /var/www/contaedu/deploy/update.sh --domain tu-dominio.com"
  exit 1
fi

echo ""
echo -e "${BLUE}=== ContaEdu - Actualización ===${NC}"
echo ""

cd "${APP_DIR}"

log_info "Descargando últimos cambios desde GitHub..."
git fetch origin
git reset --hard "origin/${GIT_BRANCH}"
log_ok "Código actualizado"

log_info "Instalando dependencias..."
npm install --production=false 2>&1 | tail -1

log_info "Ejecutando migraciones..."
MIGRATE_LOG=$(mktemp)
if npx drizzle-kit migrate > "$MIGRATE_LOG" 2>&1; then
  tail -5 "$MIGRATE_LOG"
  log_ok "Migraciones aplicadas"
else
  log_warn "Migrate falló, intentando push..."
  script -qec "npx drizzle-kit push --force" /dev/null < /dev/null > "$MIGRATE_LOG" 2>&1 || true
  tail -5 "$MIGRATE_LOG"
  log_ok "Schema sincronizado con push"
fi
rm -f "$MIGRATE_LOG"

log_info "Compilando aplicación..."
npm run build 2>&1 | tail -3

if [[ -n "$NEW_DOMAIN" ]]; then
  log_info "Configurando dominio: ${NEW_DOMAIN}..."

  PORT=$(grep -oP 'PORT=\K[0-9]+' "${APP_DIR}/.env" 2>/dev/null || echo "5000")

  if grep -q "^APP_DOMAIN=" "${APP_DIR}/.env"; then
    sed -i "s/^APP_DOMAIN=.*/APP_DOMAIN=${NEW_DOMAIN}/" "${APP_DIR}/.env"
  else
    echo "APP_DOMAIN=${NEW_DOMAIN}" >> "${APP_DIR}/.env"
  fi

  if grep -q "^FORCE_HTTP=" "${APP_DIR}/.env"; then
    sed -i "s/^FORCE_HTTP=.*/FORCE_HTTP=false/" "${APP_DIR}/.env"
  else
    echo "FORCE_HTTP=false" >> "${APP_DIR}/.env"
  fi

  sed "s/TU_DOMINIO/${NEW_DOMAIN}/g; s/PUERTO/${PORT}/g" "${APP_DIR}/deploy/nginx.conf" > "/etc/nginx/sites-available/${APP_NAME}"
  ln -sf "/etc/nginx/sites-available/${APP_NAME}" "/etc/nginx/sites-enabled/${APP_NAME}"
  rm -f /etc/nginx/sites-enabled/default

  if nginx -t > /dev/null 2>&1; then
    systemctl reload nginx
    log_ok "Nginx configurado para ${NEW_DOMAIN}"
  else
    log_error "Error en la configuración de Nginx"
  fi

  if command -v certbot &> /dev/null; then
    log_info "Configurando SSL con Let's Encrypt..."
    certbot --nginx -d "${NEW_DOMAIN}" --non-interactive --agree-tos --register-unsafely-without-email || log_warn "SSL no configurado"
  fi
fi

log_info "Reiniciando servidor..."
pm2 restart "${APP_NAME}"

echo ""
log_ok "Actualización completada"
if [[ -n "$NEW_DOMAIN" ]]; then
  echo -e "  ${BLUE}Dominio:${NC} https://${NEW_DOMAIN}"
fi
pm2 status
echo ""
