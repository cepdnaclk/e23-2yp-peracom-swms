import { supabase } from '../config/supabaseClient.js'

export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers['authorization']

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided. Please log in.' })
  }

  const token = authHeader.split(' ')[1]
  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    return res.status(401).json({ error: 'Invalid or expired token. Please log in again.' })
  }

  req.user = user
  next()
}

export const requireRole = (role) => {
  return (req, res, next) => {
    const userRole = req.user?.user_metadata?.role

    if (userRole !== role) {
      return res.status(403).json({
        error: `Access denied. Only ${role}s can access this route.`
      })
    }

    next()
  }
}