const { createClient } = supabase;
const supabaseClient = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);

async function initializeDatabase() {
    try {
        // Clear browser storage to prevent space issues
        await clearBrowserStorage();
        
        const { data, error } = await supabaseClient
            .from('users')
            .select('*')
            .limit(1);
        
        if (error && error.code === '42P01') {
            console.log('Tables not found. Please create them in Supabase dashboard.');
            console.log(`
                Required tables:
                
                1. users table:
                   - id (uuid, primary key, default: gen_random_uuid())
                   - google_id (text, unique)
                   - email (text, unique)
                   - name (text)
                   - picture (text)
                   - created_at (timestamp with time zone, default: now())
                   - updated_at (timestamp with time zone, default: now())
                
                2. daily_scores table:
                   - id (uuid, primary key, default: gen_random_uuid())
                   - user_id (uuid, foreign key to users.id)
                   - challenge_date (date)
                   - challenge_id (int)
                   - completed (boolean)
                   - time_taken (int) // in seconds
                   - moves (int)
                   - created_at (timestamp with time zone, default: now())
                   
                Create unique constraint on (user_id, challenge_date) for daily_scores
            `);
        }
    } catch (err) {
        console.error('Database initialization error:', err);
    }
}

async function clearBrowserStorage() {
    try {
        // Clear old cache data to prevent storage space issues
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(
                cacheNames.map(cacheName => caches.delete(cacheName))
            );
        }
        
        // Clear old local storage entries
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
                const item = localStorage.getItem(key);
                try {
                    const parsedItem = JSON.parse(item);
                    if (parsedItem.expires_at && Date.now() > parsedItem.expires_at * 1000) {
                        keysToRemove.push(key);
                    }
                } catch (e) {
                    // If parsing fails, consider the item expired
                    keysToRemove.push(key);
                }
            }
        }
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log('Browser storage cleaned');
        
    } catch (err) {
        console.log('Storage cleanup failed:', err);
    }
}

async function saveUserToSupabase(user) {
    if (!user) return;
    
    try {
        const { data, error } = await supabaseClient
            .from('users')
            .upsert({
                google_id: user.sub,
                email: user.email,
                name: user.name,
                picture: user.picture,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'google_id'
            })
            .select()
            .single();
        
        if (error) {
            console.error('Error saving user:', error);
        } else if (data) {
            user.dbId = data.id;
            console.log('User saved successfully to database');
        }
    } catch (err) {
        console.error('Failed to save user:', err);
    }
}

