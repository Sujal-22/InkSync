import { useState } from "react";
import socket from "../socket";
import "./Home.css";

const AVATAR_COLORS = [
  "#e94560",
  "#ff6b35",
  "#ffc800",
  "#4caf50",
  "#2196f3",
  "#9c27b0",
  "#ff69b4",
  "#00bcd4",
];
const AVATAR_SHAPES = ["😀", "😎", "🤩", "😋", "🥳", "😏", "🤗", "😄"];

export default function Home({ onRoomReady }) {
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [tab, setTab] = useState("create");
  const [avatarColor, setAvatarColor] = useState(0);
  const [avatarShape, setAvatarShape] = useState(0);
  const [settings, setSettings] = useState({
    maxPlayers: 8,
    rounds: 3,
    drawTime: 80,
    wordCount: 3,
    hints: 2,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const connect = () => {
    if (!socket.connected) socket.connect();
  };

  const handleCreate = () => {
    if (!playerName.trim()) {
      setError("Enter your name!");
      return;
    }
    setError("");
    setLoading(true);
    connect();
    socket.emit("create_room", {
      playerName: playerName.trim(),
      settings,
      avatar: {
        color: AVATAR_COLORS[avatarColor],
        shape: AVATAR_SHAPES[avatarShape],
      },
    });
    socket.once("room_created", ({ player, room }) => {
      setLoading(false);
      onRoomReady({ player, room });
    });
  };

  const handleJoin = () => {
    if (!playerName.trim()) {
      setError("Enter your name!");
      return;
    }
    if (!roomCode.trim()) {
      setError("Enter room code!");
      return;
    }
    setError("");
    setLoading(true);
    connect();
    socket.emit("join_room", {
      playerName: playerName.trim(),
      roomId: roomCode.trim().toUpperCase(),
      avatar: {
        color: AVATAR_COLORS[avatarColor],
        shape: AVATAR_SHAPES[avatarShape],
      },
    });
    socket.once("room_joined", ({ player, room }) => {
      setLoading(false);
      onRoomReady({ player, room });
    });
    socket.once("join_error", ({ reason }) => {
      setLoading(false);
      setError(reason);
    });
  };

  return (
    <div className="home-page">
      {/* Header */}
      <div className="home-header">
        <h1 className="home-logo">
          ✏️ InkSync
        </h1>
        <div className="home-avatars-row">
          {AVATAR_COLORS.map((c, i) => (
            <div key={i} className="header-avatar" style={{ background: c }}>
              {AVATAR_SHAPES[i]}
            </div>
          ))}
        </div>
      </div>

      {/* Main Card */}
      <div className="home-main">
        <div className="home-card">
          {/* Avatar Picker */}
          <div className="avatar-section">
            <div
              className="avatar-preview"
              style={{ background: AVATAR_COLORS[avatarColor] }}
            >
              {AVATAR_SHAPES[avatarShape]}
            </div>
            <div className="avatar-controls">
              <div className="avatar-row">
                <button
                  className="av-arrow"
                  onClick={() =>
                    setAvatarShape(
                      (s) =>
                        (s - 1 + AVATAR_SHAPES.length) % AVATAR_SHAPES.length,
                    )
                  }
                >
                  ◀
                </button>
                <span className="av-label">Face</span>
                <button
                  className="av-arrow"
                  onClick={() =>
                    setAvatarShape((s) => (s + 1) % AVATAR_SHAPES.length)
                  }
                >
                  ▶
                </button>
              </div>
              <div className="avatar-row">
                <button
                  className="av-arrow"
                  onClick={() =>
                    setAvatarColor(
                      (c) =>
                        (c - 1 + AVATAR_COLORS.length) % AVATAR_COLORS.length,
                    )
                  }
                >
                  ◀
                </button>
                <span className="av-label">Color</span>
                <button
                  className="av-arrow"
                  onClick={() =>
                    setAvatarColor((c) => (c + 1) % AVATAR_COLORS.length)
                  }
                >
                  ▶
                </button>
              </div>
            </div>
          </div>

          {/* Name Input */}
          <input
            className="home-input"
            type="text"
            placeholder="Enter your name..."
            maxLength={20}
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />

          {/* Tabs */}
          <div className="home-tabs">
            <button
              className={`tab-btn ${tab === "create" ? "active" : ""}`}
              onClick={() => setTab("create")}
            >
              Create Private Room
            </button>
            <button
              className={`tab-btn ${tab === "join" ? "active" : ""}`}
              onClick={() => setTab("join")}
            >
              Join Private Room
            </button>
          </div>

          {/* Create Settings */}
          {tab === "create" && (
            <div className="settings-grid">
              <div className="setting-row">
                <span>Max Players</span>
                <strong>{settings.maxPlayers}</strong>
                <input
                  type="range"
                  min={2}
                  max={20}
                  value={settings.maxPlayers}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, maxPlayers: +e.target.value }))
                  }
                />
              </div>
              <div className="setting-row">
                <span>Rounds</span>
                <strong>{settings.rounds}</strong>
                <input
                  type="range"
                  min={2}
                  max={10}
                  value={settings.rounds}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, rounds: +e.target.value }))
                  }
                />
              </div>
              <div className="setting-row">
                <span>Draw Time</span>
                <strong>{settings.drawTime}s</strong>
                <input
                  type="range"
                  min={15}
                  max={240}
                  step={5}
                  value={settings.drawTime}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, drawTime: +e.target.value }))
                  }
                />
              </div>
              <div className="setting-row">
                <span>Word Choices</span>
                <strong>{settings.wordCount}</strong>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={settings.wordCount}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, wordCount: +e.target.value }))
                  }
                />
              </div>
              <div className="setting-row">
                <span>Hints</span>
                <strong>{settings.hints}</strong>
                <input
                  type="range"
                  min={0}
                  max={5}
                  value={settings.hints}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, hints: +e.target.value }))
                  }
                />
              </div>
            </div>
          )}

          {/* Join Input */}
          {tab === "join" && (
            <input
              className="home-input code-input"
              type="text"
              placeholder="Enter room code..."
              maxLength={6}
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            />
          )}

          {error && <p className="home-error">⚠️ {error}</p>}

          <button
            className="home-play-btn"
            onClick={tab === "create" ? handleCreate : handleJoin}
            disabled={loading}
          >
            {loading
              ? "Connecting..."
              : tab === "create"
                ? "🚀 Create Room"
                : "🔗 Join Room"}
          </button>
        </div>

        {/* How to play */}
        <div className="how-to-play">
          <h3>How to play</h3>
          <ul>
            <li>🎨 One player draws a word</li>
            <li>💬 Others try to guess it</li>
            <li>⚡ Faster guesses = more points</li>
            <li>🏆 Most points at end wins!</li>
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div className="home-footer">
        <p>A free multiplayer drawing & guessing game</p>
      </div>
    </div>
  );
}
