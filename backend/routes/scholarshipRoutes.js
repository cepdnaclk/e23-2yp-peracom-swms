import express from 'express'
import {
	getScholarships,
	getScholarshipById,
	getCategories,
	getAllScholarships,
	createScholarship,
	updateScholarship,
	submitScholarshipForReview,
	getPublicScholarships
} from '../controllers/scholarshipController.js'
import { verifyToken, requireRole } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/public', getPublicScholarships)

router.use(verifyToken)
// An admin needs to see everything in the database, 
// including drafts and pending scholarships, so they can review them.
router.get('/all', getAllScholarships)

//When a logged-in student visits their dashboard,
//  this fetches only the "approved" scholarships for them to apply to. It also handles searching and filtering 
router.get('/', getScholarships)
router.get('/categories', getCategories)

router.get('/:id', getScholarshipById)

router.post('/', requireRole('donor'), createScholarship)
router.patch('/:id', requireRole('donor'), updateScholarship)
router.post('/:id/submit', requireRole('donor'), submitScholarshipForReview)

export default router