// Configuration file for public settings
// DO NOT put sensitive keys here - use environment variables instead

const config = {
    // Google OAuth - Client ID is safe to expose (not the secret)
    GOOGLE_CLIENT_ID: '279332018666-9ej0b9roafvs2sl8ii4eo5kg8vtklafe.apps.googleusercontent.com',
    
    // Supabase - These are safe to expose (Row Level Security protects data)
    SUPABASE_URL: 'https://oqaricjakyioxumgicbn.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xYXJpY2pha3lpb3h1bWdpY2JuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NDE1MjcsImV4cCI6MjA4MDExNzUyN30.2e5qygk3fVTzsc4p73HWNGYFMgaK-pQxj9WlVDHPUu0'
};

// Note: The Google Client ID and Supabase anon key are meant to be public
// Security is handled by:
// - Google: OAuth redirect URI restrictions
// - Supabase: Row Level Security policies