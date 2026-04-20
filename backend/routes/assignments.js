// routes/assignments.js
const express = require('express');
const router = express.Router();
const { getScholarshipForAssignment, assignStudents } = require('../controllers/assignmentController');

router.get('/scholarship/:id', getScholarshipForAssignment);
router.post('/',               assignStudents);

module.exports = router;
