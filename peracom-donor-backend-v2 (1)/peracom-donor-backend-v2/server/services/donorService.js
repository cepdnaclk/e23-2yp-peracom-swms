import supabase from '../config/supabaseClient.js';
import { hashPassword, comparePassword } from '../utils/hashPassword.js';

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isMissingColumnError(error) {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('column') && message.includes('does not exist');
}

function isMissingTableError(error) {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('relation') && message.includes('does not exist');
}

async function getUserByEmail(email) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', normalizeEmail(email))
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function registerDonorAccount(payload) {
  const existing = await getUserByEmail(payload.email);
  if (existing) {
    return { status: 409, body: { message: 'Email already exists' } };
  }

  const password_hash = await hashPassword(payload.password);

  const { data: user, error: userError } = await supabase
    .from('users')
    .insert({
      full_name: payload.full_name.trim(),
      email: normalizeEmail(payload.email),
      password_hash,
      role: 'donor',
    })
    .select('id, full_name, email, role, created_at')
    .single();

  if (userError) throw userError;

  const { data: donor, error: donorError } = await supabase
    .from('donors')
    .insert({
      user_id: user.id,
      phone: payload.phone?.trim() || null,
      address: payload.address?.trim() || null,
      organization_name: payload.organization_name?.trim() || null,
    })
    .select('*')
    .single();

  if (donorError) {
    await supabase.from('users').delete().eq('id', user.id);
    throw donorError;
  }

  return {
    status: 201,
    body: {
      message: 'Donor registered successfully',
      user,
      donor,
    },
  };
}

export async function loginDonorAccount(email, password) {
  const user = await getUserByEmail(email);

  if (!user || user.role !== 'donor') {
    return { status: 401, body: { message: 'Invalid donor credentials' } };
  }

  const passwordMatched = await comparePassword(password, user.password_hash);
  if (!passwordMatched) {
    return { status: 401, body: { message: 'Invalid donor credentials' } };
  }

  const { data: donor, error: donorError } = await supabase
    .from('donors')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (donorError) throw donorError;

  return {
    status: 200,
    body: {
      message: 'Donor login successful',
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
      },
      donor,
    },
  };
}

