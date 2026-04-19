import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile()
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile()
      else { setProfile(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile() {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        setProfile(null)
        return
      }

      const response = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const payload = await response.json()

      if (!response.ok) {
        setProfile(null)
        return
      }

      setProfile(payload?.user ?? null)
    } catch {
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  function getDashboardPath(role) {
    if (role === 'donor') return '/donor/dashboard'
    if (role === 'admin') return '/admin/dashboard'
    return '/dashboard'// Default for "student"
  }
  //MAIL_REGEX checks email format.
  //PASSWORD_MIN_LENGTH enforces minimum password length as 8.
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const PASSWORD_MIN_LENGTH = 8
  const ALLOWED_METADATA_FIELDS = [
    'full_name',
    'role',
    'registration_no',
    'batch',
    'phone',
    'org_name',
    'address',
    'staff_id',
    'department'
  ]

  function validateEmail(email) {
    if (typeof email !== 'string') {
      throw new Error('Email is required.')
    }
// Trim whitespace and validate format
    const normalizedEmail = email.trim()
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      throw new Error('Please enter a valid email address.')
    }

    return normalizedEmail
  }

  function validatePassword(password) {
    if (typeof password !== 'string') {
      throw new Error('Password is required.')
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
      throw new Error(`Password must be at least ${PASSWORD_MIN_LENGTH} characters long.`)
    }

    return password
  }
// validateMetadata checks that metadata is an object with allowed fields, and that all values are strings. It also trims whitespace and ignores empty values.
  function validateMetadata(metadata) {
    if (metadata == null) return {}

    if (typeof metadata !== 'object' || Array.isArray(metadata)) {
      throw new Error('Metadata must be an object.')
    }

    const sanitizedMetadata = {}

    for (const [key, value] of Object.entries(metadata)) {
      if (!ALLOWED_METADATA_FIELDS.includes(key)) {
        throw new Error(`Unexpected metadata field: ${key}`)
      }

      if (value == null || value === '') continue

      if (typeof value !== 'string') {
        throw new Error(`Metadata field "${key}" must be a string.`)
      }

      sanitizedMetadata[key] = value.trim()
    }

    return sanitizedMetadata
  }

  async function signUp(email, password, metadata) {
    // 2. It runs validation checks
    const validatedEmail = validateEmail(email)
    const validatedPassword = validatePassword(password)
    const validatedMetadata = buildExtraInfo(validateMetadata(metadata))
// 4. It passes everything to the internal registerUser function
    return registerUser({
      email: validatedEmail,
      password: validatedPassword,
      metadata: validatedMetadata
    })
  }

  function buildExtraInfo(metadata = {}) {
    const info = {}
    if (metadata.full_name)       info.full_name       = metadata.full_name
    if (metadata.role)            info.role            = metadata.role
    if (metadata.registration_no) info.registration_no = metadata.registration_no
    if (metadata.batch)           info.batch           = metadata.batch
    if (metadata.phone)           info.phone           = metadata.phone
    if (metadata.org_name)        info.org_name        = metadata.org_name
    if (metadata.address)         info.address         = metadata.address
    if (metadata.staff_id)        info.staff_id        = metadata.staff_id
    if (metadata.department)      info.department      = metadata.department
    return info
  }

  async function signIn(email, password) {
    const res = await loginUser(email, password)

    await supabase.auth.setSession({
      access_token: res.token,
      refresh_token: res.refresh_token
    })

    return res
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut, getDashboardPath }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

// Signup via backend API
async function registerUser(data) {
  // Uses the browser's fetch API to make a network request
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)// Converts the JS object into a JSON string
  })

  const payload = await response.json()
  // Checks if the backend sent back an error status (like 400 or 500)
  if (!response.ok) {
    const message = payload?.error || payload?.message || `Registration failed (status ${response.status}).`
    throw new Error(message) // If there was an error, we throw a JavaScript Error with a message from the backend (or a default one). This will be caught in the UI and displayed to the user.catch block
  }

  return payload
}

async function loginUser(email, password) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })

  const payload = await response.json()

  if (!response.ok) {
    const message = payload?.error || payload?.message || `Login failed (status ${response.status}).`
    throw new Error(message)
  }

  return payload
}
