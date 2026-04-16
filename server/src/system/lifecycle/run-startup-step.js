/**
 * @file run-startup-step.js
 * @description Executes a startup step with structured logging, timing, and error handling.
 *
 * Responsibilities:
 * - Provide a standardized execution wrapper for startup steps
 * - Emit consistent lifecycle logs (started / completed / failed)
 * - Measure execution duration with high-resolution timing
 * - Propagate errors without swallowing them
 *
 * Design Principles:
 * - Zero business logic (pure orchestration)
 * - Fail-fast on invalid input
 * - Minimal overhead (no unnecessary async wrapping)
 * - Consistent log schema for observability
 */

const {
  logSystemInfo,
  logSystemException,
} = require('../../utils/logging/system-logger');

/**
 * Runs a startup step with consistent logging, timing, and error handling.
 *
 * @param {string} name - Human-readable step name (e.g., "Run migrations")
 * @param {Function} fn - Function to execute (sync or async)
 * @param {Object} [options={}]
 * @param {string} [options.context='startup'] - Logical context for logging (e.g., "startup/create-db")
 *
 * @returns {Promise<*>} Result returned by the executed function
 *
 * @throws {Error} Re-throws any error from the executed function
 *
 * @example
 * await runStartupStep(
 *   'Run migrations',
 *   async () => knex.migrate.latest(),
 *   { context: 'startup/create-db' }
 * );
 */
const runStartupStep = async (name, fn, options = {}) => {
  //--------------------------------------------------
  // Validate input (fail fast for infra utility)
  //--------------------------------------------------
  if (!name || typeof name !== 'string') {
    throw new Error('runStartupStep: "name" must be a non-empty string');
  }

  if (typeof fn !== 'function') {
    throw new Error('runStartupStep: "fn" must be a function');
  }

  const context = options.context || 'startup';
  const start = process.hrtime.bigint();

  //--------------------------------------------------
  // Start log
  //--------------------------------------------------
  logSystemInfo(`Starting: ${name}`, {
    context,
    step: name,
    status: 'started',
  });

  try {
    //--------------------------------------------------
    // Execute step (supports sync + async naturally)
    //--------------------------------------------------
    const result = await fn();

    //--------------------------------------------------
    // Compute duration once
    //--------------------------------------------------
    const durationMs = Math.round(
      Number(process.hrtime.bigint() - start) / 1_000_000
    );

    //--------------------------------------------------
    // Success log
    //--------------------------------------------------
    logSystemInfo(`Completed: ${name}`, {
      context,
      step: name,
      status: 'completed',
      durationMs,
    });

    return result;
  } catch (error) {
    //--------------------------------------------------
    // Compute duration once
    //--------------------------------------------------
    const durationMs = Math.round(
      Number(process.hrtime.bigint() - start) / 1_000_000
    );

    //--------------------------------------------------
    // Failure log
    //--------------------------------------------------
    logSystemException(error, `Failed: ${name}`, {
      context,
      step: name,
      status: 'failed',
      durationMs,
    });

    //--------------------------------------------------
    // Re-throw (critical for startup control flow)
    //--------------------------------------------------
    throw error;
  }
};

module.exports = {
  runStartupStep,
};
