import { supabase, supabaseAdmin } from '../config/supabaseClient.js'

export const registerUser = async (req, res) => {
   // 1. It extracts the details sent by the frontend
  const { email, password, metadata } = req.body
// 2. A quick safety check: did the frontend actually send the email and password?
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' })
  }
// it tells Supabase to create the user's login credentials. 
// The metadata is also sent to Supabase, which will store it in the user's profile and also make it available in the JWT token. 
// This way, we can easily access the user's role and other info without needing to query the database every time.
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata || {}
    }
  })
 // 4. Did Supabase reject it? (e.g., Email already taking)
  if (authError) {
    return res.status(400).json({ error: authError.message })
  }

  const role = metadata?.role || authData.user.user_metadata?.role || 'student'
  const fullName = authData.user.user_metadata?.full_name || metadata?.full_name || null
  const status = 'pending_approval'
  const extraInfo = metadata && typeof metadata === 'object' ? metadata : {}


// 7. Save this specific user data into the "profiles" table
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: authData.user.id,// Links this row to their login credentials
      email: authData.user.email,
      full_name: fullName,
      role,
      status, // Saved as 'pending_approval'
      extra_info: extraInfo
    }, { onConflict: 'id' })

  if (profileError) {
    return res.status(500).json({ error: 'Failed to create user profile.' })
  }
// 9. Send a "201 Created" success signal back to AuthContext.jsx, 
// along with some user info (except password!)h.
//  The frontend can use this info to show a success message or redirect the user.
// reigster user function in uath context expects response


  return res.status(201).json({
    message: 'Registration successful! Please check your email to verify your account.',
    user: {
      id: authData.user.id,
      email: authData.user.email,
      full_name: fullName,
      role
    }
  })
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

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('status, role, full_name, email')
    .eq('id', data.user.id)
    .single()

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
