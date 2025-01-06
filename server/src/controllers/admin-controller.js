const { hashPassword } = require('../utils/hash-password');

/**
 * Handles the creation of a new admin user.
 */
const createAdmin = async (req, res) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;
    
    // Hash the password
    const hashedPassword = await hashPassword(password);
    
    // Save the admin user to the database
    const user = await createUserInDB({
      email,
      hashedPassword,
      firstName,
      lastName,
      role,
    });
    
    res.status(201).json({
      message: 'Admin user created successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error creating admin user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  createAdmin,
};
