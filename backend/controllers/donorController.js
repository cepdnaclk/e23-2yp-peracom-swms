import { supabaseAdmin } from '../config/supabaseClient.js'

export const getDonorApplications = async (req, res) => {
  const donorId = req.user.id

  // First, get all scholarship IDs owned by this donor
  const { data: scholarships, error: errSch } = await supabaseAdmin
    .from('scholarships')
    .select('id')
    .eq('donor_id', donorId)

  if (errSch) {
    return res.status(500).json({ error: 'Failed to find your scholarships.' })
  }

  const schIds = scholarships.map(s => s.id)

  if (schIds.length === 0) {
    return res.status(200).json({ count: 0, applications: [] })
  }

  const { data, error } = await supabaseAdmin
    .from('applications')
    .select(`*`)
    .in('scholarship_id', schIds)
    // Only show them apps the admin has forwarded (admin_approved), or apps they have already processed
    .in('status', ['admin_approved', 'awarded', 'rejected'])
    .order('id', { ascending: true })

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch donor applications.' })
  }

  let applications = data || []
  
  // Manual joins
  const studentIds = [...new Set(applications.map(a => a.student_id).filter(Boolean))]

  let profilesMap = {}
  let scholarshipsMap = {}

  if (studentIds.length > 0) {
    const { data: profs } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email')
      .in('id', studentIds)
    profilesMap = Object.fromEntries((profs || []).map(p => [p.id, p]))
  }

  if (schIds.length > 0) {
    const { data: schs } = await supabaseAdmin
      .from('scholarships')
      .select('id, title, donor_name')
      .in('id', schIds)
    scholarshipsMap = Object.fromEntries((schs || []).map(s => [s.id, s]))
  }

  applications = applications.map(app => {
    // Robust normalization for JSONB column types that might be stored as string, array of strings, or objects
    const parseField = (val) => {
      if (!val) return {};
      let parsed = Array.isArray(val) ? val[0] : val;
      if (typeof parsed === 'string') {
        try { parsed = JSON.parse(parsed); } catch (e) { return {}; }
      }
      return parsed || {};
    };

    const personalInfo = parseField(app.personal_info);
    const academicInfo = parseField(app.academic_info);
    const financialInfo = parseField(academicInfo.financial_info);
    const normalizedAcademicInfo = {
      ...academicInfo,
      full_name: personalInfo.full_name || academicInfo.full_name || null,
      student_id: personalInfo.student_id || academicInfo.student_id || null,
      monthly_household_income: financialInfo.monthly_household_income || academicInfo.monthly_household_income || null,
      parent_occupation: financialInfo.parent_occupation || academicInfo.parent_occupation || null,
      dependents: financialInfo.dependents || academicInfo.dependents || null,
      financial_info: financialInfo
    };
    
    // Safely structure document URLs flatly into a key-URL dictionary for the UI
    let docArr = Array.isArray(app.document_urls) ? app.document_urls : [];
    if (typeof docArr === 'string') {
        try { docArr = JSON.parse(docArr); } catch(e) {}
    }
    // Handle nested stringified arrays if any
    if (Array.isArray(docArr)) {
        docArr = docArr.map(d => {
            if (typeof d === 'string') {
                try { return JSON.parse(d); } catch(e) { return null; }
            }
            return d;
        }).filter(Boolean);
    }
    if (!Array.isArray(docArr)) docArr = [docArr];
    
    const docs = {};
    docArr.flat(Infinity).forEach(d => {
       if (d && d.type && d.url) {
          docs[`${d.type}_url`] = d.url;
       }
    });

    return {
      ...app,
      profiles: profilesMap[app.student_id] || null,
      scholarships: scholarshipsMap[app.scholarship_id] || null,
      personal_info: personalInfo,
      student_info: personalInfo,
      academic_info: normalizedAcademicInfo,
      financial_info: financialInfo,
      document_urls: Object.keys(docs).length > 0 ? docs : docArr
    }
  })

  return res.status(200).json({ count: applications.length, applications: applications })
}

export const updateApplicationByDonor = async (req, res) => {
  const { id } = req.params
  const { status, donor_feedback } = req.body
  const donorId = req.user.id

  if (!['awarded', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status value. Must be awarded or rejected.' })
  }

  // Verify the application belongs to a scholarship owned by this donor
  const { data: currentApp, error: fetchErr } = await supabaseAdmin
    .from('applications')
    .select('scholarship_id, scholarships(donor_id)')
    .eq('id', id)
    .single()

  if (fetchErr || !currentApp) {
    return res.status(404).json({ error: 'Application not found.' })
  }

  if (currentApp.scholarships.donor_id !== donorId) {
    return res.status(403).json({ error: 'You are not authorized to update this application.' })
  }

  const { data: application, error } = await supabaseAdmin
    .from('applications')
    .update({ status })
    .eq('id', id)
    .select('id, student_id, scholarships(title)')
    .single()

  if (error || !application) {
    return res.status(500).json({ error: 'Update failed.' })
  }

  let notifyMessage = ''
  if (status === 'awarded') notifyMessage = `🎉 Fantastic news! The Donor has AWADRED you the "${application.scholarships?.title}" scholarship! Check your dashboard for details.`
  if (status === 'rejected') notifyMessage = `Update from Donor: Your application for "${application.scholarships?.title}" was conditionally REJECTED.`

  await supabaseAdmin.from('notifications').insert({
    user_id: application.student_id,
    message: notifyMessage
  })

  return res.status(200).json({
    message: `Application updated to ${status} and student notified.`,
    application
  })
}
