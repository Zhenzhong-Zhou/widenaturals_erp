const express = require('express');
const dotenv = require('dotenv');
const { validateEnvVars } = require('./config/env');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const db = require('./database/db');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(cors());
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health Check Endpoint
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    const result = await db.query('SELECT 1 + 1 AS result');
    res.status(200).json({ status: 'Healthy', result: result.rows[0], timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ status: 'Unhealthy', error: err.message });
  }
});

// Start Server
const PORT = process.env.PORT;
app.listen(PORT, async () => {
  try {
    // Test database connection
    // await knex.raw('SELECT 1+1 AS result');
    console.log(`✅ Database connected successfully`);
  } catch (err) {
    console.error(`❌ Database connection failed: ${err.message}`);
    process.exit(1); // Exit process with failure
  }
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
