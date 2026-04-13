# ✏️ InkSync

A real-time multiplayer drawing and guessing game 

🔗 **Live Demo:** [https://inksync-client.onrender.com](https://inksync-client.onrender.com)

## How to Play

1. Enter your name and customize your avatar
2. Create a private room or join one with a room code
3. Each round, one player draws a word — others guess it in chat
4. Faster correct guesses = more points
5. Most points at the end wins! 

## Features

-  Real-time drawing sync via WebSockets
-  Multiplayer rooms (create or join with code)
-  Turn-based rounds with configurable settings
-  Progressive hints revealed over time
-  Live leaderboard and scoring system
-  Custom player avatars with color picker
-  Draw timer with visual countdown
-  Real-time chat and guess system
-  Touch support for mobile drawing
-  Undo and clear canvas tools

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite |
| Canvas | HTML5 Canvas API |
| Backend | Node.js + Express |
| Real-time | Socket.IO |
| Styling | Plain CSS |
| Deployment | Render (backend) + Render (frontend) |

## Architecture Overview

Client (React)
│
│  Socket.IO WebSocket connection
│
Server (Node.js + Express)
│
├── Player class   → manages name, score, avatar, state
├── Room class     → manages players, settings, room code
└── Game class     → manages rounds, timer, hints, scoring

### WebSocket Flow

- Drawing strokes captured on canvas → emitted to server → broadcast to all clients
- Guess typed in chat → server checks against current word → points awarded
- Game state (rounds, turns, scores) managed server-side to prevent cheating

## Room Settings

| Setting | Range | Default |
|---------|-------|---------|
| Max Players | 2–20 | 8 |
| Rounds | 2–10 | 3 |
| Draw Time | 15–240s | 80s |
| Word Choices | 1–5 | 3 |
| Hints | 0–5 | 2 |

## Project Structure

INKSYNC/
├── server/
│   ├── classes/
│   │   ├── Player.js       # Player state and scoring
│   │   ├── Room.js         # Room management
│   │   └── Game.js         # Game logic, rounds, hints
│   ├── words.js            # Word list by category
│   ├── index.js            # Express + Socket.IO server
│   └── package.json
│
└── client/
├── src/
│   ├── components/
│   │   ├── Home.jsx        # Landing page, avatar picker
│   │   ├── Lobby.jsx       # Waiting room
│   │   ├── GameRoom.jsx    # Main game screen
│   │   ├── Canvas.jsx      # Drawing board + tools
│   │   └── Chat.jsx        # Chat + guess input
│   ├── socket.js           # Socket.IO client config
│   ├── App.jsx             # Screen router
│   └── main.jsx
├── index.html
├── vite.config.js
└── package.json

## Author

Built by **Sujal** 