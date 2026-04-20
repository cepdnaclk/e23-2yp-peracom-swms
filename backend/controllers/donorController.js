// controllers/donorController.js
// Handles donor management: list, detail, status updates

const supabase = require('../config/supabase');

// GET /api/donors
const getAll = async (req, res) => {
  try {
    let query = supabase.from('donors').select('*').order('created_at', { ascending: false });

    if (req.query.name)   query = query.ilike('name', `%${req.query.name}%`);
    if (req.query.status) query = query.eq('status', req.query.status);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/donors/summary
// Returns summary card counts
const getSummary = async (req, res) => {
  try {
    const { count: total }  = await supabase.from('donors').select('*', { count: 'exact', head: true });
    const { count: active } = await supabase.from('donors').select('*', { count: 'exact', head: true }).eq('status', 'Active');
    const { data: fundData } = await supabase.from('donors').select('available_fund');
    const totalFunds = (fundData || []).reduce((sum, d) => sum + (d.available_fund || 0), 0);
    const { count: scholarships } = await supabase.from('donor_scholarships').select('*', { count: 'exact', head: true });

    res.json({ totalDonors: total || 0, activeDonors: active || 0, fundedScholarships: scholarships || 0, totalAvailableFunds: totalFunds });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/donors/:id
// Full donor detail with scholarships and assigned students
const getById = async (req, res) => {
  try {
    const { data: donor, error } = await supabase.from('donors').select('*').eq('id', req.params.id).single();
    if (error) throw error;

    // Get scholarships supported by donor
    const { data: scholarships } = await supabase
      .from('scholarships')
      .select('id, title, funding_amount, status')
      .eq('donor_id', req.params.id);

    // Get students assigned to this donor
    const { data: students } = await supabase
      .from('donor_students')
      .select('application_id, scholarship_id, assigned_at, applications(student_name, registration_number, batch, status), scholarships(title)')
      .eq('donor_id', req.params.id);

    res.json({ ...donor, scholarships: scholarships || [], students: students || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PUT /api/donors/:id/status
// Approve, suspend, or activate a donor
const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { data, error } = await supabase
      .from('donors')
      .update({ status })
      .eq('id', req.params.id)
      .select();
    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PUT /api/donors/:id
// Edit donor details
const update = async (req, res) => {
  try {
    const { name, organization, email, phone, address, available_fund } = req.body;
    const { data, error } = await supabase
      .from('donors')
      .update({ name, organization, email, phone, address, available_fund })
      .eq('id', req.params.id)
      .select();
    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAll, getSummary, getById, updateStatus, update };