async function saveDailyScore(completed, timeTaken, moves, challengeDate = null) {
    if (!currentUser || !currentUser.dbId) {
        console.log('Cannot save score: user not authenticated or database ID missing');
        return;
    }
    
    // Use provided challengeDate or fall back to current date from navigation
    let dateToUse = challengeDate;
    if (!dateToUse) {
        // Try to get current challenge date from navigation.js
        if (typeof getCurrentChallengeDate === 'function') {
            dateToUse = getCurrentChallengeDate();
        } else {
            // Fallback: get from URL or use today
            const urlParams = new URLSearchParams(window.location.search);
            const dateParam = urlParams.get('date');
            if (dateParam) {
                dateToUse = new Date(dateParam + 'T00:00:00');
            } else {
                dateToUse = new Date();
            }
        }
    }
    
    const year = dateToUse.getFullYear();
    const month = String(dateToUse.getMonth() + 1).padStart(2, '0');
    const day = String(dateToUse.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    // Get challenge ID for the specific date
    const challenge = getChallengeForDate(dateToUse);
    const challengeId = challenge ? challenge.id : null;
    
    if (!challengeId) {
        console.error('Cannot save score: no challenge found for date', dateStr);
        return;
    }
    
    try {
        const { data, error } = await supabaseClient
            .from('daily_scores')
            .upsert({
                user_id: currentUser.dbId,
                challenge_date: dateStr,
                challenge_id: challengeId,
                completed: completed,
                time_taken: timeTaken,
                moves: moves
            }, {
                onConflict: 'user_id,challenge_date'
            })
            .select();
        
        if (error) {
            console.error('Error saving score:', error);
        } else {
            console.log('Score saved successfully:', data);
            
            // Update game state if this is the current challenge
            if (gameState) {
                gameState.todayResult = {
                    completed,
                    time_taken: timeTaken,
                    moves
                };
            }
            
            if (monteGameState) {
                monteGameState.todayResult = {
                    completed,
                    time_taken: timeTaken,
                    moves
                };
            }
            
            // Also save to localStorage for immediate UI updates
            const localStorageKey = `screenstreak_${dateStr}`;
            localStorage.setItem(localStorageKey, JSON.stringify({
                completed,
                time_taken: timeTaken,
                moves,
                challenge_date: dateStr
            }));
            
            // Refresh the UI to show completion status after a short delay
            // to ensure DOM is ready
            setTimeout(() => {
                if (typeof checkIfAlreadyPlayedDate === 'function') {
                    checkIfAlreadyPlayedDate(dateToUse);
                }
            }, 100);
        }
    } catch (err) {
        console.error('Failed to save score:', err);
    }
}

async function loadUserStats() {
    if (!currentUser || !currentUser.dbId) return;
    
    try {
        const { data, error } = await supabaseClient
            .from('daily_scores')
            .select('*')
            .eq('user_id', currentUser.dbId)
            .order('challenge_date', { ascending: false });
        
        if (!error && data) {
            // Sync Supabase data to localStorage for navigation consistency
            data.forEach(score => {
                const localStorageKey = `screenstreak_${score.challenge_date}`;
                localStorage.setItem(localStorageKey, JSON.stringify({
                    completed: score.completed,
                    time_taken: score.time_taken,
                    moves: score.moves,
                    challenge_date: score.challenge_date
                }));
            });
            
            calculateStreak(data);
            checkTodayAttempt(data);
            
            // Refresh completion status for current challenge after syncing from database
            // This ensures past challenges show their completion status after login
            if (typeof getCurrentChallengeDate === 'function' && typeof checkIfAlreadyPlayedDate === 'function') {
                setTimeout(() => {
                    const currentChallengeDate = getCurrentChallengeDate();
                    checkIfAlreadyPlayedDate(currentChallengeDate);
                }, 100);
            }
        }
    } catch (err) {
        console.error('Failed to load user stats:', err);
    }
}

function calculateStreak(scores) {
    if (!scores || scores.length === 0) {
        document.getElementById('streakCount').textContent = '0';
        return;
    }
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const sortedScores = scores.sort((a, b) => 
        new Date(b.challenge_date) - new Date(a.challenge_date)
    );
    
    for (let i = 0; i < sortedScores.length; i++) {
        const scoreDate = new Date(sortedScores[i].challenge_date);
        scoreDate.setHours(0, 0, 0, 0);
        
        const daysDiff = Math.floor((today - scoreDate) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === i && sortedScores[i].completed) {
            streak++;
        } else if (daysDiff === i + 1 && sortedScores[i].completed) {
            streak++;
        } else {
            break;
        }
    }
    
    document.getElementById('streakCount').textContent = streak;
}

function checkTodayAttempt(scores) {
    const todayDate = new Date();
    const year = todayDate.getFullYear();
    const month = String(todayDate.getMonth() + 1).padStart(2, '0');
    const day = String(todayDate.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;
    const todayScore = scores.find(s => s.challenge_date === today);
    
    if (todayScore) {
        gameState.alreadyPlayed = true;
        gameState.todayResult = todayScore;
        
        // Update UI to show completed state
        const startBtn = document.getElementById('startGameBtn');
        if (todayScore.completed) {
            startBtn.textContent = '✅ Completed Today';
            startBtn.classList.add('completed');
        } else {
            startBtn.textContent = '❌ Already Attempted';
            startBtn.classList.add('attempted');
        }
    }
}

initializeDatabase();