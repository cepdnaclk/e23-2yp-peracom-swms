// controllers/issueController.js
// Handles reported issues management

const supabase = require('../config/supabase');

// GET /api/issues
const getAll = async (req, res) => {
  try {
    let query = supabase.from('issues').select('*').order('created_at', { ascending: false });
    if (req.query.status)      query = query.eq('status', req.query.status);
    if (req.query.category)    query = query.eq('category', req.query.category);
    if (req.query.reported_by) query = query.ilike('reported_by', `%${req.query.reported_by}%`);
    if (req.query.search)      query = query.ilike('title', `%${req.query.search}%`);
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/issues/summary
const getSummary = async (req, res) => {
  try {
    const { count: total }      = await supabase.from('issues').select('*', { count: 'exact', head: true });
    const { count: open }       = await supabase.from('issues').select('*', { count: 'exact', head: true }).eq('status', 'Open');
    const { count: inProgress } = await supabase.from('issues').select('*', { count: 'exact', head: true }).eq('status', 'In Progress');
    const { count: resolved }   = await supabase.from('issues').select('*', { count: 'exact', head: true }).eq('status', 'Resolved');
    res.json({ total: total || 0, open: open || 0, inProgress: inProgress || 0, resolved: resolved || 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/issues/:id
const getById = async (req, res) => {
  try {
    const { data, error } = await supabase.from('issues').select('*').eq('id', req.params.id).single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PUT /api/issues/:id
// Update status or add admin reply
const update = async (req, res) => {
  try {
    const { status, admin_reply } = req.body;
    const { data, error } = await supabase
      .from('issues')
      .update({ status, admin_reply })
      .eq('id', req.params.id)
      .select();
    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAll, getSummary, getById, update };
