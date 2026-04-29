/**
 * @file index.js
 * @description Application entry point. Runs once at process startup.
 *
 * Responsibilities:
 *   - Load and validate environment variables before any other module runs
 *   - Register process-level signal and crash handlers
 *   - Initialize optional infrastructure (Redis)
 *   - Start the HTTP server
 *   - Delegate all shutdown and cleanup to the lifecycle layer
 *
 * What does NOT belong here:
 *   - Request-level error handling  → app.js / middleware
 *   - Cleanup logic                 → system/lifecycle/on-exit
 *   - Server startup steps          → server.js
 *
 * Process lifecycle ownership:
 *   This file is the ONLY place that binds process signals (SIGINT, SIGTERM)
 *   and crash events (uncaughtException, unhandledRejection). All of them
 *   route through `handleExit` so shutdown always follows the same path.
 */

// =============================================================================
// ENVIRONMENT BOOTSTRAP — must run before any other require()
// Imports below this line may read process.env at module load time.
// =============================================================================
require('./config/env-manager').loadAndValidateEnv();

// =============================================================================
// Imports (safe after env is validated)
// =============================================================================
const {
  logSystemInfo,
  logSystemError,
  logSystemCrash,
} = require('./utils/logging/system-logger');
const { connectRedis, disconnectRedis } = require('./utils/redis-client');
const { startServer } = require('./server');
const {
  handleExit,
  registerShutdownHook,
} = require('./system/lifecycle/on-exit');

// =============================================================================
// Process signal and crash handlers
// =============================================================================

/**
 * Binds all process-level signal and crash handlers.
 *
 * Called once, before any async work, so that crashes during startup are
 * also caught. All handlers delegate to `handleExit` — no cleanup logic
 * lives here directly.
 *
 * Handler inventory:
 *   - SIGINT            → graceful shutdown (e.g. Ctrl+C in development)
 *   - SIGTERM           → graceful shutdown (e.g. container orchestrator)
 *   - unhandledRejection → log + forced exit (app state is undefined)
 *   - uncaughtException  → log + forced exit (cannot recover safely)
 *
 * Design rules:
 *   - No process.exit() calls — always go through handleExit
 *   - No inline cleanup — register hooks via registerShutdownHook instead
 */
const registerProcessHandlers = () => {
  // Shorthand so every handler reads identically.
  const exit = (code) => void handleExit(code);

  // ---------------------------------------------------------------------------
  // Infrastructure cleanup hooks
  // Registered here because Redis is initialized here, not in server.js.
  // Each service that starts here owns its own shutdown hook.
  // ---------------------------------------------------------------------------
  registerShutdownHook(async () => {
    await disconnectRedis();
  });

  // ---------------------------------------------------------------------------
  // OS signals → unified shutdown pipeline
  // ---------------------------------------------------------------------------
  process.on('SIGINT', () => {
    logSystemInfo('SIGINT received', { context: 'lifecycle/signal' });
    exit(0);
  });

  process.on('SIGTERM', () => {
    logSystemInfo('SIGTERM received', { context: 'lifecycle/signal' });
    exit(0);
  });

  // ---------------------------------------------------------------------------
  // Unhandled promise rejection
  // Treated as fatal: a missed rejection means an operation completed in an
  // unknown state and continuing is not safe.
  // ---------------------------------------------------------------------------
  process.on('unhandledRejection', (reason) => {
    logSystemError('Unhandled promise rejection', {
      context: 'lifecycle/crash',
      traceId: 'unhandled-rejection',
      reasonMessage: reason?.message ?? String(reason),
      reasonStack: reason?.stack ?? null,
    });

    exit(1);
  });

  // ---------------------------------------------------------------------------
  // Uncaught exception
  // The process is in an undefined state — log and exit immediately.
  // ---------------------------------------------------------------------------
  process.on('uncaughtException', (err) => {
    logSystemCrash(err, 'Uncaught exception', {
      context: 'lifecycle/crash',
      traceId: 'uncaught-exception',
    });

    exit(1);
  });
};

// =============================================================================
// Application bootstrap
// =============================================================================

/**
 * Initializes infrastructure and starts the HTTP server.
 *
 * Startup order:
 *   1. Register process handlers — must be first so crashes during boot
 *      are caught and logged rather than producing unformatted Node output.
 *   2. Connect to Redis — optional; a failure is logged but does not abort
 *      startup because the app degrades gracefully without a cache layer.
 *   3. Start the HTTP server — delegates the full startup pipeline to
 *      server.js, which runs each step via runStartupStep.
 *
 * Error handling:
 *   Any unrecovered error thrown during startup is treated as fatal. It is
 *   logged as a crash and the process exits via handleExit so that all
 *   registered shutdown hooks still run (e.g. flushing log buffers).
 *
 * @async
 * @returns {Promise<http.Server>} The running HTTP server instance.
 */
const initializeApp = async () => {
  // ---------------------------------------------------------------------------
  // Step 1 — Protect process first
  // Handlers must be bound before any await so that a rejection thrown
  // during Redis connect or server startup is caught and routed correctly.
  // ---------------------------------------------------------------------------
  registerProcessHandlers();

  // ---------------------------------------------------------------------------
  // Step 2 — Redis (optional)
  // connectRedis handles its own error logging internally, so a failure here
  // is caught, noted, and swallowed — the app runs without Redis at reduced capacity.
  // ---------------------------------------------------------------------------
  try {
    await connectRedis();
  } catch {
    // Already logged inside connectRedis — nothing more to do here.
    // Startup continues without Redis.
  }

  // ---------------------------------------------------------------------------
  // Step 3 — HTTP server
  // server.js owns its own startup steps (DB, caches, admin, monitoring,
  // backup). setServer() is called inside server.js — not repeated here.
  // ---------------------------------------------------------------------------
  const serverInstance = await startServer();

  logSystemInfo('Application started successfully', { context: 'startup/app' });

  return serverInstance;
};

// =============================================================================
// Entry point execution guard
// Only runs when this file is executed directly (node index.js).
// Skipped when required by tests or other modules.
// =============================================================================
if (require.main === module) {
  initializeApp().catch(async (error) => {
    // Last-resort handler: catches any error that escaped initializeApp,
    // including failures in the shutdown hooks triggered by a crash inside it.
    logSystemCrash(error, 'Application failed to start', {
      context: 'entry',
    });

    await handleExit(1);
  });
}

module.exports = { initializeApp };
