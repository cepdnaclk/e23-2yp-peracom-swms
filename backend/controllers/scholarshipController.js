import { supabaseAdmin } from '../config/supabaseClient.js'

export const getScholarships = async (req, res) => {
  const { search, min_amount, max_amount } = req.query

  let query = supabaseAdmin
    .from('scholarships')
    .select('id, title, description, amount, deadline, requirements, status, created_at, donor_name, funding_type, slots')
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
  }
  
  if (min_amount) {
    query = query.gte('amount', Number(min_amount))
  }
  if (max_amount) {
    query = query.lte('amount', Number(max_amount))
  }

  const { data, error } = await query

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch scholarships.' })
  }

  return res.status(200).json({ count: data.length, scholarships: data })
}

export const getScholarshipById = async (req, res) => {
  const { id } = req.params //// Extracts '123' from the URL /api/scholarships/123

  const { data, error } = await supabaseAdmin
    .from('scholarships')
    .select('*')
    .eq('id', id)
    .eq('status', 'published')
    .single() // Returns exactly one object, not an array

  if (error || !data) {
    return res.status(404).json({ error: 'Scholarship not found.' })
  }
//  Ships the data back to the frontend ApplyPage.jsx as JSON
  return res.status(200).json({ scholarship: data })
}

export const getCategories = async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('scholarships')
    .select('*')
    .eq('status', 'published')

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch categories.' })
  }

  const categories = [...new Set(data.map(s => s.category).filter(Boolean))]
  return res.status(200).json({ categories })
}

export const getAllScholarships = async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('scholarships')
    .select('id, title, description, amount, deadline, requirements, status, created_at, donor_id, donor_name, slots, funding_type')
    .order('created_at', { ascending: false })

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch scholarships.' })
  }

  return res.status(200).json({ count: data.length, scholarships: data })
}

export const createScholarship = async (req, res) => {
  const donorId = req.user.id
  const {
    title,
    description,
    amount,
    category,
    deadline,
    requirements,
    slots,
    funding_type,
    donor_name,
  } = req.body

  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required.' })
  }

  const { data, error } = await supabaseAdmin
    .from('scholarships')
    .insert({
      title,
      description,
      amount: amount ?? null,
      // category: category ?? null, // Removed because no category column exists in DB
      deadline: deadline ?? null,
      requirements: requirements ?? null,
      slots: slots ?? null,
      funding_type: funding_type ?? 'full',
      donor_id: donorId,
      donor_name: donor_name ?? null,
      status: 'draft'
    })
    .select()
    .single()

  if (error) {
    return res.status(500).json({ error: 'Failed to create scholarship.' })
  }

  return res.status(201).json({ scholarship: data })
}

export const updateScholarship = async (req, res) => {
  const donorId = req.user.id
  const { id } = req.params
  const {
    title,
    description,
    amount,
    category,
    deadline,
    requirements,
    slots,
    funding_type,
    donor_name,
  } = req.body

  const { data, error } = await supabaseAdmin
    .from('scholarships')
    .update({
      title,
      description,
      amount: amount ?? null,
      // category: category ?? null, // Removed because no category column exists in DB
      deadline: deadline ?? null,
      requirements: requirements ?? null,
      slots: slots ?? null,
      funding_type,
      donor_name: donor_name ?? null,
    })
    .eq('id', id)
    .eq('donor_id', donorId)
    .select()
    .single()

  if (error || !data) {
    return res.status(404).json({ error: 'Scholarship not found or update failed.' })
  }

  return res.status(200).json({ scholarship: data })
}

export const submitScholarshipForReview = async (req, res) => {
  const donorId = req.user.id
  const { id } = req.params

  const { data, error } = await supabaseAdmin
    .from('scholarships')
    .update({ status: 'pending_review' })
    .eq('id', id)
    .eq('donor_id', donorId)
    .in('status', ['draft', 'rejected'])
    .select()
    .single()

  if (error || !data) {
    return res.status(404).json({ error: 'Scholarship not found or cannot be submitted.' })
  }

  return res.status(200).json({ scholarship: data })
}

export const getPublicScholarships = async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('scholarships')
    .select('id, title, description, amount, deadline, requirements, status, created_at, donor_name, funding_type, slots')
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch scholarships.' })
  }

  return res.status(200).json({ count: data.length, scholarships: data })
}