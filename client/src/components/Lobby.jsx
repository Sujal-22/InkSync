import { useState, useEffect } from "react";
import socket from "../socket";
import "./Lobby.css";

export default function Lobby({ player, room, onGameStart }) {
  const [players, setPlayers] = useState(room.players);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    socket.on("player_joined", ({ players }) => setPlayers(players));
    socket.on("player_left", ({ players }) => setPlayers(players));
    socket.on("round_start", () => onGameStart());
    socket.on("start_error", ({ reason }) => setError(reason));

    return () => {
      socket.off("player_joined");
      socket.off("player_left");
      socket.off("round_start");
      socket.off("start_error");
    };
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(room.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStart = () => {
    setError("");
    socket.emit("start_game");
  };

  return (
    <div className="lobby-page">
      <div className="lobby-header">
        <h1 className="lobby-logo">
          ✏️ skribbl<span>.clone</span>
        </h1>
      </div>

      <div className="lobby-main">
        {/* Room Code Box */}
        <div className="lobby-code-box">
          <p className="lobby-code-label">ROOM CODE</p>
          <div className="lobby-code-value">{room.id}</div>
          <button className="lobby-copy-btn" onClick={handleCopy}>
            {copied ? "✅ Copied!" : "📋 Copy Code"}
          </button>
          <p className="lobby-code-hint">
            Share this code with friends to join!
          </p>
        </div>

        {/* Settings chips */}
        <div className="lobby-settings">
          <div className="lobby-chip">🔄 {room.settings.rounds} Rounds</div>
          <div className="lobby-chip">⏱ {room.settings.drawTime}s</div>
          <div className="lobby-chip">👥 Max {room.settings.maxPlayers}</div>
          <div className="lobby-chip">💡 {room.settings.hints} Hints</div>
          <div className="lobby-chip">📝 {room.settings.wordCount} Words</div>
        </div>

        {/* Players Grid */}
        <div className="lobby-players-section">
          <h2 className="lobby-players-title">
            Players ({players.length}/{room.settings.maxPlayers})
          </h2>
          <div className="lobby-players-grid">
            {players.map((p) => (
              <div
                key={p.id}
                className={`lobby-player-card ${p.id === player.id ? "me" : ""}`}
              >
                <div
                  className="lobby-player-avatar"
                  style={{ background: p.avatar?.color || "#e94560" }}
                >
                  {p.avatar?.shape || p.name.charAt(0).toUpperCase()}
                </div>
                <span className="lobby-player-name">{p.name}</span>
                <div className="lobby-player-badges">
                  {p.isHost && <span className="badge-host">👑 Host</span>}
                  {p.id === player.id && <span className="badge-you">You</span>}
                </div>
              </div>
            ))}

            {/* Empty slots */}
            {Array.from({
              length: Math.max(0, room.settings.maxPlayers - players.length),
            })
              .slice(0, 8 - players.length)
              .map((_, i) => (
                <div key={`empty-${i}`} className="lobby-player-card empty">
                  <div className="lobby-player-avatar empty-avatar">?</div>
                  <span className="lobby-player-name">Waiting...</span>
                </div>
              ))}
          </div>
        </div>

        {error && <p className="lobby-error">⚠️ {error}</p>}

        {player.isHost ? (
          <button
            className="lobby-start-btn"
            onClick={handleStart}
            disabled={players.length < 2}
          >
            {players.length < 2
              ? "⏳ Waiting for players..."
              : "🚀 Start Game!"}
          </button>
        ) : (
          <div className="lobby-waiting">
            ⏳ Waiting for <strong>{room.host?.name || "host"}</strong> to
            start...
          </div>
        )}
      </div>
    </div>
  );
}
