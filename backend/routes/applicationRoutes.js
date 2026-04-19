import express from 'express'
import multer from 'multer'
import { submitApplication, getMyApplications, getApplicationById, hasAppliedForScholarship } from '../controllers/applicationController.js'
import { verifyToken, requireRole } from '../middleware/authMiddleware.js'

const router = express.Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only PDF, JPG, and PNG files are allowed.'), false)
    }
  }
})

router.use(verifyToken)
router.use(requireRole('student'))

router.post('/submit', upload.fields([
  { name: 'grades', maxCount: 1 },
  { name: 'id_card', maxCount: 1 },
  { name: 'essay', maxCount: 1 }
  
]), submitApplication)
router.get('/', getMyApplications)
router.get('/has-applied/:scholarshipId', hasAppliedForScholarship)
router.get('/:id', getApplicationById)

export default router