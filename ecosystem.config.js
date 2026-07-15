// PM2 Ecosystem Configuration for Academisthan
// This file defines how PM2 should run the backend Node.js application

module.exports = {
  apps: [
    {
      name: 'academisthan-api',
      script: './index.ts',
      
      // Use tsx to run TypeScript directly
      interpreter: 'tsx',
      
      // Process management
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      
      // Environment variables
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      
      // Logging
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Advanced features
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000
    }
  ]
};
