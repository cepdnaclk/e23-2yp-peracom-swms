import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL?.trim()
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY?.trim()

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } })
  : null

if (!supabase) {
  console.warn('⚠️ Supabase storage is disabled. Set SUPABASE_URL and SUPABASE_SERVICE_KEY to enable uploads.')
}

export const uploadFile = async (bucket, path, buffer, mimetype) => {
  if (!supabase) {
    throw new Error('Supabase storage is not configured')
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, { contentType: mimetype, upsert: true })
  if (error) throw error
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path)
  return urlData.publicUrl
}

export default supabase
