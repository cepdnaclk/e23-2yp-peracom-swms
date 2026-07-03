import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import scholarshipRoutes from './routes/scholarships.js'
import applicationRoutes from './routes/applications.js'
import studentRoutes from './routes/student.js'
import donorRoutes from './routes/donor.js'
import adminRoutes from './routes/admin.js'

dotenv.config()

const app = express()

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/scholarships', scholarshipRoutes)
app.use('/api/applications', applicationRoutes)
app.use('/api/student', studentRoutes)
app.use('/api/donor', donorRoutes)
app.use('/api/admin', adminRoutes)

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))

// 404
app.use((req, res) => res.status(404).json({ message: 'Route not found' }))

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`🚀 PSWMS API running on port ${PORT}`))
