import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iyzwqjtxfcpeapglvpec.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5endxanR4ZmNwZWFwZ2x2cGVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0NDA2OTAsImV4cCI6MjEwNjAxNjY5MH0.NZnyYchU9-wSq3Q3eGbvUh4Tp7PCuJh2SxcOk5lXZac';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);