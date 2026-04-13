import { useState, useEffect } from "react";
import socket from "../socket";
import Canvas from "./Canvas";
import Chat from "./Chat";
import "./GameRoom.css";

export default function GameRoom({ player, room, onGameEnd }) {
  const [phase, setPhase] = useState("waiting");
  const [currentDrawer, setCurrentDrawer] = useState(null);
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(room.settings.rounds);
  const [timeLeft, setTimeLeft] = useState(room.settings.drawTime);
  const [wordHint, setWordHint] = useState("");
  const [currentWord, setCurrentWord] = useState("");
  const [wordOptions, setWordOptions] = useState([]);
  const [roundEndData, setRoundEndData] = useState(null);
  const [gameOverData, setGameOverData] = useState(null);
  const [players, setPlayers] = useState(room.players);

  const isDrawing = currentDrawer?.id === player.id;

  useEffect(() => {
    socket.on(
      "round_start",
      ({ round, totalRounds, drawerId, drawerName, drawTime }) => {
        setPhase("playing");
        setCurrentRound(round);
        setTotalRounds(totalRounds);
        setTimeLeft(drawTime);
        setCurrentDrawer({ id: drawerId, name: drawerName });
        setWordHint("");
        setCurrentWord("");
        setWordOptions([]);
        setRoundEndData(null);
      },
    );

    socket.on("word_options", ({ words }) => {
      setPhase("choosing");
      setWordOptions(words);
    });

    socket.on("word_chosen", ({ word }) => {
      setCurrentWord(word);
      setPhase("playing");
    });

    socket.on("word_hint", ({ hint }) => {
      setWordHint(hint);
      setPhase("playing");
    });

    socket.on("hint_update", ({ hint }) => setWordHint(hint));
    socket.on("timer_update", ({ timeLeft }) => setTimeLeft(timeLeft));

    socket.on("round_end", ({ word, scores }) => {
      setPhase("round_end");
      setCurrentWord(word);
      setRoundEndData({ word, scores });
    });

    socket.on("game_over", ({ winner, leaderboard }) => {
      setPhase("game_over");
      setGameOverData({ winner, leaderboard });
    });

    socket.on("player_joined", ({ players }) => setPlayers(players));
    socket.on("player_left", ({ players }) => setPlayers(players));

    return () => {
      socket.off("round_start");
      socket.off("word_options");
      socket.off("word_chosen");
      socket.off("word_hint");
      socket.off("hint_update");
      socket.off("timer_update");
      socket.off("round_end");
      socket.off("game_over");
      socket.off("player_joined");
      socket.off("player_left");
    };
  }, []);

  const handleWordChoice = (word) => {
    socket.emit("word_chosen", { word });
    setCurrentWord(word);
    setWordOptions([]);
  };

  const timerColor = () => {
    if (timeLeft > 30) return "#4caf50";
    if (timeLeft > 10) return "#ffc800";
    return "#e94560";
  };

  const timerPercent = () => (timeLeft / room.settings.drawTime) * 100;

  // ── Game Over ──
  if (phase === "game_over" && gameOverData) {
    return (
      <div className="gr-page">
        <div className="gr-overlay-card">
          <div className="gr-trophy">🏆</div>
          <h1 className="gr-over-title">Game Over!</h1>
          <p className="gr-over-winner">
            🥇 Winner: <strong>{gameOverData.winner.name}</strong>
          </p>
          <div className="gr-leaderboard">
            {gameOverData.leaderboard.map((p, i) => (
              <div key={p.id} className={`gr-lb-row ${i === 0 ? "first" : ""}`}>
                <span className="gr-lb-rank">
                  {i === 0
                    ? "🥇"
                    : i === 1
                      ? "🥈"
                      : i === 2
                        ? "🥉"
                        : `#${i + 1}`}
                </span>
                <div
                  className="gr-lb-avatar"
                  style={{ background: p.avatar?.color || "#e94560" }}
                >
                  {p.avatar?.shape || p.name.charAt(0).toUpperCase()}
                </div>
                <span className="gr-lb-name">{p.name}</span>
                <span className="gr-lb-score">{p.score} pts</span>
              </div>
            ))}
          </div>
          <button className="gr-home-btn" onClick={onGameEnd}>
            🏠 Back to Home
          </button>
        </div>
      </div>
    );
  }

  // ── Round End ──
  if (phase === "round_end" && roundEndData) {
    return (
      <div className="gr-page">
        <div className="gr-overlay-card">
          <h2 className="gr-round-title">⏰ Round Over!</h2>
          <p className="gr-round-word">
            The word was: <strong>{roundEndData.word}</strong>
          </p>
          <div className="gr-leaderboard">
            {[...roundEndData.scores]
              .sort((a, b) => b.score - a.score)
              .map((p, i) => (
                <div
                  key={p.id}
                  className={`gr-lb-row ${i === 0 ? "first" : ""}`}
                >
                  <span className="gr-lb-rank">#{i + 1}</span>
                  <div
                    className="gr-lb-avatar"
                    style={{ background: p.avatar?.color || "#e94560" }}
                  >
                    {p.avatar?.shape || p.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="gr-lb-name">{p.name}</span>
                  <span className="gr-lb-score">{p.score} pts</span>
                </div>
              ))}
          </div>
          <p className="gr-next-hint">Next round starting soon...</p>
        </div>
      </div>
    );
  }

  // ── Word Choice ──
  if (phase === "choosing" && wordOptions.length > 0) {
    return (
      <div className="gr-page">
        <div className="gr-overlay-card">
          <div className="gr-pencil">✏️</div>
          <h2 className="gr-choose-title">Choose a word to draw!</h2>
          <p className="gr-choose-sub">Pick wisely — you have 15 seconds</p>
          <div className="gr-word-options">
            {wordOptions.map((word) => (
              <button
                key={word}
                className="gr-word-btn"
                onClick={() => handleWordChoice(word)}
              >
                {word}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Main Game ──
  return (
    <div className="gr-page">
      {/* Top Bar */}
      <div className="gr-topbar">
        <div className="gr-logo">
          ✏️ InkSync
        </div>

        <div className="gr-topbar-center">
          <div className="gr-round-info">
            Round <strong>{currentRound}</strong> of {totalRounds}
          </div>
          <div className="gr-drawer-info">
            {isDrawing
              ? "🎨 You are drawing!"
              : `✏️ ${currentDrawer?.name || "..."} is drawing`}
          </div>
          <div className="gr-hint-display">
            {isDrawing ? (
              <span className="gr-word-reveal">{currentWord}</span>
            ) : (
              <span className="gr-word-blanks">{wordHint || "..."}</span>
            )}
          </div>
        </div>

        <div className="gr-timer-box" style={{ borderColor: timerColor() }}>
          <div
            className="gr-timer-fill"
            style={{ width: `${timerPercent()}%`, background: timerColor() }}
          />
          <span className="gr-timer-text" style={{ color: timerColor() }}>
            {timeLeft}s
          </span>
        </div>
      </div>

      {/* Game Body */}
      <div className="gr-body">
        {/* Players Sidebar */}
        <div className="gr-sidebar">
          {players.map((p, i) => (
            <div
              key={p.id}
              className={`gr-player 
                ${p.id === player.id ? "me" : ""} 
                ${p.isDrawing ? "drawing" : ""}
                ${p.hasGuessedCorrectly ? "guessed" : ""}`}
            >
              <span className="gr-player-rank">#{i + 1}</span>
              <div
                className="gr-player-avatar"
                style={{ background: p.avatar?.color || "#e94560" }}
              >
                {p.avatar?.shape || p.name.charAt(0).toUpperCase()}
              </div>
              <div className="gr-player-info">
                <span className="gr-player-name">
                  {p.name}
                  {p.id === player.id && <span className="gr-you"> (You)</span>}
                </span>
                <span className="gr-player-score">{p.score} pts</span>
              </div>
              <div className="gr-player-status">
                {p.isDrawing && <span>✏️</span>}
                {p.hasGuessedCorrectly && <span>✅</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Canvas */}
        <div className="gr-canvas-area">
          <Canvas isDrawing={isDrawing} />
        </div>

        {/* Chat */}
        <div className="gr-chat-area">
          <Chat
            player={player}
            isDrawing={isDrawing}
            currentWord={currentWord}
            wordHint={wordHint}
          />
        </div>
      </div>
    </div>
  );
}
