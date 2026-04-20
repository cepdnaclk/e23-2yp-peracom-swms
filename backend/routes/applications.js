// routes/applications.js
const express = require('express');
const router = express.Router();
const { getAll, getById, makeDecision, getApprovedByScholarship } = require('../controllers/applicationController');

router.get('/',                              getAll);
router.get('/approved/:scholarship_id',      getApprovedByScholarship);
router.get('/:id',                           getById);
router.put('/:id/decision',                  makeDecision);

module.exports = router;
