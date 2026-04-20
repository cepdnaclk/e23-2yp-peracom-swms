// server.js
// Main entry point for the Student Welfare Admin backend

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Routes ──────────────────────────────────────────────────
app.use('/api/dashboard',     require('./routes/dashboard'));
app.use('/api/scholarships',  require('./routes/scholarships'));
app.use('/api/donor-requests',require('./routes/donorRequests'));
app.use('/api/applications',  require('./routes/applications'));
app.use('/api/assignments',   require('./routes/assignments'));
app.use('/api/donors',        require('./routes/donors'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/issues',        require('./routes/issues'));

// ── Health check ────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: 'Student Welfare Admin API is running.' });
});

// ── Start server ────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
