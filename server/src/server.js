/**
 * @file server.js
 * @description Application bootstrap (startup only).
 *
 * Responsibilities:
 * - Initialize system dependencies
 * - Start HTTP server
 * - Start runtime services (monitoring, health checks)
 *
 * Notes:
 * - NO shutdown logic (handled by lifecycle/on-exit)
 */

const http = require('http');
const {
  logSystemInfo,
  logSystemException,
  logMissingEnvVar,
} = require('./utils/logging/system-logger');
const AppError = require('./utils/AppError');
const { runStartupStep } = require('./system/lifecycle/run-startup-step');
const {
  setServer,
  registerShutdownHook,
} = require('./system/lifecycle/on-exit');
const app = require('./app');
const { createDatabaseAndInitialize } = require('./system/startup/initialize-database');
const { testConnection, monitorPool } = require('./database/db');
const { initAllStatusCaches } = require('./config/status-cache');
const { initSkuOperationalStatusCache } = require('./config/sku-operational-status-cache');
const { initBatchActivityTypeCache } = require('./cache/batch-activity-type-cache');
const { initializeRootAdmin } = require('./config/initialize-root');
const {
  startPoolMonitoring,
  stopPoolMonitoring,
} = require('./system/monitoring/pool-monitor');
const {
  startHealthCheck,
  stopHealthCheck,
} = require('./system/health/health-check');
const { ONE_MINUTE } = require('./utils/constants/general/time');
const { runBackup } = require('./system/backup/jobs/run-backup');

const CONTEXT = 'startup/server';

let server;

/**
 * Starts the application server with full initialization pipeline.
 */
const startServer = async () => {
  const PORT = process.env.PORT;
  
  //--------------------------------------------------
  // Validate env
  //--------------------------------------------------
  if (!PORT) {
    const error = new AppError('PORT environment variable is missing');
    logMissingEnvVar('PORT', error);
    throw error;
  }
  
  try {
    //--------------------------------------------------
    // Database initialization
    //--------------------------------------------------
    await runStartupStep(
      'Initialize database',
      createDatabaseAndInitialize,
      { context: CONTEXT }
    );
    
    await runStartupStep(
      'Test database connection',
      testConnection,
      { context: CONTEXT }
    );
    
    //--------------------------------------------------
    // Cache initialization
    //--------------------------------------------------
    await runStartupStep(
      'Initialize status caches',
      async () => {
        await initAllStatusCaches();
        await initSkuOperationalStatusCache();
        await initBatchActivityTypeCache();
      },
      { context: CONTEXT }
    );
    
    //--------------------------------------------------
    // Root admin
    //--------------------------------------------------
    await runStartupStep(
      'Initialize root admin',
      initializeRootAdmin,
      { context: CONTEXT }
    );
    
    //--------------------------------------------------
    // Create server
    //--------------------------------------------------
    await runStartupStep(
      'Create HTTP server',
      async () => {
        server = http.createServer(app);
        setServer(server); // register for lifecycle shutdown
      },
      { context: CONTEXT }
    );
    
    //--------------------------------------------------
    // Start runtime services
    //--------------------------------------------------
    await runStartupStep(
      'Start health check',
      () => {
        const interval =
          parseInt(process.env.HEALTH_CHECK_INTERVAL, 10) || ONE_MINUTE;
        
        startHealthCheck(interval);
        
        // register shutdown
        registerShutdownHook(() => stopHealthCheck());
      },
      { context: CONTEXT }
    );
    
    await runStartupStep(
      'Start pool monitoring',
      () => {
        startPoolMonitoring(monitorPool);
        
        // register shutdown
        registerShutdownHook(() => stopPoolMonitoring());
      },
      { context: CONTEXT }
    );
    
    //--------------------------------------------------
    // Start server listening
    //--------------------------------------------------
    await runStartupStep(
      'Start HTTP server',
      () =>
        new Promise((resolve) => {
          server.listen(PORT, () => {
            logSystemInfo(`Server running at http://localhost:${PORT}`, {
              context: CONTEXT,
              port: PORT,
            });
            resolve();
          });
        }),
      { context: CONTEXT }
    );
    
    //--------------------------------------------------
    // Optional: backup hook
    //--------------------------------------------------
    registerShutdownHook(async () => {
      try {
        await runBackup();
      } catch (error) {
        logSystemException(error, 'Final backup failed', {
          context: CONTEXT,
        });
      }
    });
    
    return server;
    
  } catch (error) {
    logSystemException(error, 'Failed to start server', {
      context: CONTEXT,
    });
    throw error;
  }
};

module.exports = {
  startServer
};
