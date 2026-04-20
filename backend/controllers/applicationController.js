// controllers/applicationController.js
// Handles student scholarship application review and decisions

const supabase = require('../config/supabase');

// GET /api/applications
// Supports search by student name, filter by scholarship, filter by status
const getAll = async (req, res) => {
  try {
    let query = supabase
      .from('applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (req.query.student_name) query = query.ilike('student_name', `%${req.query.student_name}%`);
    if (req.query.scholarship_id) query = query.eq('scholarship_id', req.query.scholarship_id);
    if (req.query.status) query = query.eq('status', req.query.status);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/applications/:id
// Returns full application with documents
const getById = async (req, res) => {
  try {
    const { data: application, error } = await supabase
      .from('applications')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error) throw error;

    // Fetch associated documents
    const { data: documents } = await supabase
      .from('application_documents')
      .select('*')
      .eq('application_id', req.params.id);

    res.json({ ...application, documents: documents || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PUT /api/applications/:id/decision
// Admin approves, rejects, or requests resubmission
const makeDecision = async (req, res) => {
  try {
    const { status, reason } = req.body;
    // status: 'Approved' | 'Rejected' | 'Resubmission Requested'

    const { data, error } = await supabase
      .from('applications')
      .update({ status, admin_reason: reason || null })
      .eq('id', req.params.id)
      .select();
    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/applications/approved/:scholarship_id
// Get approved students for a specific scholarship (used in assign page)
const getApprovedByScholarship = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('scholarship_id', req.params.scholarship_id)
      .eq('status', 'Approved');
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAll, getById, makeDecision, getApprovedByScholarship };
