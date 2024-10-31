import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'YOUR SUPABASE URL';
const supabaseAnonKey = 'YOUR SUPABASE KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
