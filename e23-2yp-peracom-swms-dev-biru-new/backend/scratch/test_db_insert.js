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
    // Find a donor ID
    const donorRes = await client.query("SELECT id FROM users WHERE role = 'donor' LIMIT 1")
    if (donorRes.rows.length === 0) {
      console.log('No donor found in database to test with!')
      return
    }
    const donorId = donorRes.rows[0].id
    console.log('Testing insert with donor ID:', donorId)

    const result = await client.query(
      `INSERT INTO donor_scholarship_requests
       (donor_id, scholarship_title, funding_amount, eligible_batch, application_deadline,
        description, eligibility_criteria, required_documents, notes, status,
        category, num_students, opening_date, terms)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [donorId, 'Test Title', 1000.00, '1st Year', null,
        'Test Desc', 'Test Criteria', 'NIC Copy', 'Test Notes', 'Pending',
        null, 5, null, 'Test Terms']
    )
    console.log('✅ Test insertion succeeded!', result.rows[0])

    // Clean up
    await client.query("DELETE FROM donor_scholarship_requests WHERE id = $1", [result.rows[0].id])
    console.log('✅ Test cleanup succeeded!')
  } catch (err) {
    console.error('❌ Database insertion failed:', err.message)
    console.error(err.stack)
  } finally {
    client.release()
    await pool.end()
  }
}

run()
