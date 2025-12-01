let gameState = {
    jug3: 0,
    jug5: 0,
    moves: 0,
    timerInterval: null,
    startTime: null,
    timeRemaining: 300,
    isPlaying: false,
    alreadyPlayed: false,
    todayResult: null
};

function getDailyChallengeId() {
    const startDate = new Date('2024-01-01');
    const today = new Date();
    const daysDiff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
    return (daysDiff % 20) + 1;
}

document.getElementById('startGameBtn').addEventListener('click', startGame);

function startGame() {
    if (gameState.alreadyPlayed && gameState.todayResult) {
        showPreviousResult();
        return;
    }
    
    document.getElementById('gameIntro').classList.add('hidden');
    document.getElementById('gameArea').classList.remove('hidden');
    
    gameState.isPlaying = true;
    gameState.startTime = Date.now();
    gameState.moves = 0;
    gameState.jug3 = 0;
    gameState.jug5 = 0;
    gameState.timeRemaining = 300;
    
    updateJugDisplay();
    startTimer();
}

function startTimer() {
    gameState.timerInterval = setInterval(() => {
        gameState.timeRemaining--;
        
        const minutes = Math.floor(gameState.timeRemaining / 60);
        const seconds = gameState.timeRemaining % 60;
        document.getElementById('timer').textContent = 
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        if (gameState.timeRemaining <= 0) {
            endGame(false);
        }
    }, 1000);
}

function updateJugDisplay() {
    const water3Height = (gameState.jug3 / 3) * 100;
    const water5Height = (gameState.jug5 / 5) * 100;
    
    document.getElementById('water3').style.height = `${water3Height}%`;
    document.getElementById('water5').style.height = `${water5Height}%`;
    
    document.getElementById('amount3').textContent = `${gameState.jug3}/3`;
    document.getElementById('amount5').textContent = `${gameState.jug5}/5`;
    
    document.getElementById('moveCount').textContent = gameState.moves;
    
    if (gameState.jug3 === 4 || gameState.jug5 === 4) {
        setTimeout(() => endGame(true), 500);
    }
}

function fillJug(size) {
    if (!gameState.isPlaying) return;
    
    gameState.moves++;
    
    if (size === 3) {
        gameState.jug3 = 3;
    } else {
        gameState.jug5 = 5;
    }
    
    updateJugDisplay();
}

function emptyJug(size) {
    if (!gameState.isPlaying) return;
    
    gameState.moves++;
    
    if (size === 3) {
        gameState.jug3 = 0;
    } else {
        gameState.jug5 = 0;
    }
    
    updateJugDisplay();
}

function pourJug(from, to) {
    if (!gameState.isPlaying) return;
    
    gameState.moves++;
    
    if (from === 3 && to === 5) {
        const spaceIn5 = 5 - gameState.jug5;
        const amountToPour = Math.min(gameState.jug3, spaceIn5);
        gameState.jug3 -= amountToPour;
        gameState.jug5 += amountToPour;
    } else if (from === 5 && to === 3) {
        const spaceIn3 = 3 - gameState.jug3;
        const amountToPour = Math.min(gameState.jug5, spaceIn3);
        gameState.jug5 -= amountToPour;
        gameState.jug3 += amountToPour;
    }
    
    updateJugDisplay();
}

