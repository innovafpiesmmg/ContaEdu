#!/bin/bash
set -euo pipefail

APP_NAME="contaedu"
APP_DIR="/var/www/${APP_NAME}"
GIT_BRANCH="main"

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()  { echo -e "${BLUE}[INFO]${NC} $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

while [[ $# -gt 0 ]]; do
  case $1 in
    --branch) GIT_BRANCH="$2"; shift 2;;
    *) log_error "Parámetro desconocido: $1"; exit 1;;
  esac
done

if [[ ! -d "$APP_DIR" ]]; then
  log_error "Directorio ${APP_DIR} no encontrado. ¿Se ejecutó install.sh primero?"
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
npx drizzle-kit push --force 2>&1 | tail -3

log_info "Compilando aplicación..."
npm run build 2>&1 | tail -3

log_info "Reiniciando servidor..."
pm2 restart "${APP_NAME}"

echo ""
log_ok "Actualización completada"
pm2 status
echo ""
