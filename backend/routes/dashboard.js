// routes/dashboard.js
const express = require('express');
const router = express.Router();
const { getSummary, getRecentActivity } = require('../controllers/dashboardController');

router.get('/summary', getSummary);
router.get('/recent-activity', getRecentActivity);

module.exports = router;
