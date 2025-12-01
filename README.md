# CineQuest - Daily Movie Challenge

A daily puzzle game inspired by movie and TV show challenges, similar to Wordle but for cinematic puzzles.

## Features

- 🎬 Daily rotating challenges based on famous movie/TV puzzles
- 🔐 Google OAuth authentication
- 📊 Score tracking with Supabase cloud database
- 🔥 Streak tracking for consecutive days played
- 📱 Mobile responsive design
- 🎯 20 unique movie-inspired challenges

## Setup Instructions

### Prerequisites
- Python 3.x installed
- Google Cloud Console account
- Supabase account

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/cinequest.git
cd cinequest
```

### 2. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Identity API
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Choose "Web application"
6. Add Authorized JavaScript origins:
   - `http://localhost:8000` (for local development)
   - `https://yourdomain.com` (for production)
7. Copy your Client ID

### 3. Supabase Database Setup

1. Create a new project at [Supabase](https://supabase.com)
2. Go to SQL Editor and run this setup script:

```sql
-- Users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  google_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  picture TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily scores table
CREATE TABLE daily_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  challenge_date DATE NOT NULL,
  challenge_id INT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  time_taken INT,
  moves INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, challenge_date)
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_scores ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust as needed)
CREATE POLICY "Public read access" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own record" ON users FOR UPDATE USING (auth.uid()::text = google_id);

CREATE POLICY "Public read scores" ON daily_scores FOR SELECT USING (true);
CREATE POLICY "Users can insert own scores" ON daily_scores FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own scores" ON daily_scores FOR UPDATE USING (true);
```

3. Get your Supabase URL and anon key from Settings → API

### 4. Configuration

1. Update `config.js` with your credentials:
```javascript
const config = {
    GOOGLE_CLIENT_ID: 'your-google-client-id',
    SUPABASE_URL: 'https://your-project.supabase.co',
    SUPABASE_ANON_KEY: 'your-supabase-anon-key'
};
```

**Note:** The Google Client ID and Supabase anon key are safe to expose in frontend code. Security is handled by:
- Google: OAuth redirect URI restrictions
- Supabase: Row Level Security policies

### 5. Run Locally

```bash
python3 server.py
```

Open `http://localhost:8000` in your browser.

### 6. Deploy to Production

#### Option A: GitHub Pages (Static)
1. Push to GitHub
2. Enable GitHub Pages in repository settings
3. Update config.js with production URLs

#### Option B: Vercel/Netlify
1. Connect your GitHub repository
2. Deploy with default settings
3. Add your domain to Google OAuth authorized origins

#### Option C: Traditional Web Server
1. Upload all files to your web server
2. Ensure HTTPS is enabled (required for Google OAuth)
3. Update config.js with production credentials

## Security Notes

### What's Safe to Commit:
- ✅ Google Client ID (not the secret)
- ✅ Supabase URL and anon key
- ✅ All HTML/CSS/JS files
- ✅ Server.py (contains no secrets)

### What to Keep Private:
- ❌ Google Client Secret (not used in frontend)
- ❌ Supabase service role key (not needed for this app)
- ❌ Any `.env` files with sensitive data

The `client_secret*.json` file in this repo is automatically ignored by `.gitignore` and should never be committed.

## Current Challenge

Today's challenge is the **Die Hard 3 Water Jug Puzzle** where players must measure exactly 4 gallons using 3-gallon and 5-gallon jugs.

## Game Rotation

The game automatically rotates through 20 different movie/TV challenges, changing daily at midnight UTC. See `MOVIE_GAME_IDEAS.md` for the full list.

## Technologies Used

- Vanilla JavaScript (no framework dependencies)
- Google Identity Services API
- Supabase for backend
- Python SimpleHTTPServer with CORS headers
- CSS3 animations and responsive design

## Troubleshooting

### Google Login Stuck on White Screen
- Clear browser cache and cookies
- Try incognito/private mode
- Check browser console for errors
- Ensure server.py is running with proper CORS headers

### Database Not Saving Scores
- Check Supabase table creation
- Verify Row Level Security policies
- Check browser console for API errors
- Ensure Supabase keys are correctly set in config.js

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License

MIT