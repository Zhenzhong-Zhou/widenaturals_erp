const { verifyToken, signToken } = require('../utils/token-helper');
const {
  logSystemWarn,
  logSystemException,
} = require('../utils/system-logger');
const AppError = require('../utils/AppError');
const {
  userExistsByField,
} = require('../repositories/user-repository');
const {
  validateRoleById,
} = require('../validators/db-validators');

/**
 * Middleware to authenticate users using JWT tokens.
 *
 * Responsibilities:
 * - Verify access token
 * - Ensure referenced user still exists
 * - Refresh access token when expired (if refresh token is valid)
 *
 * NOTE:
 * This middleware performs authentication only.
 * Authorization and status checks are handled elsewhere.
 */
const authenticate = () => {
  return async (req, res, next) => {
    try {
      const accessToken = req.headers.authorization?.split(' ')[1];
      const refreshToken = req.cookies?.refreshToken;
      
      if (!accessToken) {
        logSystemWarn('Access token missing', { path: req.path });
        return next(
          AppError.accessTokenError('Access token is missing. Please log in.')
        );
      }
      
      try {
        // ------------------------------------------------------------
        // Verify access token
        // ------------------------------------------------------------
        const payload = verifyToken(accessToken);
        
        // ------------------------------------------------------------
        // Structural existence check (no status semantics)
        // ------------------------------------------------------------
        const exists = await userExistsByField('id', payload.id);
        
        if (!exists) {
          throw AppError.authenticationError(
            'User associated with this token no longer exists.'
          );
        }
        
        // ------------------------------------------------------------
        // Validate role reference
        // ------------------------------------------------------------
        const validatedRoleId = await validateRoleById(payload.role);
        
        req.user = {
          ...payload,
          role: validatedRoleId,
        };
        
        return next();
      } catch (error) {
        // ------------------------------------------------------------
        // Attempt refresh flow if access token expired
        // ------------------------------------------------------------
        if (error.name === 'TokenExpiredError' && refreshToken) {
          logSystemWarn('Access token expired, attempting refresh', {
            path: req.path,
          });
          
          try {
            const refreshPayload = verifyToken(refreshToken, true);
            
            const exists = await userExistsByField(
              'id',
              refreshPayload.id
            );
            
            if (!exists) {
              throw AppError.authenticationError(
                'User associated with refresh token no longer exists.'
              );
            }
            
            const newAccessToken = signToken({
              id: refreshPayload.id,
              role: refreshPayload.role,
            });
            
            res.setHeader('X-New-Access-Token', newAccessToken);
            
            req.user = refreshPayload;
            return next();
          } catch (refreshError) {
            logSystemException(
              refreshError,
              'Refresh token validation failed'
            );
            
            if (refreshError.name === 'TokenExpiredError') {
              throw AppError.refreshTokenExpiredError(
                'Refresh token expired. Please log in again.'
              );
            }
            
            throw AppError.refreshTokenError(
              'Invalid refresh token. Please log in again.'
            );
          }
        }
        
        // ------------------------------------------------------------
        // Other token errors
        // ------------------------------------------------------------
        logSystemException(error, 'Access token validation failed');
        
        throw AppError.accessTokenExpiredError(
          'Access token expired. Please log in again.'
        );
      }
    } catch (error) {
      logSystemException(error, 'Authentication middleware failed');
      
      return next(
        error instanceof AppError
          ? error
          : AppError.authenticationError(
            error.message || 'Authentication failed.'
          )
      );
    }
  };
};

module.exports = authenticate;
