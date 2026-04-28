// controllers/assignmentController.js
const supabase = require('../config/supabase');

// GET /api/assignments/scholarship/:id
const getScholarshipForAssignment = async (req, res) => {
  try {
    const scholarshipId = req.params.id;

    // 1. Get scholarship
    const { data: scholarship, error: sErr } = await supabase
      .from('scholarships')
      .select('*')
      .eq('id', scholarshipId)
      .single();
    if (sErr) throw sErr;

    // 2. Get donor
    let donor = null;
    if (scholarship.donor_id) {
      const { data: donorData } = await supabase
        .from('donors')
        .select('id, name, organization')
        .eq('id', scholarship.donor_id)
        .single();
      donor = donorData;
    }

    // 3. Get approved students — try scholarship_id first, fallback to scholarship_title
    let approvedStudents = [];

    const { data: byId } = await supabase
      .from('applications')
      .select('id, student_name, registration_number, batch, gpa, department, status, scholarship_id, scholarship_title')
      .eq('scholarship_id', scholarshipId)
      .eq('status', 'Approved');

    if (byId && byId.length > 0) {
      approvedStudents = byId;
    } else {
      // Fallback: match by scholarship title
      const { data: byTitle } = await supabase
        .from('applications')
        .select('id, student_name, registration_number, batch, gpa, department, status, scholarship_id, scholarship_title')
        .eq('scholarship_title', scholarship.title)
        .eq('status', 'Approved');

      approvedStudents = byTitle || [];

      // Auto-fix: update scholarship_id on these records
      if (approvedStudents.length > 0) {
        const ids = approvedStudents.map(s => s.id);
        await supabase
          .from('applications')
          .update({ scholarship_id: scholarshipId })
          .in('id', ids);
      }
    }

    // 4. Get already assigned IDs
    const { data: assigned } = await supabase
      .from('donor_students')
      .select('application_id')
      .eq('scholarship_id', scholarshipId);

    const assignedIds = (assigned || []).map(a => a.application_id);

    // 5. Mark already assigned
    const studentsWithFlag = approvedStudents.map(s => ({
      ...s,
      already_assigned: assignedIds.includes(s.id),
    }));

    res.json({
      scholarship,
      donor,
      approvedStudents:     studentsWithFlag,
      alreadyAssignedCount: assignedIds.length,
      totalApprovedCount:   studentsWithFlag.length,
    });

  } catch (error) {
    console.error('getScholarshipForAssignment error:', error);
    res.status(500).json({ error: error.message });
  }
};

// POST /api/assignments
const assignStudents = async (req, res) => {
  try {
    const { scholarship_id, student_ids, note } = req.body;

    if (!scholarship_id)                        return res.status(400).json({ error: 'scholarship_id is required' });
    if (!student_ids || student_ids.length === 0) return res.status(400).json({ error: 'No students selected' });

    // Get donor
    const { data: scholarship, error: sErr } = await supabase
      .from('scholarships')
      .select('donor_id')
      .eq('id', scholarship_id)
      .single();

    if (sErr || !scholarship) return res.status(404).json({ error: 'Scholarship not found' });
    if (!scholarship.donor_id) return res.status(400).json({ error: 'No donor linked to this scholarship' });

    // Build rows
    const rows = student_ids.map(application_id => ({
      donor_id:       scholarship.donor_id,
      scholarship_id,
      application_id,
      note:           note || null,
      assigned_at:    new Date().toISOString(),
    }));

    const { data, error: insertErr } = await supabase
      .from('donor_students')
      .upsert(rows, { onConflict: 'donor_id,scholarship_id,application_id' })
      .select();

    if (insertErr) throw insertErr;

    res.status(201).json({
      message:  `${rows.length} student(s) assigned successfully`,
      assigned: data,
    });

  } catch (error) {
    console.error('assignStudents error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getScholarshipForAssignment, assignStudents };
