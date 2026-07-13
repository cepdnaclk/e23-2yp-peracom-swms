import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { query } from '../config/db.js'

const router = express.Router()

const signToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' })

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' })

    const result = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()])
    const user = result.rows[0]
    if (!user) return res.status(401).json({ message: 'Invalid email or password' })

    const match = await bcrypt.compare(password, user.password_hash)
    if (!match) return res.status(401).json({ message: 'Invalid email or password' })

    const token = signToken(user)
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

// POST /api/auth/register/student
router.post('/register/student', async (req, res) => {
  try {
    const {
  name,
  email,
  password,
  phone,
  department,
  batch,
  registration_number
} = req.body

if (!name || !email || !password || !phone) {
  return res.status(400).json({
    message: 'Name, email, password, and phone number are required'
  })
}

const sriLankanPhonePattern = /^07\d{8}$/

if (!sriLankanPhonePattern.test(phone)) {
  return res.status(400).json({
    message: 'Phone number must contain 10 digits and start with 07'
  })
}

    const exists = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()])
    if (exists.rows.length) return res.status(409).json({ message: 'Email already registered' })

    const hash = await bcrypt.hash(password, 12)
    const result = await query(
      `INSERT INTO users (name, email, password_hash, role, status, phone, department, batch, registration_number)
       VALUES ($1, $2, $3, 'student', 'pending_approval', $4, $5, $6, $7) RETURNING id, name, email, role, status`,
      [name.trim(), email.toLowerCase().trim(), hash, phone || null, department || null, batch || null, registration_number || null]
    )
    res.status(201).json({ message: 'Registered successfully. Await admin approval.', user: result.rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

// POST /api/auth/register/donor
router.post('/register/donor', async (req, res) => {
  try {
    const { name, email, password, phone, organization, address } = req.body
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email, and password required' })

    const exists = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()])
    if (exists.rows.length) return res.status(409).json({ message: 'Email already registered' })

    const hash = await bcrypt.hash(password, 12)
    const result = await query(
      `INSERT INTO users (name, email, password_hash, role, status, phone, organization, address)
       VALUES ($1, $2, $3, 'donor', 'pending_approval', $4, $5, $6) RETURNING id, name, email, role, status`,
      [
  name.trim(),
  email.toLowerCase().trim(),
  hash,
  phone.trim(),
  department || null,
  batch || null,
  registration_number || null
]
    )
    res.status(201).json({ message: 'Registered successfully. Await admin approval.', user: result.rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  // In production, send email with reset link
  // For now, always return success to avoid email enumeration
  res.json({ message: 'If that email exists, a reset link has been sent.' })
})

export default router
