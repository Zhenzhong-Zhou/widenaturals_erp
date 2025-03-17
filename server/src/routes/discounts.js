const express = require('express');
const { getDiscountsForDropdownController } = require('../controllers/discount-controller');

const router = express.Router();

router.get('/dropdown', getDiscountsForDropdownController);

module.exports = router;
