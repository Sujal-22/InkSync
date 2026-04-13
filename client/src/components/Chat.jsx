import { useState, useEffect, useRef } from "react";
import socket from "../socket";
import "./Chat.css";

export default function Chat({ player, isDrawing, currentWord, wordHint }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    socket.on("chat_message", ({ playerName, text, playerId }) => {
      setMessages((prev) => [
        ...prev,
        {
          type: "chat",
          playerName,
          text,
          playerId,
          id: Date.now() + Math.random(),
        },
      ]);
    });

    socket.on(
      "guess_result",
      ({ correct, playerName, points, text, playerId }) => {
        if (correct) {
          setMessages((prev) => [
            ...prev,
            {
              type: "correct",
              playerName,
              points,
              id: Date.now() + Math.random(),
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              type: "guess",
              playerName,
              text,
              playerId,
              id: Date.now() + Math.random(),
            },
          ]);
        }
      },
    );

    socket.on("player_left", ({ playerName }) => {
      setMessages((prev) => [
        ...prev,
        {
          type: "system",
          text: `${playerName} left the game`,
          id: Date.now() + Math.random(),
        },
      ]);
    });

    socket.on("player_joined", ({ player }) => {
      setMessages((prev) => [
        ...prev,
        {
          type: "system",
          text: `${player.name} joined`,
          id: Date.now() + Math.random(),
        },
      ]);
    });

    return () => {
      socket.off("chat_message");
      socket.off("guess_result");
      socket.off("player_left");
      socket.off("player_joined");
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    if (isDrawing) {
      socket.emit("chat", { text });
    } else {
      socket.emit("guess", { text });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSend();
  };

  const renderMessage = (msg) => {
    if (msg.type === "correct") {
      return (
        <div key={msg.id} className="chat-msg correct">
          <span>🎉</span>
          <span>
            <strong>{msg.playerName}</strong> guessed it!
          </span>
          <span className="chat-points">+{msg.points}</span>
        </div>
      );
    }
    if (msg.type === "system") {
      return (
        <div key={msg.id} className="chat-msg system">
          {msg.text}
        </div>
      );
    }
    const isMe = msg.playerId === player.id;
    return (
      <div key={msg.id} className={`chat-msg chat ${isMe ? "me" : ""}`}>
        <span className="chat-author">{msg.playerName}:</span>
        <span className="chat-text">{msg.text}</span>
      </div>
    );
  };

  return (
    <div className="chat-wrapper">
      {/* Word display */}
      <div className="chat-top">
        {isDrawing ? (
          <div className="chat-word drawing">
            🎨 Drawing: <strong>{currentWord}</strong>
          </div>
        ) : (
          <div className="chat-word guessing">
            💡 <span className="chat-blanks">{wordHint || "..."}</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty">
            {isDrawing ? "Start drawing!" : "Type your guesses below!"}
          </div>
        )}
        {messages.map((msg) => renderMessage(msg))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="chat-input-row">
        <input
          className="chat-input"
          type="text"
          placeholder={isDrawing ? "Chat with players..." : "Guess the word..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={100}
        />
        <button className="chat-send" onClick={handleSend}>
          ➤
        </button>
      </div>
    </div>
  );
}
