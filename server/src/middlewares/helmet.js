/**
 * @file helmet.js
 * @description Configures and exports the Helmet security headers middleware.
 *
 * CSP policy varies by environment:
 *   - Production  — strict policy, no inline scripts or styles
 *   - Development — relaxed policy, unsafe-inline allowed for dev tooling
 *
 * HSTS is enabled in production only. Enabling it in development would force
 * HTTPS on localhost and break the local dev server.
 *
 * Environment variables:
 *   API_CONNECT_ORIGIN — external API origin added to CSP connect-src
 *                        (e.g. https://api.example.com). Optional; omitting
 *                        it restricts connect-src to same-origin only.
 */

'use strict';

const helmet = require('helmet');

const isProduction = process.env.NODE_ENV === 'production';

// External API origin for CSP connect-src.
// Must be set explicitly — the placeholder is intentionally absent so a
// missing value produces a same-origin-only policy rather than silently
// allowing a stale example domain.
const apiConnectOrigin = process.env.API_CONNECT_ORIGIN;

const connectSrc = apiConnectOrigin
  ? ["'self'", apiConnectOrigin]
  : ["'self'"];

// Shared CSP directives across both environments.
const sharedDirectives = {
  imgSrc:       ["'self'", 'data:'],
  connectSrc,
  fontSrc:      ["'self'", 'https://fonts.googleapis.com', 'https://fonts.gstatic.com'],
  objectSrc:    ["'none'"],
  // Disallow framing entirely — defence against clickjacking on top of frameguard.
  frameSrc:     ["'none'"],
};

// -----------------------------------------------------------------------------
// Helmet configuration
// -----------------------------------------------------------------------------

/**
 * Configured Helmet middleware instance with environment-aware security headers.
 *
 * Notable decisions:
 *   - `crossOriginEmbedderPolicy: true` — required for SharedArrayBuffer and
 *     high-resolution timers; mitigates Spectre-class side-channel attacks.
 *   - `hsts` disabled in development — enabling it on localhost forces HTTPS
 *     and breaks the local dev server until the browser cache is cleared.
 *   - `referrerPolicy: 'no-referrer'` — prevents the Referer header from
 *     leaking internal URLs to third-party resources.
 *   - `upgradeInsecureRequests` only in production — would break local HTTP.
 *
 * @type {import('express').RequestHandler}
 */
const configureHelmet = helmet({
  contentSecurityPolicy: {
    directives: isProduction
      ? {
        ...sharedDirectives,
        defaultSrc: ["'self'"],
        scriptSrc:  ["'self'"],
        styleSrc:   ["'self'"],
        // Force HTTP → HTTPS upgrades at the browser level.
        upgradeInsecureRequests: [],
      }
      : {
        ...sharedDirectives,
        defaultSrc: ["'self'"],
        // unsafe-inline required for Vite HMR and dev tool injections.
        scriptSrc:  ["'self'", "'unsafe-inline'"],
        styleSrc:   ["'self'", "'unsafe-inline'"],
      },
  },
  
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy:   { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-origin' },
  
  dnsPrefetchControl: { allow: false },
  
  // X-Frame-Options: DENY — belt-and-suspenders with frameSrc: none above.
  frameguard: { action: 'deny' },
  
  hidePoweredBy: true,
  
  hsts: isProduction
    ? {
      maxAge:            31536000, // 1 year
      includeSubDomains: true,
      preload:           true,
    }
    : false,
  
  ieNoOpen:       true,
  noSniff:        true,
  referrerPolicy: { policy: 'no-referrer' },
});

module.exports = configureHelmet;
