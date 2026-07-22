import pg from 'pg'
import dotenv from 'dotenv'
dotenv.config()

const { Pool } = pg

const databaseUrl = process.env.DATABASE_URL
let databaseHostname = ''

if (databaseUrl) {
  try {
    databaseHostname = new URL(databaseUrl).hostname
  } catch {
    databaseHostname = ''
  }
}

const sslMode = (process.env.PGSSLMODE || process.env.DB_SSL || '').toLowerCase()
const shouldUseSsl = sslMode === 'require' || sslMode === 'true' || /\.supabase\.co$/i.test(databaseHostname)

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: shouldUseSsl ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
})

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err)
})

// Test connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message)
    console.error('   Check your DATABASE_URL in .env')
  } else {
    console.log('✅ Database connected successfully')
    release()
  }
})

export const query = (text, params) => pool.query(text, params)
export const getClient = () => pool.connect()
export default pool