import jwt from 'jsonwebtoken'
import { query } from '../config/db.js'

export const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' })
    }
    const token = header.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const result = await query('SELECT id, name, email, role, status FROM users WHERE id = $1', [decoded.id])
    if (!result.rows.length) return res.status(401).json({ message: 'User not found' })
    const user = result.rows[0]
    if (user.status === 'suspended') return res.status(403).json({ message: 'Account suspended' })
    req.user = user
    next()
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}

export const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({ message: 'Access denied' })
  }
  next()
}

export const requireAdmin = requireRole('admin')
export const requireStudent = requireRole('student')
export const requireDonor = requireRole('donor')
