import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://spxemsynocdibdzhiqoc.supabase.co';
const supabaseKey = 'sb_publishable_2LmQM0xmXc6-6cnYUt-b3A_NnOcBfAt';

export const supabase = createClient(supabaseUrl, supabaseKey);
