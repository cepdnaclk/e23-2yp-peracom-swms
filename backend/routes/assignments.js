// ============================================================
// FILE 3: backend/routes/assignments.js
// ============================================================

const express = require('express');
const router  = express.Router();
const {
  getScholarshipForAssignment,
  assignStudents,
  getAssignedStudentsByDonor,
} = require('../controllers/assignmentController');

// Get scholarship + donor + approved students for assign page
router.get('/scholarship/:id',    getScholarshipForAssignment);

// Get all students assigned to a donor
router.get('/donor/:donor_id',    getAssignedStudentsByDonor);

// Assign selected students to donor
router.post('/',                  assignStudents);

module.exports = router;

