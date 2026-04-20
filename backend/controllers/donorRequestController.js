// controllers/donorRequestController.js
// Handles donor scholarship requests submitted for admin review

const supabase = require('../config/supabase');

// GET /api/donor-requests
const getAll = async (req, res) => {
  try {
    let query = supabase
      .from('donor_scholarship_requests')
      .select('*')
      .order('created_at', { ascending: false });

    // Optional filters from query params
    if (req.query.status) query = query.eq('status', req.query.status);
    if (req.query.donor_name) query = query.ilike('donor_name', `%${req.query.donor_name}%`);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/donor-requests/:id
const getById = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('donor_scholarship_requests')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PUT /api/donor-requests/:id/review
// Admin approves or rejects a donor request
const reviewRequest = async (req, res) => {
  try {
    const { status, rejection_reason } = req.body;
    // status should be 'Approved' or 'Rejected'

    const updateData = { status };
    if (status === 'Rejected' && rejection_reason) {
      updateData.rejection_reason = rejection_reason;
    }

    // If approved, also create a scholarship from this request
    if (status === 'Approved') {
      const { data: requestData } = await supabase
        .from('donor_scholarship_requests')
        .select('*')
        .eq('id', req.params.id)
        .single();

      if (requestData) {
        await supabase.from('scholarships').insert([{
          title: requestData.scholarship_title,
          description: requestData.description,
          eligibility_criteria: requestData.eligibility_criteria,
          eligible_batch: requestData.eligible_batch,
          deadline: requestData.application_deadline,
          funding_amount: requestData.funding_amount,
          required_documents: requestData.required_documents,
          donor_id: requestData.donor_id,
          status: 'Active',
        }]);
      }
    }

    const { data, error } = await supabase
      .from('donor_scholarship_requests')
      .update(updateData)
      .eq('id', req.params.id)
      .select();
    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAll, getById, reviewRequest };
