import pg from 'pg'
import dotenv from 'dotenv'
dotenv.config()

const { Pool } = pg
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function run() {
  const client = await pool.connect()
  try {
    const tableCheck = await client.query(`
      SELECT table_name FROM information_schema.tables WHERE table_name = 'notifications'
    `)
    if (tableCheck.rows.length === 0) {
      console.log('❌ Notifications table does NOT exist!')
    } else {
      console.log('✅ Notifications table exists! Checking columns:')
      const columns = await client.query(`
        SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'notifications'
      `)
      console.log(columns.rows)
    }
  } catch (err) {
    console.error('Error:', err.message)
  } finally {
    client.release()
    await pool.end()
  }
}

run()
