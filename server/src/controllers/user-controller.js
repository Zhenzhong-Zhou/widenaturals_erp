const wrapAsync = require('../utils/wrap-async');
const { getUserProfileById } = require('../services/user-service');

const getUserProfile = wrapAsync(async (req, res, next) => {
  try {
    // Extract the user ID from the request object (set by middleware)
    const userId = req.user.id;
    
    // Fetch user profile from the service layer
    const userProfile = await getUserProfileById(userId);
    
    // Send the response
    res.status(200).json({
      success: true,
      data: userProfile,
    });
  } catch (error) {
    next(error); // Forward error to global error handler
  }
});

module.exports = {
  getUserProfile,
};
