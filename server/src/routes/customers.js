const express = require('express');
const { createCustomerController } = require('../controllers/customer-controller');

const router = express.Router();

// Create a single customer
router.post('/add-new-customer', createCustomerController);

// Bulk insert customers
router.post('/bulk/add-new-customers', createCustomerController);

module.exports = router;
