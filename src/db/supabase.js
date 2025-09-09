import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("[Supabase] Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env");
  process.exit(1);
}

export const supabase = createClient(url, key);
