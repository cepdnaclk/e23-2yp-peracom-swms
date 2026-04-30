import { supabase, supabaseAdmin } from '../config/supabaseClient.js'

export const registerUser = async (req, res) => {
  // 1. Extract details sent by the frontend
  const { email, password, metadata } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  // 2. Check Supabase Auth for existing email (confirmed or not)
  const { data: userList, error: userListError } = await supabaseAdmin.auth.admin.listUsers();
  if (userListError) {
    console.error(userListError);
    return res.status(500).json({ error: 'Error checking for existing user.' });
  }
  const existingUser = userList.users.find(u => u.email === email);
  if (existingUser) {
    return res.status(400).json({ error: 'This email is already registered. Please check your email for a confirmation link or log in.' });
  }

  // 3. Check profiles table for pending/approved email
  const { data: profileRows, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, email, status')
    .eq('email', email)
    .in('status', ['pending_approval', 'approved']);
  if (profileError) {
    console.error(profileError);
    return res.status(500).json({ error: 'Error checking for existing user profile.' });
  }
  if (profileRows && profileRows.length > 0) {
    return res.status(400).json({ error: 'This email is already registered and pending approval or already approved.' });
  }

  // 4. Proceed with sign up
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata || {}
    }
  });
  if (authError) {
    return res.status(400).json({ error: authError.message });
  }

  const role = metadata?.role || authData.user.user_metadata?.role || 'student';
  const fullName = authData.user.user_metadata?.full_name || metadata?.full_name || null;
  const status = 'pending_approval';
  const extraInfo = metadata && typeof metadata === 'object' ? metadata : {};

  // 5. Save this specific user data into the "profiles" table
  const { error: profileInsertError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: authData.user.id, // Links this row to their login credentials
      email: authData.user.email,
      full_name: fullName,
      role,
      status, // Saved as 'pending_approval'
      extra_info: extraInfo
    }, { onConflict: 'id' });

  if (profileInsertError) {
    console.error(profileInsertError);
    return res.status(500).json({ error: 'Failed to create user profile.' });
  }

  return res.status(201).json({
    message: 'Registration successful! Please check your email to verify your account.',
    user: {
      id: authData.user.id,
      email: authData.user.email,
      full_name: fullName,
      role
    }
  });
}

export const loginUser = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' })
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return res.status(401).json({ error: 'Invalid email or password.' })
  }

  if (!data.user?.email_confirmed_at) {
    return res.status(403).json({ error: 'Please confirm your email before logging in.' })
  }

  // Debug log for user ID being used
  console.log('Looking up profile for user ID:', data.user.id)
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('status, role, full_name, email')
    .eq('id', data.user.id)
    .single()

  // Debug log for troubleshooting approval issues
  console.log('Fetched profile for login:', profile)

  if (!profile || profile.status !== 'approved') {
    return res.status(403).json({ error: 'Your account is pending admin approval.' })
  }

  const role = profile.role || data.user?.user_metadata?.role || 'student'

  return res.status(200).json({
    message: 'Login successful.',
    token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    user: {
      id: data.user.id,
      email: profile.email || data.user.email,
      full_name: profile.full_name || data.user.user_metadata?.full_name,
      role
    }
  })
}

export const logoutUser = async (req, res) => {
  const { error } = await supabase.auth.signOut()

  if (error) {
    return res.status(500).json({ error: 'Logout failed.' })
  }

  return res.status(200).json({ message: 'Logged out successfully.' })
}

export const getMe = async (req, res) => {
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', req.user.id)
    .single()

  if (error) {
    return res.status(404).json({ error: 'Profile not found.' })
  }

  return res.status(200).json({ user: profile })
}
