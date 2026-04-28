// controllers/applicationController.js
const supabase = require('../config/supabase');

// GET /api/applications
const getAll = async (req, res) => {
  try {
    let query = supabase
      .from('applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (req.query.student_name)  query = query.ilike('student_name', `%${req.query.student_name}%`);
    if (req.query.status)        query = query.eq('status', req.query.status);

    // Filter by scholarship — try both scholarship_id and scholarship_title
    if (req.query.scholarship_id) {
      // First get the scholarship title for fallback
      const { data: sch } = await supabase
        .from('scholarships')
        .select('title')
        .eq('id', req.query.scholarship_id)
        .single();

      const { data, error } = await query;
      if (error) throw error;

      // Filter: match by scholarship_id OR by scholarship_title
      const filtered = (data || []).filter(app =>
        app.scholarship_id === req.query.scholarship_id ||
        (sch && app.scholarship_title === sch.title)
      );

      return res.json(filtered);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);

  } catch (error) {
    console.error('getAll error:', error);
    res.status(500).json({ error: error.message });
  }
};

// GET /api/applications/:id
const getById = async (req, res) => {
  try {
    const { data: application, error } = await supabase
      .from('applications')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error) throw error;

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
const makeDecision = async (req, res) => {
  try {
    const { status, reason } = req.body;
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
const getApprovedByScholarship = async (req, res) => {
  try {
    const scholarshipId = req.params.scholarship_id;

    // Get scholarship title for fallback matching
    const { data: sch } = await supabase
      .from('scholarships')
      .select('title')
      .eq('id', scholarshipId)
      .single();

    // Try by scholarship_id
    const { data: byId } = await supabase
      .from('applications')
      .select('*')
      .eq('scholarship_id', scholarshipId)
      .eq('status', 'Approved');

    if (byId && byId.length > 0) return res.json(byId);

    // Fallback: by title
    if (sch) {
      const { data: byTitle } = await supabase
        .from('applications')
        .select('*')
        .eq('scholarship_title', sch.title)
        .eq('status', 'Approved');
      return res.json(byTitle || []);
    }

    res.json([]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAll, getById, makeDecision, getApprovedByScholarship };
