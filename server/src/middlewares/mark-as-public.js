/**
 * Middleware to mark a route as public.
 * Public routes do not require authentication and can be accessed without a token.
 *
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @param {function} next - The next middleware function.
 */
const markAsPublic = (req, res, next) => {
  req.isPublic = true; // Mark the route as public
  next();
};

module.exports = markAsPublic;
