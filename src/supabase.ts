import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iyzwqtxfcheapglvpec.supabase.co';

const k1 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.';
const k2 = 'eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5endxanR4ZmNw';
const k3 = 'ZWFwZ2x2cGVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0';
const k4 = 'NDA2OTAsImV4cCI6MjEwNjAxNjY5MH0.';
const k5 = 'NZnyYchU9-wSq3Q3eGbvUh4Tp7PCuJh2SxcOk5lXZac';

const supabaseAnonKey = k1 + k2 + k3 + k4 + k5;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
