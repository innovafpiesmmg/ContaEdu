# ContaEdu — Simulador Contable Educativo

Simulador contable educativo diseñado para la **Formación Profesional** en España (CFGM y CFGS). Permite a los alumnos practicar contabilidad real siguiendo el **Plan General de Contabilidad (PGC)**, con soporte para los regímenes fiscales IVA (Península/Baleares) e IGIC (Canarias).

Un proyecto del **Dpto. de Administración de Empresas del IES Manuel Martín González**.  
Software desarrollado por **Atreyu Servicios Digitales**.

---

## Características

- **Libro Diario** — Registro de asientos contables con validación automática de partida doble
- **Libro Mayor** — Visualización de movimientos por cuenta en formato T (Debe / Haber)
- **Balance de Comprobación** — Generación automática del balance de sumas y saldos
- **Plan General Contable** — Más de 60 cuentas del PGC organizadas por grupos con buscador
- **Gestión de Aula** — Profesores crean cursos, alumnos y ejercicios; auditan el trabajo en tiempo real
- **IVA / IGIC** — Soporte para ambos regímenes fiscales

## Roles de usuario

| Rol | Funciones |
|---|---|
| **Administrador** | Gestión de años escolares, creación de profesores, configuración fiscal |
| **Profesor** | Creación de cursos y alumnos, diseño de ejercicios, auditoría del trabajo |
| **Alumno** | Registro de asientos, consulta de Libro Mayor, Balance y PGC |

## Tecnologías

- **Frontend**: React + Vite + TailwindCSS + Shadcn UI
- **Backend**: Node.js + Express.js
- **Base de datos**: PostgreSQL + Drizzle ORM
- **Autenticación**: Sesiones con bcrypt

---

## Instalación en servidor Ubuntu (desde cero)

Esta guía cubre la instalación completa en un **servidor Ubuntu limpio** (20.04, 22.04 o 24.04) que no tiene nada instalado. El script de instalación se encarga de todo automáticamente.

### Requisitos mínimos del servidor

- Ubuntu 20.04 / 22.04 / 24.04 LTS
- 1 GB de RAM mínimo (2 GB recomendado)
- 10 GB de disco disponible
- Acceso root (o usuario con sudo)
- Conexión a internet

### Paso 1: Conectarse al servidor

Conéctate por SSH a tu servidor:

```bash
ssh root@IP_DEL_SERVIDOR
```

### Paso 2: Actualizar el sistema e instalar herramientas básicas

Lo primero es actualizar el sistema operativo e instalar las herramientas necesarias para descargar el código desde GitHub:

```bash
apt update && apt upgrade -y
apt install -y git curl wget
```

### Paso 3: Clonar el repositorio

Descarga el código de ContaEdu desde GitHub:

```bash
git clone https://github.com/innovafpiesmmg/ContaEdu.git /tmp/contaedu-install
```

### Paso 4: Ejecutar la instalación automática

El script `install.sh` se encarga de instalar y configurar todo automáticamente:

- Node.js 20
- PostgreSQL (crea la base de datos y el usuario)
- Nginx (proxy inverso)
- PM2 (gestor de procesos)
- Certbot (certificado SSL, si se proporciona un dominio)
- Firewall (UFW)

#### Instalación sin dominio (acceso por IP):

```bash
sudo bash /tmp/contaedu-install/deploy/install.sh
```

#### Instalación con dominio y SSL automático:

```bash
sudo bash /tmp/contaedu-install/deploy/install.sh --domain tudominio.com
```

> **Nota:** Si usas un dominio, asegúrate de que el registro DNS (tipo A) apunte a la IP del servidor antes de ejecutar el script.

#### Opciones avanzadas:

```bash
sudo bash /tmp/contaedu-install/deploy/install.sh \
  --domain tudominio.com \
  --db-password "MiPasswordSegura123" \
  --session-secret "MiSecretoSesion456" \
  --port 5000 \
  --branch main
```

| Parámetro | Descripción | Por defecto |
|---|---|---|
| `--domain` | Dominio para Nginx y SSL | Sin dominio (acceso por IP) |
| `--db-password` | Contraseña de PostgreSQL | Generada automáticamente |
| `--session-secret` | Secreto para las sesiones | Generado automáticamente |
| `--port` | Puerto de la aplicación | 5000 |
| `--branch` | Rama de Git a desplegar | main |

### Paso 5: Verificar la instalación

Al finalizar, el script muestra un resumen con toda la información. La aplicación estará disponible en:

- **Con dominio:** `https://tudominio.com`
- **Sin dominio:** `http://IP_DEL_SERVIDOR`

### Paso 6: Primer acceso

Usa las credenciales por defecto para acceder:

| Rol | Usuario | Contraseña |
|---|---|---|
| Administrador | `admin` | `admin123` |
| Profesor | `mgarcia` | `prof123` |
| Alumno | `jperez` | `alumno123` |
| Alumno | `alopez` | `alumno123` |
| Alumno | `cmartin` | `alumno123` |

> **IMPORTANTE:** Cambia las contraseñas por defecto después del primer acceso.

---

## Actualización

ContaEdu incluye un script de actualización completo (`deploy/update.sh`) que gestiona todo el proceso de forma segura: backup automático, descarga de cambios, compilación y reinicio.

