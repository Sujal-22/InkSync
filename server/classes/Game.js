const words = require('../word');

class Game{
    constructor(room, io) {
        this.room = room;
        this.io = io;
        this.currentRound = 0;
        this.currentDrawerIndex = 0;
        this.currentWord = null;
        this.currentWordOption = [];
        this.timer = null;
        this.timeLeft = room.settings.drawTime;
        this.hintsGiven = 0;
        this.hintTimer = null;
        this.wordChosen = false;
        this.scores = {}
        this.revealedIndices = [];

        room.players.forEach(p => {
            this.scores[p.id] = 0;
        });
    }
    
    getWordOption() {
        const shuffled = words.sort(() => Math.random() - 0.5);
        return shuffled.slice(0, this.room.settings.wordCount);
    }

    startGame() {
        this.room.isGameStarted = true;
        this.currrentRound = 1;
        this.startRound();
    }

    startRound() {
        this.room.players.forEach(p => p.resetRoundState());
        this.hintsGiven = 0;
        this.revealedIndices = [];
        this.wordChosen = false;
        this.currentWord = null;
        this.timeLeft = this.room.settings.drawTime;

            const drawer = this.room.players[this.currentDrawerIndex];
    drawer.isDrawing = true;

    const wordOptions = this.getWordOption();
    this.currentWordOptions = wordOptions;

    this.io.to(this.room.id).emit('round_start', {
      round: this.currentRound,
      totalRounds: this.room.settings.rounds,
      drawerId: drawer.id,
      drawerName: drawer.name,
      drawTime: this.room.settings.drawTime,
    });

    this.io.to(drawer.socketId).emit('word_options', { words: wordOptions });

    this.wordChoiceTimer = setTimeout(() => {
      if (!this.wordChosen) {
        const autoWord = wordOptions[Math.floor(Math.random() * wordOptions.length)];
        this.setWord(autoWord);
      }
    }, 15000);
  }

  setWord(word) {
    this.wordChosen = true;
    this.currentWord = word;
    clearTimeout(this.wordChoiceTimer);

    const drawer = this.room.players[this.currentDrawerIndex];

    this.io.to(drawer.socketId).emit('word_chosen', { word });

    this.io.to(this.room.id).emit('word_hint', {
      wordLength: word.length,
      hint: '_'.repeat(word.length),
      spaces: word.split('').map((ch, i) => (ch === ' ' ? i : null)).filter(i => i !== null),
    });

    this.startTimer();
    this.scheduleHints();
  }

  startTimer() {
    this.timeLeft = this.room.settings.drawTime;

    this.timer = setInterval(() => {
      this.timeLeft--;
      this.io.to(this.room.id).emit('timer_update', { timeLeft: this.timeLeft });

      if (this.timeLeft <= 0) {
        this.endRound();
      }
    }, 1000);
  }

  scheduleHints() {
    if (this.room.settings.hints === 0) return;

    const totalHints = Math.min(
      this.room.settings.hints,
      Math.floor(this.currentWord.replace(/ /g, '').length / 2)
    );

    const interval = Math.floor(this.room.settings.drawTime / (totalHints + 1)) * 1000;

    this.hintTimer = setInterval(() => {
      if (this.hintsGiven >= totalHints) {
        clearInterval(this.hintTimer);
        return;
      }
      this.revealHint();
    }, interval);
  }

  revealHint() {
    const word = this.currentWord;
    const unrevealedIndices = word
      .split('')
      .map((ch, i) => (ch !== ' ' && !this.revealedIndices.includes(i) ? i : null))
      .filter(i => i !== null);

    if (unrevealedIndices.length === 0) return;

    const randomIndex = unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)];
    this.revealedIndices.push(randomIndex);
    this.hintsGiven++;

    const hintArray = word.split('').map((ch, i) => {
      if (ch === ' ') return ' ';
      if (this.revealedIndices.includes(i)) return ch;
      return '_';
    });

    this.io.to(this.room.id).emit('hint_update', { hint: hintArray.join('') });
  }

  checkGuess(player, guessText) {
    if (!this.currentWord || player.isDrawing || player.hasGuessedCorrectly) return;

    const guess = guessText.trim().toLowerCase();
    const answer = this.currentWord.trim().toLowerCase();

    if (guess === answer) {
      player.hasGuessedCorrectly = true;

      const points = Math.max(10, Math.floor((this.timeLeft / this.room.settings.drawTime) * 100));
      player.addScore(points);
      this.scores[player.id] = player.score;

      const drawer = this.room.players[this.currentDrawerIndex];
      const drawerPoints = 10;
      drawer.addScore(drawerPoints);
      this.scores[drawer.id] = drawer.score;

      this.io.to(this.room.id).emit('guess_result', {
        correct: true,
        playerId: player.id,
        playerName: player.name,
        points,
      });

      const allGuessed = this.room.players
        .filter(p => !p.isDrawing)
        .every(p => p.hasGuessedCorrectly);

      if (allGuessed) this.endRound();
    } else {
      this.io.to(this.room.id).emit('guess_result', {
        correct: false,
        playerId: player.id,
        playerName: player.name,
        text: guessText,
      });
    }
  }

  endRound() {
    clearInterval(this.timer);
    clearInterval(this.hintTimer);
    clearTimeout(this.wordChoiceTimer);

    this.io.to(this.room.id).emit('round_end', {
      word: this.currentWord,
      scores: this.room.players.map(p => ({ id: p.id, name: p.name, score: p.score })),
    });

    setTimeout(() => {
      this.currentDrawerIndex++;

      if (this.currentDrawerIndex >= this.room.players.length) {
        this.currentDrawerIndex = 0;
        this.currentRound++;
      }

      if (this.currentRound > this.room.settings.rounds) {
        this.endGame();
      } else {
        this.startRound();
      }
    }, 5000);
  }

  endGame() {
    this.room.isGameStarted = false;
    const sorted = [...this.room.players].sort((a, b) => b.score - a.score);

    this.io.to(this.room.id).emit('game_over', {
      winner: sorted[0].toJSON(),
      leaderboard: sorted.map(p => p.toJSON()),
    });
  }

  clearCanvas() {
    this.io.to(this.room.id).emit('canvas_clear');
  }
}

module.exports = Game;

    
