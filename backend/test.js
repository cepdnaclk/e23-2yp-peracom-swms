require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function test() {
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
  console.log('KEY starts with:', process.env.SUPABASE_ANON_KEY?.substring(0, 20));

  const { data, error } = await supabase.from('scholarships').select('*');
  console.log('Data:', data);
  console.log('Error:', error);

  const { data: d2, error: e2 } = await supabase.from('donors').select('*');
  console.log('Donors:', d2);
  console.log('Donors Error:', e2);

  const { data: d3, error: e3 } = await supabase.from('issues').select('*');
  console.log('Issues:', d3);
  console.log('Issues Error:', e3);
}

test();