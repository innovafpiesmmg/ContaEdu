const path = require('path');
const fs = require('fs');

const appDir = '/var/www/contaedu';
let envPort = '5000';

try {
  const envFile = fs.readFileSync(path.join(appDir, '.env'), 'utf8');
  const portMatch = envFile.match(/^PORT=(\d+)/m);
  if (portMatch) envPort = portMatch[1];
} catch (e) {}

module.exports = {
  apps: [{
    name: 'contaedu',
    script: 'dist/index.cjs',
    cwd: appDir,
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production',
      PORT: envPort
    },
    error_file: '/var/log/contaedu/error.log',
    out_file: '/var/log/contaedu/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    restart_delay: 3000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
