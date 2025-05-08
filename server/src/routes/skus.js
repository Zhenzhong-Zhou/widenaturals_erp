const express = require('express');
const { getActiveSkuProductCardsController } = require('../controllers/sku-controller');

const router = express.Router();

// GET /api/v1/skus/cards/active?status_id=...&page=...&limit=...
router.get('/cards/active', getActiveSkuProductCardsController);

module.exports = router;