### Actualización estándar

```bash
sudo bash /var/www/contaedu/deploy/update.sh
```

El script ejecuta automáticamente estos 5 pasos:

1. **Backup** de la base de datos (comprimido con gzip, se conservan los últimos 10)
2. **Descarga** los últimos cambios desde GitHub
3. **Instala** nuevas dependencias (si las hay)
4. **Ejecuta** migraciones y recompila la aplicación
5. **Reinicia** el servidor y verifica que arranca correctamente

### Opciones del script de actualización

```bash
# Actualizar desde una rama diferente
sudo bash /var/www/contaedu/deploy/update.sh --branch desarrollo

# Actualizar sin hacer backup (no recomendado)
sudo bash /var/www/contaedu/deploy/update.sh --skip-backup

# Ver el estado completo del servidor
sudo bash /var/www/contaedu/deploy/update.sh --status

# Restaurar un backup anterior (rollback)
sudo bash /var/www/contaedu/deploy/update.sh --rollback

# Ver ayuda
sudo bash /var/www/contaedu/deploy/update.sh --help
```

| Parámetro | Descripción |
|---|---|
| `--branch <rama>` | Rama de Git a desplegar (por defecto: `main`) |
| `--skip-backup` | No hacer backup de la base de datos antes de actualizar |
| `--status` | Mostrar el estado actual de la aplicación, base de datos, servicios y sistema |
| `--rollback` | Restaurar la base de datos desde un backup anterior (muestra lista interactiva) |
| `--help` | Mostrar la ayuda del script |

### Ver el estado del servidor

El comando `--status` muestra un resumen completo:

```bash
sudo bash /var/www/contaedu/deploy/update.sh --status
```

Incluye:
- Estado de la aplicación (PM2)
- Versión del código (rama y último commit)
- Estado y tamaño de la base de datos
- Backups disponibles (número y fecha del último)
- Estado de servicios (Nginx, PostgreSQL)
- Uso de disco y memoria del servidor

### Rollback (restaurar un backup)

Si una actualización causa problemas, puedes restaurar la base de datos desde un backup anterior:

```bash
sudo bash /var/www/contaedu/deploy/update.sh --rollback
```

El script mostrará la lista de backups disponibles y te permitirá elegir cuál restaurar. Los backups se guardan en `/var/backups/contaedu/` y se conservan los últimos 10 automáticamente.

---

## Gestión del servidor

### Comandos PM2 (gestor de procesos)

```bash
# Ver estado de la aplicación
pm2 status

# Ver logs en tiempo real
pm2 logs contaedu

# Reiniciar la aplicación
pm2 restart contaedu

# Detener la aplicación
pm2 stop contaedu

# Iniciar la aplicación
pm2 start contaedu
```

### Información de la instalación

Los datos de la instalación (contraseñas, URLs) se guardan en:

```bash
cat /var/www/contaedu/INSTALL_INFO.txt
```

> Este archivo solo es legible por root y el usuario `contaedu`.

### Logs

```bash
# Logs de la aplicación
pm2 logs contaedu

# Logs de Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Logs de PM2 (archivos)
cat /var/log/contaedu/out.log
cat /var/log/contaedu/error.log
```

### Base de datos

```bash
# Conectarse a la base de datos
sudo -u postgres psql contaedu_db

# Backup manual
sudo -u postgres pg_dump contaedu_db | gzip > backup_$(date +%Y%m%d).sql.gz

# Restaurar backup manual
gunzip -c backup_20250224.sql.gz | sudo -u postgres psql contaedu_db
```

> **Nota:** El script de actualización crea backups automáticos antes de cada actualización en `/var/backups/contaedu/`.

---

## Estructura del proyecto

```
ContaEdu/
├── client/                  # Frontend React
│   └── src/
│       ├── pages/           # Páginas (landing, login, dashboards)
│       ├── components/      # Componentes UI reutilizables
│       └── lib/             # Utilidades y contexto de auth
├── server/                  # Backend Express
│   ├── routes.ts            # Endpoints API
│   ├── storage.ts           # Operaciones de base de datos
│   ├── seed.ts              # Datos iniciales
│   └── db.ts                # Conexión a PostgreSQL
├── shared/
│   └── schema.ts            # Modelos de datos (Drizzle ORM)
├── deploy/                  # Scripts de despliegue
│   ├── install.sh           # Instalación completa desde cero
│   ├── update.sh            # Actualización con backup y rollback
│   ├── deploy.sh            # Actualización rápida (sin backup)
│   ├── ecosystem.config.cjs # Configuración PM2
│   ├── nginx.conf           # Plantilla Nginx
│   └── env.example          # Plantilla de variables de entorno
└── README.md
```

---

## Desarrollo local

```bash
# Clonar el repositorio
git clone https://github.com/innovafpiesmmg/ContaEdu.git
cd ContaEdu

# Instalar dependencias
npm install

# Configurar variables de entorno
cp deploy/env.example .env
# Editar .env con tus datos de PostgreSQL local

# Sincronizar base de datos
npm run db:push

# Iniciar en modo desarrollo
npm run dev
```

La aplicación se iniciará en `http://localhost:5000`.

---

## Licencia

Proyecto educativo del IES Manuel Martín González.
