const express = require('express');
const {
  getActiveSkuProductCardsController,
  getSkuDetailsController
} = require('../controllers/sku-controller');

const router = express.Router();

// GET /api/v1/skus/cards/active?status_id=...&page=...&limit=...
router.get('/cards/active', getActiveSkuProductCardsController);

router.get('/sku-details/:skuId', getSkuDetailsController);

module.exports = router;
