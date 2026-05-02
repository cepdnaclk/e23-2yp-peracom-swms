import {
  createIssueForDonor,
  createScholarshipRequestForDonor,
  getApprovedStudentProfile,
  getDashboardData,
  getProgressUpdateForDonor,
  getScholarshipsForDonor,
  listAnnouncements,
  listApprovedStudentsForDonor,
  listIssuesForDonor,
  listNotificationsForDonor,
  listProgressUpdatesForDonor,
  listScholarshipRequestsForDonor,
} from '../services/donorService.js';
import { validateIssue, validateScholarshipRequest } from '../utils/validators.js';

export async function getDashboard(req, res) {
  try {
    const result = await getDashboardData(req.user.id);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load dashboard', error: error.message });
  }
}

export async function getScholarships(req, res) {
  try {
    const result = await getScholarshipsForDonor(req.user.id);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load scholarships', error: error.message });
  }
}

export async function createScholarshipRequest(req, res) {
  try {
    const validationError = validateScholarshipRequest(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const result = await createScholarshipRequestForDonor(req.user.id, req.body);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create scholarship request', error: error.message });
  }
}

export async function getScholarshipRequests(req, res) {
  try {
    const result = await listScholarshipRequestsForDonor(req.user.id);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load scholarship requests', error: error.message });
  }
}

export async function getApprovedStudents(req, res) {
  try {
    const result = await listApprovedStudentsForDonor(req.user.id, req.query);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load approved students', error: error.message });
  }
}

export async function getStudentById(req, res) {
  try {
    const result = await getApprovedStudentProfile(req.user.id, req.params.id);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load student profile', error: error.message });
  }
}

export async function getProgressUpdates(req, res) {
  try {
    const result = await listProgressUpdatesForDonor(req.user.id, req.query);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load progress updates', error: error.message });
  }
}

export async function getProgressUpdateById(req, res) {
  try {
    const result = await getProgressUpdateForDonor(req.user.id, req.params.id);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load progress update', error: error.message });
  }
}

export async function createIssue(req, res) {
  try {
    const validationError = validateIssue(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const result = await createIssueForDonor(req.user.id, req.body);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create issue', error: error.message });
  }
}

export async function getIssues(req, res) {
  try {
    const result = await listIssuesForDonor(req.user.id);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load issues', error: error.message });
  }
}

export async function getNotifications(req, res) {
  try {
    const result = await listNotificationsForDonor(req.user.id);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load notifications', error: error.message });
  }
}

export async function getAnnouncements(req, res) {
  try {
    const result = await listAnnouncements();
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load announcements', error: error.message });
  }
}
