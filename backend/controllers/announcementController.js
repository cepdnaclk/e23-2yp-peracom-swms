// controllers/announcementController.js
// Handles creating and managing announcements

const supabase = require('../config/supabase');

// GET /api/announcements
const getAll = async (req, res) => {
  try {
    let query = supabase.from('announcements').select('*').order('created_at', { ascending: false });
    if (req.query.status)   query = query.eq('status', req.query.status);
    if (req.query.audience) query = query.eq('audience', req.query.audience);
    if (req.query.search)   query = query.ilike('title', `%${req.query.search}%`);
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/announcements/:id
const getById = async (req, res) => {
  try {
    const { data, error } = await supabase.from('announcements').select('*').eq('id', req.params.id).single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/announcements
const create = async (req, res) => {
  try {
    const { title, audience, content, publish_date, status } = req.body;
    const { data, error } = await supabase
      .from('announcements')
      .insert([{ title, audience, content, publish_date, status: status || 'Draft' }])
      .select();
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PUT /api/announcements/:id
const update = async (req, res) => {
  try {
    const { title, audience, content, publish_date, status } = req.body;
    const { data, error } = await supabase
      .from('announcements')
      .update({ title, audience, content, publish_date, status })
      .eq('id', req.params.id)
      .select();
    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/announcements/:id
const remove = async (req, res) => {
  try {
    const { error } = await supabase.from('announcements').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAll, getById, create, update, remove };
