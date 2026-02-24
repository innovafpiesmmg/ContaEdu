#!/bin/bash
set -euo pipefail

APP_NAME="contaedu"
APP_DIR="/var/www/${APP_NAME}"
BACKUP_DIR="/var/backups/${APP_NAME}"
DB_NAME="${APP_NAME}_db"
GIT_BRANCH="main"
SKIP_BACKUP=false

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()  { echo -e "${BLUE}[INFO]${NC} $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

show_help() {
  echo ""
  echo -e "${BLUE}ContaEdu — Script de Actualización${NC}"
  echo ""
  echo "Uso: sudo bash update.sh [opciones]"
  echo ""
  echo "Opciones:"
  echo "  --branch <rama>     Rama de Git a desplegar (por defecto: main)"
  echo "  --skip-backup       No hacer backup de la base de datos antes de actualizar"
  echo "  --rollback          Restaurar el último backup de la base de datos"
  echo "  --status            Mostrar el estado actual de la aplicación"
  echo "  --help              Mostrar esta ayuda"
  echo ""
  exit 0
}

show_status() {
  echo ""
  echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║   ContaEdu — Estado del servidor             ║${NC}"
  echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
  echo ""

  echo -e "  ${BLUE}Aplicación:${NC}"
  if pm2 describe "${APP_NAME}" &>/dev/null; then
    STATUS=$(pm2 jq "${APP_NAME}" 2>/dev/null | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4 2>/dev/null || echo "desconocido")
    UPTIME=$(pm2 describe "${APP_NAME}" 2>/dev/null | grep "uptime" | awk '{print $4}' || echo "-")
    RESTARTS=$(pm2 describe "${APP_NAME}" 2>/dev/null | grep "restarts" | awk '{print $4}' || echo "-")
    pm2 status "${APP_NAME}" 2>/dev/null
  else
    echo -e "    ${RED}No se encuentra el proceso PM2${NC}"
  fi

  echo ""
  echo -e "  ${BLUE}Versión del código:${NC}"
  if [[ -d "${APP_DIR}/.git" ]]; then
    COMMIT=$(cd "${APP_DIR}" && git log -1 --format="%h - %s (%ci)" 2>/dev/null || echo "desconocido")
    BRANCH=$(cd "${APP_DIR}" && git branch --show-current 2>/dev/null || echo "desconocida")
    echo -e "    Rama:    ${BRANCH}"
    echo -e "    Commit:  ${COMMIT}"
  else
    echo -e "    ${YELLOW}No es un repositorio Git${NC}"
  fi

  echo ""
  echo -e "  ${BLUE}Base de datos:${NC}"
  if sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" 2>/dev/null | grep -q 1; then
    DB_SIZE=$(sudo -u postgres psql -tAc "SELECT pg_size_pretty(pg_database_size('${DB_NAME}'));" 2>/dev/null || echo "desconocido")
    echo -e "    Estado:  ${GREEN}Activa${NC}"
    echo -e "    Tamaño:  ${DB_SIZE}"
  else
    echo -e "    Estado:  ${RED}No encontrada${NC}"
  fi

  echo ""
  echo -e "  ${BLUE}Backups:${NC}"
  if [[ -d "${BACKUP_DIR}" ]]; then
    BACKUP_COUNT=$(ls -1 "${BACKUP_DIR}"/*.sql.gz 2>/dev/null | wc -l || echo "0")
    LAST_BACKUP=$(ls -1t "${BACKUP_DIR}"/*.sql.gz 2>/dev/null | head -1 || echo "ninguno")
    echo -e "    Total:   ${BACKUP_COUNT} backup(s)"
    if [[ "$LAST_BACKUP" != "ninguno" ]]; then
      LAST_DATE=$(stat -c %y "$LAST_BACKUP" 2>/dev/null | cut -d'.' -f1 || echo "desconocida")
      LAST_SIZE=$(du -h "$LAST_BACKUP" 2>/dev/null | awk '{print $1}' || echo "desconocido")
      echo -e "    Último:  ${LAST_DATE} (${LAST_SIZE})"
    fi
  else
    echo -e "    ${YELLOW}No hay backups${NC}"
  fi

  echo ""
  echo -e "  ${BLUE}Servicios:${NC}"
  NGINX_STATUS=$(systemctl is-active nginx 2>/dev/null || echo "inactivo")
  PG_STATUS=$(systemctl is-active postgresql 2>/dev/null || echo "inactivo")
  echo -e "    Nginx:       ${NGINX_STATUS}"
  echo -e "    PostgreSQL:  ${PG_STATUS}"

  echo ""
  echo -e "  ${BLUE}Sistema:${NC}"
  DISK_USAGE=$(df -h / | tail -1 | awk '{print $5 " usado de " $2}')
  MEM_USAGE=$(free -h | grep Mem | awk '{print $3 " / " $2}')
  echo -e "    Disco:   ${DISK_USAGE}"
  echo -e "    Memoria: ${MEM_USAGE}"
  echo ""
  exit 0
}

do_rollback() {
  echo ""
  echo -e "${YELLOW}╔══════════════════════════════════════════════╗${NC}"
  echo -e "${YELLOW}║   ContaEdu — Rollback de Base de Datos       ║${NC}"
  echo -e "${YELLOW}╚══════════════════════════════════════════════╝${NC}"
  echo ""

  if [[ ! -d "${BACKUP_DIR}" ]]; then
    log_error "No se encontró el directorio de backups (${BACKUP_DIR})"
    exit 1
  fi

  BACKUPS=($(ls -1t "${BACKUP_DIR}"/*.sql.gz 2>/dev/null))

  if [[ ${#BACKUPS[@]} -eq 0 ]]; then
    log_error "No hay backups disponibles"
    exit 1
  fi

  echo -e "  Backups disponibles:"
  echo ""
  for i in "${!BACKUPS[@]}"; do
    BFILE="${BACKUPS[$i]}"
    BDATE=$(stat -c %y "$BFILE" 2>/dev/null | cut -d'.' -f1)
    BSIZE=$(du -h "$BFILE" 2>/dev/null | awk '{print $1}')
    echo -e "    ${BLUE}[$i]${NC} $(basename "$BFILE") — ${BDATE} (${BSIZE})"
  done

  echo ""
  read -p "  Selecciona el número del backup a restaurar (0-$((${#BACKUPS[@]}-1))): " SELECTION

  if ! [[ "$SELECTION" =~ ^[0-9]+$ ]] || [[ "$SELECTION" -ge ${#BACKUPS[@]} ]]; then
    log_error "Selección no válida"
    exit 1
  fi

  SELECTED="${BACKUPS[$SELECTION]}"
  echo ""
  log_warn "Se va a restaurar: $(basename "$SELECTED")"
  log_warn "Esto REEMPLAZARÁ todos los datos actuales de la base de datos."
  echo ""
  read -p "  ¿Estás seguro? (s/N): " CONFIRM

  if [[ "$CONFIRM" != "s" && "$CONFIRM" != "S" ]]; then
    log_info "Rollback cancelado"
    exit 0
  fi

  log_info "Deteniendo aplicación..."
  pm2 stop "${APP_NAME}" 2>/dev/null || true

  log_info "Restaurando base de datos desde $(basename "$SELECTED")..."
  gunzip -c "$SELECTED" | sudo -u postgres psql "${DB_NAME}" > /dev/null 2>&1
  log_ok "Base de datos restaurada"

  log_info "Reiniciando aplicación..."
  pm2 start "${APP_NAME}" 2>/dev/null
  log_ok "Aplicación reiniciada"

  echo ""
  log_ok "Rollback completado correctamente"
  echo ""
  exit 0
}

ACTION="update"

while [[ $# -gt 0 ]]; do
  case $1 in
    --branch) GIT_BRANCH="$2"; shift 2;;
    --skip-backup) SKIP_BACKUP=true; shift;;
    --rollback) ACTION="rollback"; shift;;
    --status) ACTION="status"; shift;;
    --help|-h) show_help;;
    *) log_error "Parámetro desconocido: $1. Usa --help para ver opciones."; exit 1;;
  esac
done

if [[ $EUID -ne 0 ]]; then
  log_error "Este script debe ejecutarse como root (sudo bash update.sh)"
  exit 1
fi

if [[ ! -d "$APP_DIR" ]]; then
  log_error "Directorio ${APP_DIR} no encontrado. ¿Se ejecutó install.sh primero?"
  exit 1
fi

git config --global --add safe.directory "${APP_DIR}" 2>/dev/null

[[ "$ACTION" == "status" ]] && show_status
[[ "$ACTION" == "rollback" ]] && do_rollback

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   ContaEdu — Actualización                   ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
echo ""

CURRENT_COMMIT=$(cd "${APP_DIR}" && git log -1 --format="%h" 2>/dev/null || echo "desconocido")
log_info "Versión actual: ${CURRENT_COMMIT}"

if [[ "$SKIP_BACKUP" == false ]]; then
  log_info "=== Paso 1/5: Backup de la base de datos ==="
  mkdir -p "${BACKUP_DIR}"
  TIMESTAMP=$(date +%Y%m%d_%H%M%S)
  BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"
  sudo -u postgres pg_dump "${DB_NAME}" | gzip > "$BACKUP_FILE"
  BACKUP_SIZE=$(du -h "$BACKUP_FILE" | awk '{print $1}')
  log_ok "Backup creado: $(basename "$BACKUP_FILE") (${BACKUP_SIZE})"

  BACKUP_COUNT=$(ls -1 "${BACKUP_DIR}"/*.sql.gz 2>/dev/null | wc -l)
  if [[ "$BACKUP_COUNT" -gt 10 ]]; then
    ls -1t "${BACKUP_DIR}"/*.sql.gz | tail -n +11 | xargs rm -f
    log_info "Backups antiguos eliminados (se conservan los últimos 10)"
  fi
else
  log_warn "Paso 1/5: Backup omitido (--skip-backup)"
fi

log_info "=== Paso 2/5: Descargando cambios desde GitHub ==="
cd "${APP_DIR}"
git fetch origin
LOCAL_COMMIT=$(git rev-parse HEAD)
REMOTE_COMMIT=$(git rev-parse "origin/${GIT_BRANCH}")

if [[ "$LOCAL_COMMIT" == "$REMOTE_COMMIT" ]]; then
  log_warn "El código ya está actualizado (${LOCAL_COMMIT:0:7})"
  echo ""
  read -p "  ¿Deseas continuar con la recompilación? (s/N): " CONTINUE
  if [[ "$CONTINUE" != "s" && "$CONTINUE" != "S" ]]; then
    log_info "Actualización cancelada"
    exit 0
  fi
fi

APP_USER=$(stat -c '%U' "${APP_DIR}")
sudo -u "${APP_USER}" git reset --hard "origin/${GIT_BRANCH}"
NEW_COMMIT=$(git log -1 --format="%h - %s")
log_ok "Código actualizado: ${NEW_COMMIT}"

log_info "=== Paso 3/5: Instalando dependencias ==="
sudo -u "${APP_USER}" bash -c "cd ${APP_DIR} && npm install --production=false 2>&1" | tail -1
log_ok "Dependencias instaladas"

log_info "=== Paso 4/5: Migraciones y compilación ==="
sudo -u "${APP_USER}" bash -c "cd ${APP_DIR} && source .env 2>/dev/null; DATABASE_URL=\$(grep DATABASE_URL .env | cut -d= -f2-) npx drizzle-kit push --force 2>&1" | tail -3
log_ok "Migraciones ejecutadas"

sudo -u "${APP_USER}" bash -c "cd ${APP_DIR} && npm run build 2>&1" | tail -3
log_ok "Aplicación compilada"

log_info "=== Paso 5/5: Reiniciando servicios ==="
pm2 restart "${APP_NAME}"
sleep 2

if pm2 describe "${APP_NAME}" 2>/dev/null | grep -q "online"; then
  log_ok "Aplicación reiniciada correctamente"
else
  log_error "La aplicación no arrancó correctamente"
  log_warn "Revisando logs..."
  pm2 logs "${APP_NAME}" --lines 15 --nostream
  echo ""
  if [[ "$SKIP_BACKUP" == false ]]; then
    log_warn "Puedes restaurar el backup anterior con: sudo bash update.sh --rollback"
  fi
  exit 1
fi

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Actualización completada correctamente     ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${BLUE}Versión anterior:${NC} ${CURRENT_COMMIT}"
echo -e "  ${BLUE}Versión actual:${NC}   $(git log -1 --format='%h')"
echo ""
pm2 status "${APP_NAME}"
echo ""
