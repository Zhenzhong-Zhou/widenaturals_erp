const wrapAsync = require('../utils/wrap-async');
const { getUserProfileById, fetchAllUsers } = require('../services/user-service');
const AppError = require('../utils/AppError');

/**
 * Controller to handle fetching paginated users.
 */
const getAllUsersController = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sortBy = 'u.created_at', sortOrder = 'ASC' } = req.query;
    
    // Validate inputs
    const paginationParams = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sortBy,
      sortOrder,
    };
    
    if (paginationParams.page < 1 || paginationParams.limit < 1) {
      return res.status(400).json({
        success: false,
        message: 'Page and limit must be positive integers.',
      });
    }
    
    // Call service
    const users = await fetchAllUsers(paginationParams);
    
    res.status(200).json({
      success: true,
      data: users.data,
      pagination: users.pagination,
    });
  } catch (error) {
    next(error);
  }
};

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
  getAllUsersController,
  getUserProfile,
};
