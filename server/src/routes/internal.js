const express = require('express');
const { getInternalStatus } = require('../controllers/internal-controller');
const authenticate = require('../middlewares/authenticate');


const router = express.Router();

/**
 * Internal system status route.
 * Restricted to authorized users (e.g., admins or internal tools).
 */
router.get('/status', authenticate(), getInternalStatus);

module.exports = router;
