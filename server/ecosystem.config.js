module.exports = {
  apps: [{
    name: 'widenaturals-erp',
    script: 'src/index.js',
    cwd: '/home/ubuntu/widenaturals-erp/server',
    env: {
      NODE_ENV: 'production',
    },
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '1G',
    autorestart: true,
  }],
};
