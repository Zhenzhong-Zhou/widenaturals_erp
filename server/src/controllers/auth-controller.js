/**
 * @file auth-controller.js
 * @description Contains the logic for authentication routes.
 */

/**
 * POST /login
 * Handles user login.
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 */
const login = (req, res) => {
  const { username, password } = req.body;
  
  // Logic to authenticate user
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }
  
  // Example: Hardcoded validation (Replace with database check)
  if (username === 'admin' && password === 'password') {
    return res.status(200).json({ message: 'Login successful', username });
  }
  
  res.status(401).json({ error: 'Invalid credentials' });
};

/**
 * POST /signup
 * Handles user registration.
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 */
const signup = (req, res) => {
  const { username, email, password } = req.body;
  
  // Logic to register a new user
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required.' });
  }
  
  // Example: Mock registration logic (Replace with database insertion)
  res.status(201).json({ message: 'Signup successful', username });
};

module.exports = { login, signup };
