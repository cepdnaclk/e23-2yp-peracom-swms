// ============================================================
// FILE 1: backend/controllers/assignmentController.js
// ============================================================

const supabase = require('../config/supabase');

// ── GET /api/assignments/scholarship/:id ─────────────────────
// Loads scholarship + donor + approved students for assign page
const getScholarshipForAssignment = async (req, res) => {
  try {
    const scholarshipId = req.params.id;
    console.log('Loading assignment data for scholarship:', scholarshipId);

    // 1. Get scholarship details
    const { data: scholarship, error: schErr } = await supabase
      .from('scholarships')
      .select('*')
      .eq('id', scholarshipId)
      .single();

    if (schErr || !scholarship) {
      return res.status(404).json({ error: 'Scholarship not found' });
    }

    // 2. Get linked donor
    let donor = null;
    if (scholarship.donor_id) {
      const { data: donorData } = await supabase
        .from('donors')
        .select('id, name, organization, email')
        .eq('id', scholarship.donor_id)
        .single();
      donor = donorData;
    }

    // 3. Get approved applications
    // Try by scholarship_id first
    let { data: approvedStudents } = await supabase
      .from('applications')
      .select('id, student_name, registration_number, batch, gpa, department, status, scholarship_id, scholarship_title')
      .eq('scholarship_id', scholarshipId)
      .eq('status', 'Approved');

    // Fallback: match by scholarship title if scholarship_id is null
    if (!approvedStudents || approvedStudents.length === 0) {
      console.log('No students found by ID, trying by title:', scholarship.title);
      const { data: byTitle } = await supabase
        .from('applications')
        .select('id, student_name, registration_number, batch, gpa, department, status, scholarship_id, scholarship_title')
        .eq('scholarship_title', scholarship.title)
        .eq('status', 'Approved');

      approvedStudents = byTitle || [];

      // Auto fix: update scholarship_id on found records
      if (approvedStudents.length > 0) {
        const ids = approvedStudents.map(s => s.id);
        await supabase
          .from('applications')
          .update({ scholarship_id: scholarshipId })
          .in('id', ids);
        console.log('Auto-fixed scholarship_id for', ids.length, 'applications');
      }
    }

    console.log('Approved students found:', approvedStudents.length);

    // 4. Get already assigned application IDs
    const { data: alreadyAssigned } = await supabase
      .from('donor_students')
      .select('application_id')
      .eq('scholarship_id', scholarshipId);

    const assignedIds = (alreadyAssigned || []).map(a => a.application_id);

    // 5. Mark each student as already assigned or not
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

// ── POST /api/assignments ────────────────────────────────────
// Assigns selected students to the donor of a scholarship
const assignStudents = async (req, res) => {
  try {
    const { scholarship_id, student_ids, note } = req.body;

    console.log('Assigning students:', { scholarship_id, student_ids, note });

    // Validate input
    if (!scholarship_id) {
      return res.status(400).json({ error: 'scholarship_id is required' });
    }
    if (!student_ids || student_ids.length === 0) {
      return res.status(400).json({ error: 'No students selected' });
    }

    // Get donor linked to this scholarship
    const { data: scholarship, error: schErr } = await supabase
      .from('scholarships')
      .select('id, title, donor_id')
      .eq('id', scholarship_id)
      .single();

    if (schErr || !scholarship) {
      return res.status(404).json({ error: 'Scholarship not found' });
    }
    if (!scholarship.donor_id) {
      return res.status(400).json({ error: 'No donor linked to this scholarship. Please link a donor first.' });
    }

    // Build insert rows
    const rows = student_ids.map(application_id => ({
      donor_id:       scholarship.donor_id,
      scholarship_id: scholarship_id,
      application_id: application_id,
      note:           note || null,
      assigned_at:    new Date().toISOString(),
    }));

    console.log('Inserting rows:', rows.length);

    // Upsert to avoid duplicate assignments
    const { data, error: insertErr } = await supabase
      .from('donor_students')
      .upsert(rows, { onConflict: 'donor_id,scholarship_id,application_id' })
      .select();

    if (insertErr) {
      console.error('Insert error:', insertErr);
      throw insertErr;
    }

    console.log('Assignment successful:', data?.length, 'records');

    res.status(201).json({
      message:  `${rows.length} student(s) assigned to donor successfully`,
      assigned: data,
    });

  } catch (error) {
    console.error('assignStudents error:', error);
    res.status(500).json({ error: error.message });
  }
};

// ── GET /api/assignments/donor/:donor_id ─────────────────────
// Get all students assigned to a specific donor
const getAssignedStudentsByDonor = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('donor_students')
      .select(`
        id,
        assigned_at,
        note,
        applications (
          id, student_name, registration_number,
          batch, department, gpa, status, email
        ),
        scholarships (
          id, title, funding_amount
        )
      `)
      .eq('donor_id', req.params.donor_id);

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getScholarshipForAssignment,
  assignStudents,
  getAssignedStudentsByDonor,
};
