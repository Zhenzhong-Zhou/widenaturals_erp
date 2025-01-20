const wrapAsync = require('../utils/wrap-async');
const { getUserProfileById } = require('../services/user-service');
const AppError = require('../utils/AppError');

/**
 * Controller to fetch the authenticated user's profile.
 *
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The next middleware function.
 */
const getUserProfile = wrapAsync(async (req, res) => {
  // Ensure user is authenticated
  if (!req.user || !req.user.id) {
    throw new AppError.authenticationError('User is not authenticated', 401, {
      type: 'AuthenticationError',
    });
  }
  
  // Fetch user profile
  const userProfile = await getUserProfileById(req.user.id);
  
  // Send standardized response
  res.status(200).json({
    success: true,
    message: 'User profile retrieved successfully',
    data: userProfile,
    timestamp: new Date().toISOString(),
  });
});

module.exports = {
  getUserProfile,
};
