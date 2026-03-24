/**
 * @file on-exit.js
 * @description Centralized process shutdown orchestrator.
 *
 * Responsibilities:
 * - Coordinate graceful shutdown via registered hooks
 * - Prevent duplicate execution
 * - Enforce global timeout for cleanup
 * - Provide structured logging for observability
 *
 * Design Principles:
 * - Fully hook-based (no hardcoded cleanup)
 * - Idempotent execution
 * - Sequential execution for safety
 * - Fail-safe (guaranteed process exit)
 */

const {
  logSystemInfo,
  logSystemException,
  logSystemFatal,
  logSystemWarn,
} = require('../../utils/logging/system-logger');
const { closePool } = require('../../database/db');

let server = null;
let cleanupCalled = false;
let exitCalled = false;

const shutdownHooks = [];
const CONTEXT = 'system/on-exit';

/**
 * Sets the server instance to be closed during shutdown.
 *
 * @param {object} serverInstance - HTTP server instance
 */
const setServer = (serverInstance) => {
  server = serverInstance;
};

/**
 * Safely closes the HTTP server with timeout protection.
 */
const closeServerSafely = async () => {
  if (!server) {
    logSystemInfo('No active server instance to close.', { context: CONTEXT });
    return;
  }
  
  logSystemInfo('Closing server connections...', { context: CONTEXT });
  
  await Promise.race([
    new Promise((resolve) => {
      server.close(() => {
        logSystemInfo('Server connections closed.', { context: CONTEXT });
        resolve();
      });
    }),
    new Promise((resolve) =>
      setTimeout(() => {
        logSystemWarn('Server close timed out. Continuing shutdown.', {
          context: CONTEXT,
          timeoutMs: 5000,
        });
        resolve();
      }, 5000)
    ),
  ]);
};

/**
 * Registers a shutdown hook.
 *
 * Hooks:
 * - Execute in registration order
 * - Run sequentially (awaited)
 * - Must be idempotent
 *
 * @param {Function} fn - Cleanup function (sync or async)
 */
const registerShutdownHook = (fn) => {
  if (cleanupCalled) {
    throw new Error(
      'registerShutdownHook: cannot register after shutdown has started'
    );
  }
  
  if (typeof fn !== 'function') {
    throw new Error('registerShutdownHook: fn must be a function');
  }
  
  shutdownHooks.push(fn);
};

/**
 * Executes all registered shutdown hooks safely.
 */
const cleanupLogic = async () => {
  if (cleanupCalled) {
    logSystemWarn('Cleanup already in progress. Skipping.', {
      context: CONTEXT,
    });
    return;
  }
  
  cleanupCalled = true;
  
  logSystemInfo('Starting cleanup logic...', {
    context: CONTEXT,
    hooksCount: shutdownHooks.length,
  });
  
  //--------------------------------------------------
  // 1. Stop accepting new connections FIRST
  //--------------------------------------------------
  await closeServerSafely();
  
  //--------------------------------------------------
  // 2. Run shutdown hooks (monitoring, redis, etc.)
  //--------------------------------------------------
  for (const hook of shutdownHooks) {
    try {
      await hook();
    } catch (error) {
      logSystemException(error, 'Shutdown hook failed', {
        context: CONTEXT,
      });
    }
  }
  
  //--------------------------------------------------
  // 3. Close DB LAST (if not already inside hook)
  //--------------------------------------------------
  await closePool();
};

/**
 * Handles process termination with controlled cleanup.
 *
 * @param {number} [code=0]
 */
const handleExit = async (code = 0) => {
  if (exitCalled) {
    logSystemWarn('handleExit already triggered.', {
      context: CONTEXT,
    });
    return;
  }
  
  exitCalled = true;
  
  logSystemInfo('Initiating exit process...', {
    context: CONTEXT,
    code,
  });
  
  const forceExitTimer = setTimeout(() => {
    logSystemFatal('Cleanup timeout exceeded. Forcing exit.', {
      context: CONTEXT,
      timeoutMs: 10000,
    });
    process.exit(code);
  }, 10000);
  
  try {
    await cleanupLogic();
    clearTimeout(forceExitTimer);
    
    logSystemInfo('Cleanup completed.', { context: CONTEXT });
  } catch (error) {
    logSystemException(error, 'Unexpected exit error', {
      context: CONTEXT,
    });
  } finally {
    logSystemInfo(`Exiting with code: ${code}`, { context: CONTEXT });
    process.exit(code);
  }
};

module.exports = {
  setServer,
  closeServerSafely,
  registerShutdownHook,
  handleExit,
};
