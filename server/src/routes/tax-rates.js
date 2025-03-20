const express = require('express');
const router = express.Router();
const {  getTaxRatesForDropdownController } = require('../controllers/tax-rate-controller');

router.get('/dropdown', getTaxRatesForDropdownController);

module.exports = router;
