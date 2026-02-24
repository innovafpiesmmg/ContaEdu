#!/bin/bash
set -euo pipefail

APP_NAME="contaedu"
APP_DIR="/var/www/${APP_NAME}"
APP_USER="${APP_NAME}"
DB_NAME="${APP_NAME}_db"
DB_USER="${APP_NAME}"
LOG_DIR="/var/log/${APP_NAME}"
NODE_VERSION="20"
PORT="5000"
GIT_REPO="https://github.com/innovafpiesmmg/ContaEdu.git"
GIT_BRANCH="main"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()  { echo -e "${BLUE}[INFO]${NC} $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

if [[ $EUID -ne 0 ]]; then
  log_error "Este script debe ejecutarse como root (sudo ./install.sh)"
  exit 1
fi

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   ContaEdu - Instalación Desatendida Ubuntu  ║${NC}"
echo -e "${BLUE}║   Simulador Contable Educativo               ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
echo ""

DOMAIN=""
DB_PASSWORD=""
SESSION_SECRET=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --domain) DOMAIN="$2"; shift 2;;
    --db-password) DB_PASSWORD="$2"; shift 2;;
    --session-secret) SESSION_SECRET="$2"; shift 2;;
    --port) PORT="$2"; shift 2;;
    --branch) GIT_BRANCH="$2"; shift 2;;
    *) log_error "Parámetro desconocido: $1"; exit 1;;
  esac
done

if [[ -z "$DB_PASSWORD" ]]; then
  DB_PASSWORD=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24)
  log_info "Contraseña de BD generada automáticamente"
fi

if [[ -z "$SESSION_SECRET" ]]; then
  SESSION_SECRET=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)
  log_info "Secreto de sesión generado automáticamente"
fi

log_info "=== Paso 1/9: Actualizando sistema ==="
apt update -qq && apt upgrade -y -qq
log_ok "Sistema actualizado"

log_info "=== Paso 2/9: Instalando Node.js ${NODE_VERSION}.x ==="
if command -v node &> /dev/null && node --version | grep -q "v${NODE_VERSION}"; then
  log_ok "Node.js $(node --version) ya instalado"
else
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_VERSION}.x" | bash - > /dev/null 2>&1
  apt install -y -qq nodejs
  log_ok "Node.js $(node --version) instalado"
fi

log_info "=== Paso 3/9: Instalando PostgreSQL ==="
if command -v psql &> /dev/null; then
  log_ok "PostgreSQL ya instalado"
else
  apt install -y -qq postgresql postgresql-contrib
  systemctl enable postgresql
  systemctl start postgresql
  log_ok "PostgreSQL instalado y activo"
fi

log_info "=== Paso 4/9: Configurando base de datos ==="
if sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1; then
  log_warn "Usuario '${DB_USER}' ya existe, actualizando contraseña"
  sudo -u postgres psql -c "ALTER USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';" > /dev/null 2>&1
else
  sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';" > /dev/null 2>&1
  log_ok "Usuario de BD '${DB_USER}' creado"
fi

if sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1; then
  log_warn "Base de datos '${DB_NAME}' ya existe"
else
  sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};" > /dev/null 2>&1
  sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};" > /dev/null 2>&1
  log_ok "Base de datos '${DB_NAME}' creada"
fi

DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}"

log_info "=== Paso 5/9: Instalando Git, Nginx y PM2 ==="
if ! command -v git &> /dev/null; then
  apt install -y -qq git
  log_ok "Git instalado"
else
  log_ok "Git ya instalado"
fi
if ! command -v nginx &> /dev/null; then
  apt install -y -qq nginx
  systemctl enable nginx
  log_ok "Nginx instalado"
else
  log_ok "Nginx ya instalado"
fi

if ! command -v pm2 &> /dev/null; then
  npm install -g pm2 > /dev/null 2>&1
  log_ok "PM2 instalado"
else
  log_ok "PM2 ya instalado"
fi

if ! command -v certbot &> /dev/null; then
  apt install -y -qq certbot python3-certbot-nginx
  log_ok "Certbot instalado"
else
  log_ok "Certbot ya instalado"
fi

log_info "=== Paso 6/9: Configurando usuario y directorios ==="
if id "${APP_USER}" &>/dev/null; then
  log_warn "Usuario '${APP_USER}' ya existe"
else
  useradd -m -s /bin/bash "${APP_USER}"
  log_ok "Usuario '${APP_USER}' creado"
fi

mkdir -p "${APP_DIR}" "${LOG_DIR}"
chown -R "${APP_USER}:${APP_USER}" "${APP_DIR}" "${LOG_DIR}"

log_info "=== Paso 7/9: Clonando repositorio ==="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
git config --global --add safe.directory "${APP_DIR}" 2>/dev/null

if [[ -d "${APP_DIR}/.git" ]]; then
  log_info "Repositorio ya existe, actualizando..."
  sudo -u "${APP_USER}" bash -c "cd ${APP_DIR} && git fetch origin && git reset --hard origin/${GIT_BRANCH}"
else
  rm -rf "${APP_DIR:?}/"*
  sudo -u "${APP_USER}" git clone --branch "${GIT_BRANCH}" --single-branch "${GIT_REPO}" "${APP_DIR}"
fi
log_ok "Código fuente descargado desde GitHub"

if [[ -n "$DOMAIN" ]]; then
  FORCE_HTTP="false"
else
  FORCE_HTTP="true"
fi

