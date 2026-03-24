/**
 * @file index.js
 * @description Application entry point.
 *
 * Responsibilities:
 * - Load and validate environment variables (ONCE)
 * - Register process-level signal and crash handlers
 * - Initialize infrastructure dependencies
 * - Start the HTTP server
 * - Coordinate graceful shutdown and fatal exits
 *
 * IMPORTANT:
 * - This file owns process lifecycle (signals, exit, crash handling)
 * - Request-level errors MUST NOT reach this layer
 */

// =========================================================
// ENVIRONMENT BOOTSTRAP (MUST RUN FIRST)
// =========================================================
require('./config/env-manager').loadAndValidateEnv();

// =========================================================
// Imports (safe after env is loaded)
// =========================================================
const {
  logSystemInfo,
  logSystemError,
  logSystemCrash,
} = require('./utils/logging/system-logger');
const { connectRedis, disconnectRedis } = require('./utils/redis-client');
const { startServer } = require('./server');
const { setServer, handleExit, registerShutdownHook } = require('./system/lifecycle/on-exit');
const { stopPoolMonitoring } = require('./system/monitoring/pool-monitor');

// =========================================================
// Process signal & crash handlers
// =========================================================

/**
 * Registers all process-level signal and crash handlers.
 *
 * Responsibilities:
 * - Route ALL shutdown events through `handleExit`
 * - Register infrastructure cleanup hooks
 * - Ensure consistent logging for fatal conditions
 *
 * Design:
 * - No direct cleanup logic here
 * - No process.exit here
 * - Delegates everything to lifecycle layer
 */
const registerProcessHandlers = () => {
  const exit = (code) => void handleExit(code);
  
  //--------------------------------------------------
  // Register ALL shutdown hooks (single source of cleanup)
  //--------------------------------------------------
  registerShutdownHook(async () => {
    await disconnectRedis();
  });
  
  registerShutdownHook(() => stopPoolMonitoring());
  
  //--------------------------------------------------
  // OS signals → unified shutdown pipeline
  //--------------------------------------------------
  process.on('SIGINT', () => {
    logSystemInfo('SIGINT received', { context: 'lifecycle/signal' });
    exit(0);
  });
  
  process.on('SIGTERM', () => {
    logSystemInfo('SIGTERM received', { context: 'lifecycle/signal' });
    exit(0);
  });
  
  //--------------------------------------------------
  // Unhandled Promise Rejection
  //--------------------------------------------------
  process.on('unhandledRejection', (reason) => {
    logSystemError('Unhandled Rejection occurred', {
      context: 'lifecycle/crash',
      traceId: 'unhandled-rejection',
      reasonMessage: reason?.message ?? String(reason),
      reasonStack: reason?.stack ?? null,
    });
    
    // Always terminate — app state is undefined
    exit(1);
  });
  
  //--------------------------------------------------
  // Uncaught Exception
  //--------------------------------------------------
  process.on('uncaughtException', (err) => {
    logSystemCrash(err, 'Uncaught Exception occurred', {
      context: 'lifecycle/crash',
      traceId: 'uncaught-exception',
    });
    
    // Always terminate — cannot recover safely
    exit(1);
  });
};

// =========================================================
// Application bootstrap
// =========================================================

/**
 * Initializes and starts the application.
 *
 * Startup order:
 * 1. Register process handlers (MUST be first)
 * 2. Initialize optional infrastructure (Redis)
 * 3. Start HTTP server
 * 4. Register server instance for graceful shutdown
 *
 * Guarantees:
 * - Fails fast on critical startup errors
 * - Delegates shutdown responsibility to lifecycle system
 *
 * @returns {Promise<object>} HTTP server instance
 */
const initializeApp = async () => {
  try {
    //--------------------------------------------------
    // Step 1: Protect process FIRST (critical)
    //--------------------------------------------------
    registerProcessHandlers();
    
    //--------------------------------------------------
    // Step 2: Initialize Redis (optional dependency)
    //--------------------------------------------------
    try {
      logSystemInfo('Connecting to Redis...', {
        context: 'startup/redis',
      });
      
      await connectRedis();
    } catch (error) {
      logSystemError('Redis unavailable at startup (continuing)', {
        context: 'startup/redis',
        message: error.message,
      });
    }
    
    //--------------------------------------------------
    // Step 3: Start HTTP server
    //--------------------------------------------------
    logSystemInfo('Starting server...', {
      context: 'startup/server',
    });
    
    const serverInstance = await startServer();
    
    //--------------------------------------------------
    // Step 4: Register server for graceful shutdown
    //--------------------------------------------------
    setServer(serverInstance);
    
    logSystemInfo('Application started successfully.', {
      context: 'startup/app',
    });
    
    return serverInstance;
  } catch (error) {
    //--------------------------------------------------
    // Fatal startup failure → controlled exit
    //--------------------------------------------------
    logSystemCrash(error, 'Application initialization failed', {
      context: 'startup/bootstrap',
      severity: 'critical',
    });
    
    await handleExit(1);
  }
};

// =========================================================
// Entrypoint execution guard
// =========================================================

if (require.main === module) {
  initializeApp().catch(async (error) => {
    logSystemCrash(error, 'Startup failed', {
      context: 'entry',
    });
    await handleExit(1);
  });
}

module.exports = {
  initializeApp,
};
