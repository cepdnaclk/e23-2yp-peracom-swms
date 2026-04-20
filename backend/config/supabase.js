// config/supabase.js
// This file sets up the connection to Supabase database

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Create and export the Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