cat > "${APP_DIR}/.env" << ENVEOF
DATABASE_URL=${DATABASE_URL}
SESSION_SECRET=${SESSION_SECRET}
NODE_ENV=production
PORT=${PORT}
FORCE_HTTP=${FORCE_HTTP}
ENVEOF

chown -R "${APP_USER}:${APP_USER}" "${APP_DIR}"

log_info "Instalando dependencias..."
sudo -u "${APP_USER}" bash -c "cd ${APP_DIR} && npm install --production=false 2>&1" | tail -1

log_info "Ejecutando migraciones de base de datos..."
sudo -u "${APP_USER}" bash -c "cd ${APP_DIR} && DATABASE_URL='${DATABASE_URL}' npx drizzle-kit push --force 2>&1" | tail -3

log_info "Compilando aplicación..."
sudo -u "${APP_USER}" bash -c "cd ${APP_DIR} && npm run build 2>&1" | tail -3
log_ok "Aplicación compilada"

log_info "=== Paso 9/9: Configurando servicios ==="

PM2_BIN=$(which pm2)
run_as_app() {
  sudo -u "${APP_USER}" HOME="/home/${APP_USER}" bash -c "$1"
}

run_as_app "cd ${APP_DIR} && ${PM2_BIN} delete ${APP_NAME} 2>/dev/null; ${PM2_BIN} start deploy/ecosystem.config.cjs && ${PM2_BIN} save"
log_ok "PM2 configurado"

PM2_STARTUP=$(run_as_app "${PM2_BIN} startup systemd -u ${APP_USER} --hp /home/${APP_USER}" 2>&1 | grep "sudo" | head -1)
if [[ -n "$PM2_STARTUP" ]]; then
  eval "$PM2_STARTUP" > /dev/null 2>&1
  log_ok "PM2 auto-inicio configurado"
fi

if [[ -n "$DOMAIN" ]]; then
  sed "s/TU_DOMINIO/${DOMAIN}/g; s/PUERTO/${PORT}/g" "${APP_DIR}/deploy/nginx.conf" > "/etc/nginx/sites-available/${APP_NAME}"
  ln -sf "/etc/nginx/sites-available/${APP_NAME}" "/etc/nginx/sites-enabled/${APP_NAME}"
  rm -f /etc/nginx/sites-enabled/default
  nginx -t > /dev/null 2>&1 && systemctl reload nginx
  log_ok "Nginx configurado para ${DOMAIN}"

  log_info "Configurando SSL con Let's Encrypt..."
  certbot --nginx -d "${DOMAIN}" --non-interactive --agree-tos --register-unsafely-without-email || log_warn "SSL no configurado (asegúrate de que el dominio apunta a este servidor)"
else
  sed "s/TU_DOMINIO/_/g; s/PUERTO/${PORT}/g" "${APP_DIR}/deploy/nginx.conf" > "/etc/nginx/sites-available/${APP_NAME}"
  ln -sf "/etc/nginx/sites-available/${APP_NAME}" "/etc/nginx/sites-enabled/${APP_NAME}"
  rm -f /etc/nginx/sites-enabled/default
  nginx -t > /dev/null 2>&1 && systemctl reload nginx
  log_ok "Nginx configurado (sin dominio, acceso por IP)"
fi

log_info "Configurando firewall..."
ufw allow OpenSSH > /dev/null 2>&1
ufw allow 'Nginx Full' > /dev/null 2>&1
ufw --force enable > /dev/null 2>&1
log_ok "Firewall configurado"

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ContaEdu instalado correctamente           ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${BLUE}Acceso:${NC}"
if [[ -n "$DOMAIN" ]]; then
  echo -e "    URL:              https://${DOMAIN}"
else
  echo -e "    URL:              http://$(hostname -I | awk '{print $1}')"
fi
echo ""
echo -e "  ${BLUE}Credenciales por defecto:${NC}"
echo -e "    Admin:            admin / admin123"
echo -e "    Profesor:         mgarcia / prof123"
echo -e "    Alumno:           jperez / alumno123"
echo ""
echo -e "  ${BLUE}Base de datos:${NC}"
echo -e "    URL:              ${DATABASE_URL}"
echo ""
echo -e "  ${BLUE}Gestión:${NC}"
echo -e "    Estado:           pm2 status"
echo -e "    Logs:             pm2 logs ${APP_NAME}"
echo -e "    Reiniciar:        pm2 restart ${APP_NAME}"
echo -e "    Actualizar:       ${APP_DIR}/deploy.sh"
echo ""
echo -e "  ${YELLOW}IMPORTANTE: Cambia las contraseñas por defecto después del primer acceso.${NC}"
echo ""

cat > "${APP_DIR}/INSTALL_INFO.txt" << INFOEOF
=== ContaEdu - Información de Instalación ===
Fecha: $(date)
Directorio: ${APP_DIR}
Base de datos: ${DB_NAME}
Usuario BD: ${DB_USER}
Contraseña BD: ${DB_PASSWORD}
Secreto sesión: ${SESSION_SECRET}
Puerto: ${PORT}
Dominio: ${DOMAIN:-"(sin dominio)"}
DATABASE_URL: ${DATABASE_URL}
INFOEOF

chmod 600 "${APP_DIR}/INSTALL_INFO.txt"
chown "${APP_USER}:${APP_USER}" "${APP_DIR}/INSTALL_INFO.txt"
log_ok "Información guardada en ${APP_DIR}/INSTALL_INFO.txt (solo lectura root/${APP_USER})"
