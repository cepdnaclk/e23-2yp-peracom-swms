import express from 'express'
import {
  getPendingUsers,
  getAllUsers,
  updateUserApprovalStatus,
  getPendingScholarships,
  updateScholarshipStatus,
  getPendingApplications,
  updateApplicationStatus,
  createAnnouncement
} from '../controllers/adminController.js'
import { verifyToken, requireRole } from '../middleware/authMiddleware.js'

const router = express.Router()

router.use(verifyToken, requireRole('admin'))

router.get('/users/pending', getPendingUsers)
router.get('/users', getAllUsers)
router.patch('/users/:id/status', updateUserApprovalStatus)
router.get('/scholarships/pending', getPendingScholarships)
router.patch('/scholarships/:id/status', updateScholarshipStatus)

//  Application Review & Announcements
router.get('/applications/pending', getPendingApplications)
router.patch('/applications/:id/status', updateApplicationStatus)
router.post('/announcements', createAnnouncement)

export default router
