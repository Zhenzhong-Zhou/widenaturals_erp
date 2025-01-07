const express = require('express');
const statusController = require('../controllers/status-controller');
const wrapAsync = require('../utils/wrap-async');

const router = express.Router();

// Define routes for the Status entity
router.get('/all_status', statusController.getAllStatuses);
router.get('/view_status/:id', statusController.getStatusById);
router.post('/create_status', statusController.createStatus);
router.put('/edit_status/:id', statusController.updateStatus);
router.delete('/delete_status/:id', statusController.deleteStatus);

module.exports = router;