function endGame(won) {
    gameState.isPlaying = false;
    clearInterval(gameState.timerInterval);
    
    const timeTaken = 300 - gameState.timeRemaining;
    
    document.getElementById('gameArea').classList.add('hidden');
    document.getElementById('gameResult').classList.remove('hidden');
    
    if (won) {
        document.getElementById('resultTitle').textContent = 'Challenge Complete!';
        document.getElementById('resultTitle').className = 'success';
        document.getElementById('resultMessage').textContent = 
            'You successfully defused the bomb! John McClane would be proud.';
    } else {
        document.getElementById('resultTitle').textContent = 'Time\'s Up!';
        document.getElementById('resultTitle').className = 'failure';
        document.getElementById('resultMessage').textContent = 
            'The timer ran out! Better luck tomorrow with a new challenge.';
    }
    
    const minutes = Math.floor(timeTaken / 60);
    const seconds = timeTaken % 60;
    document.getElementById('finalTime').textContent = 
        `${minutes}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('finalMoves').textContent = gameState.moves;
    
    saveDailyScore(won, timeTaken, gameState.moves);
    
    gameState.alreadyPlayed = true;
}

function resetGame() {
    if (gameState.alreadyPlayed) {
        alert('You can only play once per day! Come back tomorrow for a new challenge.');
        return;
    }
    
    clearInterval(gameState.timerInterval);
    
    gameState = {
        jug3: 0,
        jug5: 0,
        moves: 0,
        timerInterval: null,
        startTime: null,
        timeRemaining: 300,
        isPlaying: false,
        alreadyPlayed: gameState.alreadyPlayed,
        todayResult: gameState.todayResult
    };
    
    document.getElementById('gameResult').classList.add('hidden');
    document.getElementById('gameIntro').classList.remove('hidden');
    document.getElementById('timer').textContent = '5:00';
}

function showPreviousResult() {
    const result = gameState.todayResult;
    document.getElementById('gameIntro').classList.add('hidden');
    document.getElementById('gameResult').classList.remove('hidden');
    
    if (result.completed) {
        document.getElementById('resultTitle').textContent = 'Already Completed Today!';
        document.getElementById('resultTitle').className = 'success';
        document.getElementById('resultMessage').textContent = 
            'You\'ve already successfully completed today\'s challenge. Come back tomorrow!';
    } else {
        document.getElementById('resultTitle').textContent = 'Already Attempted Today!';
        document.getElementById('resultTitle').className = 'failure';
        document.getElementById('resultMessage').textContent = 
            'You\'ve already attempted today\'s challenge. Come back tomorrow for another try!';
    }
    
    const minutes = Math.floor(result.time_taken / 60);
    const seconds = result.time_taken % 60;
    document.getElementById('finalTime').textContent = 
        `${minutes}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('finalMoves').textContent = result.moves;
}

function shareResult() {
    const won = document.getElementById('resultTitle').className === 'success';
    const emoji = won ? '✅' : '❌';
    const time = document.getElementById('finalTime').textContent;
    const moves = document.getElementById('finalMoves').textContent;
    const challengeNum = getDailyChallengeId();
    
    const shareText = `CineQuest #${challengeNum} ${emoji}\n` +
        `⏱️ Time: ${time}\n` +
        `🎬 Moves: ${moves}\n` +
        `🔥 Streak: ${document.getElementById('streakCount').textContent} days\n\n` +
        `Play at: https://cinequest.app`;
    
    if (navigator.share) {
        navigator.share({
            text: shareText
        }).catch(err => console.log('Share cancelled'));
    } else {
        navigator.clipboard.writeText(shareText).then(() => {
            alert('Results copied to clipboard!');
        });
    }
}

function updateDailyChallengeInfo() {
    const challengeId = getDailyChallengeId();
    const challenges = [
        { movie: "Die Hard with a Vengeance (1995)", name: "Water Jug Problem" },
        { movie: "The Matrix (1999)", name: "Code Rain Decoder" },
        { movie: "Indiana Jones and the Last Crusade (1989)", name: "Temple Pattern Memory" },
        { movie: "National Treasure (2004)", name: "Caesar Cipher" },
        { movie: "Saw (2004)", name: "Escape Room Timer" },
        { movie: "The Imitation Game (2014)", name: "Enigma Decoder" },
        { movie: "Sherlock (BBC)", name: "Deduction Grid" },
        { movie: "Contact (1997)", name: "Prime Number Sequence" },
        { movie: "The Da Vinci Code (2006)", name: "Anagram Solver" },
        { movie: "Inception (2010)", name: "Maze Navigator" },
        { movie: "Harry Potter", name: "Potion Mixing" },
        { movie: "Mission Impossible", name: "Wire Defusal" },
        { movie: "Arrival (2016)", name: "Alien Language Pattern" },
        { movie: "Ready Player One (2018)", name: "80s Trivia Speed Round" },
        { movie: "Squid Game (2021)", name: "Red Light Green Light" },
        { movie: "The Prestige (2006)", name: "Three Card Monte" },
        { movie: "Zodiac (2007)", name: "Cryptogram Solver" },
        { movie: "Alice in Wonderland (2010)", name: "Logic Riddles" },
        { movie: "The Accountant (2016)", name: "Number Pattern Recognition" },
        { movie: "Westworld", name: "Maze Path Finding" }
    ];
    
    const todayChallenge = challenges[challengeId - 1];
    document.querySelector('.movie-title').textContent = todayChallenge.movie;
    document.querySelector('.challenge-number').textContent = `Challenge #${challengeId}`;
}

updateDailyChallengeInfo();