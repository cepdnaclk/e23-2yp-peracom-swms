import express from 'express'
import {
  getDonorApplications,
  updateApplicationByDonor
} from '../controllers/donorController.js'
import { verifyToken, requireRole } from '../middleware/authMiddleware.js'

const router = express.Router()

router.use(verifyToken, requireRole('donor'))

router.get('/applications', getDonorApplications)
router.patch('/applications/:id/status', updateApplicationByDonor)

export default router
