// routes/donorRequests.js
const express = require('express');
const router = express.Router();
const { getAll, getById, reviewRequest } = require('../controllers/donorRequestController');

router.get('/',                   getAll);
router.get('/:id',                getById);
router.put('/:id/review',         reviewRequest);

module.exports = router;
