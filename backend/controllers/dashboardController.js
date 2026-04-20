// controllers/dashboardController.js
// Handles all data for the Admin Dashboard page

const supabase = require('../config/supabase');

// GET /api/dashboard/summary
// Returns the 4 summary card counts
const getSummary = async (req, res) => {
  try {
    // Count pending applications
    const { count: pendingApps } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Pending');

    // Count pending document verifications
    const { count: pendingDocs } = await supabase
      .from('application_documents')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Pending');

    // Count open/reported issues
    const { count: reportedIssues } = await supabase
      .from('issues')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Open');

    // Count active scholarships
    const { count: activeScholarships } = await supabase
      .from('scholarships')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Active');

    res.json({
      pendingApplications: pendingApps || 0,
      pendingDocumentVerifications: pendingDocs || 0,
      reportedIssues: reportedIssues || 0,
      activeScholarships: activeScholarships || 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/dashboard/recent-activity
// Returns the latest 10 activities across the system
const getRecentActivity = async (req, res) => {
  try {
    // Get recent applications
    const { data: recentApps } = await supabase
      .from('applications')
      .select('id, student_name, scholarship_title, status, created_at')
      .order('created_at', { ascending: false })
      .limit(4);

    // Get recent issues
    const { data: recentIssues } = await supabase
      .from('issues')
      .select('id, title, reported_by, status, created_at')
      .order('created_at', { ascending: false })
      .limit(3);

    // Get recent donor requests
    const { data: recentRequests } = await supabase
      .from('donor_scholarship_requests')
      .select('id, donor_name, scholarship_title, status, created_at')
      .order('created_at', { ascending: false })
      .limit(3);

    // Combine and sort all activities by date
    const activities = [
      ...(recentApps || []).map(a => ({
        id: `app-${a.id}`,
        type: 'Application',
        description: `${a.student_name} applied for ${a.scholarship_title}`,
        status: a.status,
        time: a.created_at,
      })),
      ...(recentIssues || []).map(i => ({
        id: `issue-${i.id}`,
        type: 'Issue',
        description: `Issue reported: ${i.title} by ${i.reported_by}`,
        status: i.status,
        time: i.created_at,
      })),
      ...(recentRequests || []).map(r => ({
        id: `req-${r.id}`,
        type: 'Scholarship Request',
        description: `${r.donor_name} submitted "${r.scholarship_title}"`,
        status: r.status,
        time: r.created_at,
      })),
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10);

    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getSummary, getRecentActivity };
