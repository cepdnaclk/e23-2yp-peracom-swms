// routes/issues.js
const express = require('express');
const router = express.Router();
const { getAll, getSummary, getById, update } = require('../controllers/issueController');

router.get('/summary', getSummary);
router.get('/',        getAll);
router.get('/:id',     getById);
router.put('/:id',     update);

module.exports = router;
