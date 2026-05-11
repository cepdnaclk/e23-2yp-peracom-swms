import express from 'express'
import { getStudentDashboard, markNotificationRead, getMyProfile, getStudentAnnouncements, markAnnouncementRead } from '../controllers/studentController.js'
import { verifyToken, requireRole } from '../middleware/authMiddleware.js'

const router = express.Router()

router.use(verifyToken)

router.use(requireRole('student'))

router.get('/dashboard', getStudentDashboard)
router.get('/announcements', getStudentAnnouncements)
router.post('/announcements/:id/read', markAnnouncementRead)
router.get('/profile', getMyProfile)
router.patch('/notifications/:id/read', markNotificationRead)

export default router