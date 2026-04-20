// controllers/scholarshipController.js
// Handles CRUD operations for scholarships

const supabase = require('../config/supabase');

// GET /api/scholarships
const getAll = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('scholarships')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/scholarships/:id
const getById = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('scholarships')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/scholarships
const create = async (req, res) => {
  try {
    const { title, description, eligibility_criteria, eligible_batch, deadline, funding_amount, required_documents, status } = req.body;
    const { data, error } = await supabase
      .from('scholarships')
      .insert([{ title, description, eligibility_criteria, eligible_batch, deadline, funding_amount, required_documents, status: status || 'Active' }])
      .select();
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PUT /api/scholarships/:id
const update = async (req, res) => {
  try {
    const { title, description, eligibility_criteria, eligible_batch, deadline, funding_amount, required_documents, status } = req.body;
    const { data, error } = await supabase
      .from('scholarships')
      .update({ title, description, eligibility_criteria, eligible_batch, deadline, funding_amount, required_documents, status })
      .eq('id', req.params.id)
      .select();
    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/scholarships/:id
const remove = async (req, res) => {
  try {
    const { error } = await supabase
      .from('scholarships')
      .delete()
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Scholarship deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAll, getById, create, update, remove };
