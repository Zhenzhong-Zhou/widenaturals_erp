const helmet = require('helmet');

/**
 * Helmet middleware configuration
 *
 * @param {boolean} isProduction - Indicates if the environment is production
 * @returns {Function} - Configured Helmet middleware
 */
const configureHelmet = (isProduction) => {
  return helmet({
    contentSecurityPolicy: isProduction
      ? {
        directives: {
          defaultSrc: ["'self'"], // Allow resources from the same origin
          scriptSrc: ["'self'"], // Allow scripts from the same origin
          objectSrc: ["'none'"], // Disallow object elements
          upgradeInsecureRequests: [], // Include this directive without a value
        },
      }
      : false, // Disable CSP in development
  });
};

module.exports = configureHelmet;
