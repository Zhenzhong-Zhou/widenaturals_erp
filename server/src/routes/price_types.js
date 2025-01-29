/**
 * @file price_types.js
 * @description Routes related to user operations.
 */

const express = require('express');
const { getPriceTypesController } = require('../controllers/price-type-controller');


const router = express.Router();

// Route for getting all users
router.get('/', getPriceTypesController);


module.exports = router;
