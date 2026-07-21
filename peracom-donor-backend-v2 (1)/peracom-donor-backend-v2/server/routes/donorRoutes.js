import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { donorOnly } from '../middleware/roleMiddleware.js';
import {
  createIssue,
  createScholarshipRequest,
  getAnnouncements,
  getApprovedStudents,
  getDashboard,
  getIssues,
  getNotifications,
  getProgressUpdateById,
  getProgressUpdates,
  getScholarshipRequests,
  getScholarships,
  getStudentById,
} from '../controllers/donorController.js';

const router = Router();

router.use(authenticate, donorOnly);

router.get('/dashboard', getDashboard);
router.get('/scholarships', getScholarships);
router.get('/scholarship-requests', getScholarshipRequests);
router.post('/scholarship-requests', createScholarshipRequest);
router.get('/approved-students', getApprovedStudents);
router.get('/students/:id', getStudentById);
router.get('/progress-updates', getProgressUpdates);
router.get('/progress-updates/:id', getProgressUpdateById);
router.post('/issues', createIssue);
router.get('/issues', getIssues);
router.get('/notifications', getNotifications);

export default router;
