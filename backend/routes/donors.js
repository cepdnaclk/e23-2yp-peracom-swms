// routes/donors.js
const express = require('express');
const router = express.Router();
const { getAll, getSummary, getById, updateStatus, update } = require('../controllers/donorController');

router.get('/summary',       getSummary);
router.get('/',              getAll);
router.get('/:id',           getById);
router.put('/:id/status',    updateStatus);
router.put('/:id',           update);

module.exports = router;
