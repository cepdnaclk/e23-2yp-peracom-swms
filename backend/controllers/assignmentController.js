// controllers/assignmentController.js
// Handles assigning approved students to donors

const supabase = require('../config/supabase');

// GET /api/assignments/scholarship/:id
// Get scholarship info + linked donor + approved students for the assign page
const getScholarshipForAssignment = async (req, res) => {
  try {
    // Get scholarship details
    const { data: scholarship, error: sErr } = await supabase
      .from('scholarships')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (sErr) throw sErr;

    // Get linked donor
    const { data: donor } = await supabase
      .from('donors')
      .select('id, name, organization')
      .eq('id', scholarship.donor_id)
      .single();

    // Get approved students for this scholarship
    const { data: students } = await supabase
      .from('applications')
      .select('id, student_name, registration_number, batch, gpa, department, status')
      .eq('scholarship_id', req.params.id)
      .eq('status', 'Approved');

    // Count already assigned
    const { count: assignedCount } = await supabase
      .from('donor_students')
      .select('*', { count: 'exact', head: true })
      .eq('scholarship_id', req.params.id);

    res.json({
      scholarship,
      donor: donor || null,
      approvedStudents: students || [],
      alreadyAssignedCount: assignedCount || 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/assignments
// Assign selected students to the donor linked with a scholarship
const assignStudents = async (req, res) => {
  try {
    const { scholarship_id, student_ids, note } = req.body;

    // Get donor linked to this scholarship
    const { data: scholarship } = await supabase
      .from('scholarships')
      .select('donor_id')
      .eq('id', scholarship_id)
      .single();

    if (!scholarship) {
      return res.status(404).json({ error: 'Scholarship not found' });
    }

    // Build insert rows
    const rows = student_ids.map(student_id => ({
      donor_id: scholarship.donor_id,
      scholarship_id,
      application_id: student_id,
      note: note || null,
      assigned_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('donor_students')
      .upsert(rows, { onConflict: 'donor_id,scholarship_id,application_id' })
      .select();

    if (error) throw error;
    res.status(201).json({ message: `${rows.length} student(s) assigned successfully.`, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getScholarshipForAssignment, assignStudents };