export async function getDonorByUserId(userId) {
  const { data, error } = await supabase
    .from('donors')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getDashboardData(userId) {
  const donor = await getDonorByUserId(userId);
  if (!donor) {
    return { status: 404, body: { message: 'Donor profile not found' } };
  }

  const [scholarshipsRes, assignmentsRes, notificationsRes] = await Promise.all([
    supabase.from('scholarship_requests').select('*', { count: 'exact' }).eq('donor_id', donor.id),
    supabase.from('donor_student_assignments').select('*', { count: 'exact' }).eq('donor_id', donor.id),
    supabase.from('notifications').select('*').eq('user_id', userId),
  ]);

  if (scholarshipsRes.error) throw scholarshipsRes.error;
  if (assignmentsRes.error) throw assignmentsRes.error;
  if (notificationsRes.error) throw notificationsRes.error;

  const assignments = assignmentsRes.data || [];
  const studentIds = assignments.map((item) => item.student_id).filter(Boolean);

  let progressUpdates = [];
  if (studentIds.length > 0) {
    const { data, error } = await supabase
      .from('progress_updates')
      .select('*')
      .in('student_id', studentIds)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;
    progressUpdates = data || [];
  }

  return {
    status: 200,
    body: {
      donor,
      counts: {
        supported_scholarships: scholarshipsRes.count || 0,
        supported_students: assignmentsRes.count || 0,
      },
      latest_progress_updates: progressUpdates,
      notifications: notificationsRes.data || [],
    },
  };
}

export async function getScholarshipsForDonor(userId) {
  const donor = await getDonorByUserId(userId);
  if (!donor) {
    return { status: 404, body: { message: 'Donor profile not found' } };
  }

  const { data, error } = await supabase
    .from('scholarship_requests')
    .select('*')
    .eq('donor_id', donor.id);

  if (error) throw error;

  return {
    status: 200,
    body: {
      message: 'Using scholarship_requests as scholarships until a separate scholarships table is added',
      scholarships: data || [],
    },
  };
}

export async function createScholarshipRequestForDonor(userId, payload) {
  const donor = await getDonorByUserId(userId);
  if (!donor) {
    return { status: 404, body: { message: 'Donor profile not found' } };
  }

  const coreInsert = {
    donor_id: donor.id,
    title: payload.title.trim(),
    description: payload.description.trim(),
    funding_amount: Number(payload.funding_amount),
    status: payload.status || 'pending',
  };

  const extendedInsert = {
    ...coreInsert,
    eligibility: payload.eligibility || null,
    deadline: payload.deadline || null,
    required_documents: payload.required_documents || null,
  };

  let response = await supabase.from('scholarship_requests').insert(extendedInsert).select('*').single();

  if (response.error && isMissingColumnError(response.error)) {
    response = await supabase.from('scholarship_requests').insert(coreInsert).select('*').single();
  }

  if (response.error) throw response.error;

  return {
    status: 201,
    body: {
      message: 'Scholarship request submitted successfully',
      scholarship_request: response.data,
    },
  };
}

export async function listScholarshipRequestsForDonor(userId) {
  const donor = await getDonorByUserId(userId);
  if (!donor) {
    return { status: 404, body: { message: 'Donor profile not found' } };
  }

  const { data, error } = await supabase
    .from('scholarship_requests')
    .select('*')
    .eq('donor_id', donor.id);

  if (error) throw error;

  return {
    status: 200,
    body: {
      scholarship_requests: data || [],
    },
  };
}

export async function listApprovedStudentsForDonor(userId, filters = {}) {
  const donor = await getDonorByUserId(userId);
  if (!donor) {
    return { status: 404, body: { message: 'Donor profile not found' } };
  }

  const { data: assignments, error: assignmentsError } = await supabase
    .from('donor_student_assignments')
    .select('*')
    .eq('donor_id', donor.id);

  if (assignmentsError) throw assignmentsError;

  const studentIds = (assignments || []).map((item) => item.student_id).filter(Boolean);
  if (studentIds.length === 0) {
    return { status: 200, body: { students: [] } };
  }

  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('*')
    .in('id', studentIds);

  if (studentsError) throw studentsError;

  const userIds = (students || []).map((item) => item.user_id).filter(Boolean);
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, full_name, email')
    .in('id', userIds);

  if (usersError) throw usersError;

  const usersMap = new Map((users || []).map((user) => [user.id, user]));
  const assignmentsMap = new Map((assignments || []).map((row) => [row.student_id, row]));

  let results = (students || []).map((student) => ({
    ...student,
    student_name: usersMap.get(student.user_id)?.full_name || null,
    student_email: usersMap.get(student.user_id)?.email || null,
    assignment_status: assignmentsMap.get(student.id)?.status || null,
  }));

  if (filters.search) {
    const q = String(filters.search).trim().toLowerCase();
    results = results.filter((item) => {
      return (
        String(item.student_name || '').toLowerCase().includes(q) ||
        String(item.registration_no || '').toLowerCase().includes(q)
      );
    });
  }

  if (filters.batch) {
    results = results.filter((item) => String(item.batch || '') === String(filters.batch));
  }

  return { status: 200, body: { students: results } };
}

export async function getApprovedStudentProfile(userId, studentId) {
  const donor = await getDonorByUserId(userId);
  if (!donor) {
    return { status: 404, body: { message: 'Donor profile not found' } };
  }

  const { data: assignment, error: assignmentError } = await supabase
    .from('donor_student_assignments')
    .select('*')
    .eq('donor_id', donor.id)
    .eq('student_id', studentId)
    .maybeSingle();

  if (assignmentError) throw assignmentError;
  if (!assignment) {
    return { status: 404, body: { message: 'Student is not assigned to this donor' } };
  }

  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('*')
    .eq('id', studentId)
    .maybeSingle();

  if (studentError) throw studentError;
  if (!student) {
    return { status: 404, body: { message: 'Student not found' } };
  }

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, full_name, email')
    .eq('id', student.user_id)
    .maybeSingle();

  if (userError) throw userError;

  const { data: updates, error: updatesError } = await supabase
    .from('progress_updates')
    .select('*')
    .eq('student_id', student.id)
    .order('created_at', { ascending: false })
    .limit(5);

  if (updatesError) throw updatesError;

  return {
    status: 200,
    body: {
      profile: {
        id: student.id,
        registration_no: student.registration_no,
        batch: student.batch,
        name: user?.full_name || null,
        email: user?.email || null,
        donor_support_status: assignment.status,
        scholarship_details: null,
        verified_documents: [],
        recent_progress_updates: updates || [],
      },
      note: 'scholarship_details and verified_documents need extra tables/columns to be returned fully',
    },
  };
}

export async function listProgressUpdatesForDonor(userId, filters = {}) {
  const donor = await getDonorByUserId(userId);
  if (!donor) {
    return { status: 404, body: { message: 'Donor profile not found' } };
  }

  const { data: assignments, error: assignmentError } = await supabase
    .from('donor_student_assignments')
    .select('student_id')
    .eq('donor_id', donor.id);

  if (assignmentError) throw assignmentError;

  const studentIds = (assignments || []).map((item) => item.student_id).filter(Boolean);
  if (studentIds.length === 0) {
    return { status: 200, body: { progress_updates: [] } };
  }

  let query = supabase
    .from('progress_updates')
    .select('*')
    .in('student_id', studentIds)
    .order('created_at', { ascending: false });

  if (filters.student_id) {
    query = query.eq('student_id', filters.student_id);
  }

  const { data: updates, error: updatesError } = await query;
  if (updatesError) throw updatesError;

  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('id, user_id, registration_no, batch')
    .in('id', studentIds);

  if (studentsError) throw studentsError;

  const userIds = (students || []).map((item) => item.user_id).filter(Boolean);
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, full_name')
    .in('id', userIds);

  if (usersError) throw usersError;

  const studentsMap = new Map((students || []).map((row) => [row.id, row]));
  const usersMap = new Map((users || []).map((row) => [row.id, row]));

  const result = (updates || []).map((update) => {
    const student = studentsMap.get(update.student_id);
    const studentUser = student ? usersMap.get(student.user_id) : null;

    return {
      ...update,
      student_name: studentUser?.full_name || null,
      registration_no: student?.registration_no || null,
      batch: student?.batch || null,
    };
  });

  return { status: 200, body: { progress_updates: result } };
}

export async function getProgressUpdateForDonor(userId, progressUpdateId) {
  const donor = await getDonorByUserId(userId);
  if (!donor) {
    return { status: 404, body: { message: 'Donor profile not found' } };
  }

  const { data: update, error: updateError } = await supabase
    .from('progress_updates')
    .select('*')
    .eq('id', progressUpdateId)
    .maybeSingle();

  if (updateError) throw updateError;
  if (!update) {
    return { status: 404, body: { message: 'Progress update not found' } };
  }

  const { data: assignment, error: assignmentError } = await supabase
    .from('donor_student_assignments')
    .select('*')
    .eq('donor_id', donor.id)
    .eq('student_id', update.student_id)
    .maybeSingle();

  if (assignmentError) throw assignmentError;
  if (!assignment) {
    return { status: 403, body: { message: 'This progress update does not belong to the logged-in donor' } };
  }

  return { status: 200, body: { progress_update: update } };
}

export async function createIssueForDonor(userId, payload) {
  const donor = await getDonorByUserId(userId);
  if (!donor) {
    return { status: 404, body: { message: 'Donor profile not found' } };
  }

  const coreInsert = {
    donor_id: donor.id,
    category: payload.category,
    description: payload.description.trim(),
    status: payload.status || 'open',
  };

  const extendedInsert = {
    ...coreInsert,
    attachment_url: payload.attachment_url || null,
  };

  let response = await supabase.from('issue_reports').insert(extendedInsert).select('*').single();

  if (response.error && isMissingColumnError(response.error)) {
    response = await supabase.from('issue_reports').insert(coreInsert).select('*').single();
  }

  if (response.error) throw response.error;

  return {
    status: 201,
    body: {
      message: 'Issue submitted successfully',
      issue: response.data,
      note: payload.attachment_url ? 'attachment_url is saved only if that column exists in your schema' : undefined,
    },
  };
}

export async function listIssuesForDonor(userId) {
  const donor = await getDonorByUserId(userId);
  if (!donor) {
    return { status: 404, body: { message: 'Donor profile not found' } };
  }

  const { data, error } = await supabase
    .from('issue_reports')
    .select('*')
    .eq('donor_id', donor.id);

  if (error) throw error;

  return { status: 200, body: { issues: data || [] } };
}

export async function listNotificationsForDonor(userId) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;

  return { status: 200, body: { notifications: data || [] } };
}

export async function listAnnouncements() {
  const { data, error } = await supabase.from('announcements').select('*');

  if (error) {
    if (isMissingTableError(error)) {
      return {
        status: 200,
        body: {
          announcements: [],
          note: 'announcements table is not created yet',
        },
      };
    }
    throw error;
  }

  return { status: 200, body: { announcements: data || [] } };
}
