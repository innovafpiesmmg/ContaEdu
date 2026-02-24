# ContaEdu - Despliegue en Ubuntu Server

Guía para instalar ContaEdu en un servidor Ubuntu de forma desatendida.

**Repositorio:** https://github.com/innovafpiesmmg/ContaEdu

---

## Requisitos del Servidor

| Recurso | Mínimo | Recomendado |
|---------|--------|-------------|
| CPU     | 1 core | 2+ cores    |
| RAM     | 2 GB   | 4 GB        |
| Disco   | 10 GB SSD | 20 GB SSD |
| SO      | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |

---

## Instalación Rápida (Desatendida)

Solo necesitas ejecutar **un comando** en tu servidor Ubuntu. El script clona el repositorio de GitHub automáticamente.

### Paso 1: Descargar el instalador

```bash
# En el servidor Ubuntu
sudo apt install -y git
git clone https://github.com/innovafpiesmmg/ContaEdu.git /tmp/contaedu
```

### Paso 2: Ejecutar el instalador

```bash
cd /tmp/contaedu/deploy
sudo chmod +x install.sh
sudo ./install.sh --domain tu-dominio.com
```

El script se encarga de **todo** automáticamente:
- Instala Node.js 20, PostgreSQL, Nginx, PM2, Git y Certbot
- Crea usuario del sistema, base de datos y contraseñas seguras
- Clona el repositorio desde GitHub
- Instala dependencias, ejecuta migraciones y compila
- Configura Nginx como proxy inverso con SSL (Let's Encrypt)
- Activa el firewall (UFW)
- Configura PM2 para auto-inicio en el arranque del servidor

### Opciones del instalador

| Parámetro | Descripción | Ejemplo |
|-----------|-------------|---------|
| `--domain` | Dominio (activa SSL automáticamente) | `--domain contaedu.ejemplo.com` |
| `--db-password` | Contraseña de la BD (se genera si no se indica) | `--db-password MiClave123` |
| `--session-secret` | Secreto para sesiones (se genera si no se indica) | `--session-secret abcdef123` |
| `--port` | Puerto de la aplicación (por defecto 5000) | `--port 3000` |
| `--branch` | Rama de Git (por defecto main) | `--branch develop` |

### Ejemplo sin dominio (acceso por IP)

```bash
sudo ./install.sh
```

### Ejemplo con todas las opciones

```bash
sudo ./install.sh \
  --domain contaedu.micentro.es \
  --db-password SuperSecreta2024 \
  --session-secret MiSecretoSesion123
```

---

## Después de instalar

### Credenciales por defecto

| Rol | Usuario | Contraseña |
|-----|---------|------------|
| Admin | `admin` | `admin123` |
| Profesor | `mgarcia` | `prof123` |
| Alumno | `jperez` | `alumno123` |

> **Cambia estas contraseñas** después del primer acceso.

### Información de instalación

Todas las credenciales generadas se guardan en:
```
/var/www/contaedu/INSTALL_INFO.txt
```
(Solo accesible por root y el usuario contaedu)

---

## Gestión del servicio

```bash
# Ver estado de la aplicación
pm2 status

# Ver logs en tiempo real
pm2 logs contaedu

# Reiniciar
pm2 restart contaedu

# Detener
pm2 stop contaedu
```

---

## Actualizar la aplicación

Cuando haya cambios en el repositorio de GitHub:

```bash
# Actualización rápida (como usuario contaedu)
sudo su - contaedu
cd /var/www/contaedu
./deploy/deploy.sh
```

### Actualización con cambio de dominio

```bash
# Establecer o cambiar el dominio durante la actualización
./deploy/deploy.sh --domain contaedu.micentro.es
```

Esto actualiza el código, reconfigura Nginx con el nuevo dominio, solicita certificado SSL automáticamente y establece la variable `APP_DOMAIN` en `.env` para que los enlaces de recuperación de contraseña usen la URL correcta.

### Script avanzado de actualización (como root)

Para actualizaciones más completas con backup automático de la base de datos:

```bash
# Actualización con backup automático
sudo bash /var/www/contaedu/deploy/update.sh

# Actualizar y configurar/cambiar dominio
sudo bash /var/www/contaedu/deploy/update.sh --domain contaedu.micentro.es

# Ver estado del servidor
sudo bash /var/www/contaedu/deploy/update.sh --status

# Restaurar un backup anterior
sudo bash /var/www/contaedu/deploy/update.sh --rollback
```

| Parámetro | Descripción |
|-----------|-------------|
| `--domain <dominio>` | Establecer o cambiar el dominio (Nginx + SSL + .env) |
| `--branch <rama>` | Rama de Git a desplegar (por defecto: main) |
| `--skip-backup` | No hacer backup de la BD antes de actualizar |
| `--rollback` | Restaurar el último backup de la base de datos |
| `--status` | Mostrar estado completo del servidor |

### Actualizar desde otra rama
```bash
./deploy/deploy.sh --branch develop
```

---

## Backup de base de datos

```bash
# Crear backup
sudo -u contaedu pg_dump -h localhost contaedu_db > backup_$(date +%Y%m%d).sql

# Restaurar backup
sudo -u contaedu psql -h localhost contaedu_db < backup_20240115.sql
```

---

## Estructura en el servidor

```
/var/www/contaedu/             # Aplicación (repositorio clonado)
├── .env                       # Variables de entorno (NO en Git)
├── .git/                      # Repositorio Git
├── deploy/
│   ├── ecosystem.config.cjs   # Configuración PM2
│   ├── nginx.conf             # Plantilla Nginx
│   ├── deploy.sh              # Script de actualización
│   └── README.md              # Esta documentación
├── dist/                      # Código compilado
├── node_modules/              # Dependencias
├── INSTALL_INFO.txt           # Credenciales de instalación
└── ...

/etc/nginx/sites-available/
└── contaedu                   # Configuración Nginx activa

/var/log/contaedu/
├── error.log                  # Errores
└── out.log                    # Salida estándar
```

---

## Solución de problemas

### La aplicación no arranca

```bash
pm2 logs contaedu --lines 50    # Ver últimos errores
cat /var/www/contaedu/.env      # Verificar DATABASE_URL
sudo systemctl status postgresql # Verificar PostgreSQL
```

### Error de conexión a la base de datos

```bash
sudo -u postgres psql -c "SELECT 1"   # Verificar que PostgreSQL funciona
sudo systemctl restart postgresql      # Reiniciar si es necesario
```

### Puerto 5000 en uso

```bash
sudo lsof -i :5000     # Ver qué proceso usa el puerto
pm2 delete contaedu    # Limpiar y relanzar
cd /var/www/contaedu && pm2 start deploy/ecosystem.config.cjs
```

### Renovar certificado SSL

```bash
sudo certbot renew          # Renovar (se hace automáticamente)
sudo systemctl reload nginx
```

### Memoria insuficiente

```bash
# Crear swap de 2GB
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### Reinstalar desde cero

```bash
# Eliminar todo y volver a instalar
pm2 delete contaedu
sudo rm -rf /var/www/contaedu
sudo userdel -r contaedu
sudo -u postgres psql -c "DROP DATABASE contaedu_db;"
sudo -u postgres psql -c "DROP USER contaedu;"

# Después, ejecutar install.sh de nuevo
```
