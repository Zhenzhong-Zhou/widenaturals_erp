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
} = require('./utils/system-logger');

const { connectRedis, disconnectRedis } = require('./utils/redis-client');
const { startServer, shutdownServer } = require('./server');
const { setServer, handleExit } = require('./utils/on-exit');

// =========================================================
// Process-level shutdown guard
// =========================================================

/**
 * Ensures shutdown logic runs exactly once.
 * Prevents double execution from multiple signals.
 */
let shuttingDown = false;

// =========================================================
// Graceful shutdown handler
// =========================================================

/**
 * Handles graceful application shutdown.
 *
 * Guarantees:
 * - Runs at most once
 * - Attempts clean server and dependency shutdown
 * - Exits process with correct status code
 */
const handleShutdown = async () => {
  if (shuttingDown) return;
  shuttingDown = true;
  
  try {
    logSystemInfo('Initiating application shutdown...');
    
    // Disconnect infrastructure dependencies first
    await disconnectRedis();
    await shutdownServer();
    
    logSystemInfo('Application shutdown completed.');
    process.exit(0);
  } catch (error) {
    logSystemCrash(error, 'Error during shutdown', {
      context: 'shutdown',
    });
    process.exit(1);
  }
};

// =========================================================
// Process signal & crash handlers
// =========================================================

/**
 * Registers all process-level signal and crash handlers.
 *
 * MUST be called before any async initialization.
 */
const registerProcessHandlers = () => {
  process.on('SIGINT', async () => {
    logSystemInfo('SIGINT received');
    await handleShutdown();
  });
  
  process.on('SIGTERM', async () => {
    logSystemInfo('SIGTERM received');
    await handleShutdown();
  });
  
  process.on('unhandledRejection', (reason) => {
    logSystemError('Unhandled Rejection occurred', {
      traceId: 'unhandled-rejection',
      reasonMessage: reason?.message ?? String(reason),
      reasonStack: reason?.stack ?? null,
    });
    
    // Fail fast in development to surface bugs early
    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => process.exit(1), 50);
    }
  });
  
  process.on('uncaughtException', (err) => {
    logSystemCrash(err, 'Uncaught Exception occurred', {
      traceId: 'uncaught-exception',
      errorMessage: err?.message ?? String(err),
      errorStack: err?.stack ?? null,
    });
    
    // Exit after logging to avoid corrupted state
    setTimeout(() => process.exit(1), 50);
  });
};

// =========================================================
// Application bootstrap
// =========================================================

/**
 * Initializes and starts the application.
 *
 * Startup order:
 * 1. Register process handlers
 * 2. Initialize infrastructure (non-blocking where optional)
 * 3. Start server
 * 4. Store server reference for shutdown
 */
const initializeApp = async () => {
  try {
    // Step 1: Protect the process first
    registerProcessHandlers();
    
    // Step 2: Initialize Redis (optional dependency)
    try {
      logSystemInfo('Connecting to Redis...');
      await connectRedis();
    } catch (error) {
      logSystemError('Redis unavailable at startup (continuing)', {
        message: error.message,
      });
    }
    
    // Step 3: Start server
    logSystemInfo('Starting server...');
    const serverInstance = await startServer();
    
    // Step 4: Register server reference for shutdown
    setServer(serverInstance);
    
    logSystemInfo('Application started successfully.');
    return serverInstance;
  } catch (error) {
    logSystemCrash(error, 'Application initialization failed', {
      context: 'bootstrap',
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
