import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://aqfjcdjqjxuqgyyzrvpf.supabase.co/";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxZmpjZGpxanh1cWd5eXpydnBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyODkwNDgsImV4cCI6MjA5Mjg2NTA0OH0.hRtKUByUAxldUSLpc3hmakiDKiPRCkg7TykEE_reXGI";

export const supabase = createClient(supabaseUrl, supabaseKey);