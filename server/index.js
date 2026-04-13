const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const Player = require('./classes/Player');
const Room = require('./classes/Room');
const Game = require('./classes/Game');

const app = express();
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
}));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST'],
  },
});

// In-memory store
const rooms = {};

//Helper 
function getRoomBySocketId(socketId) {
  return Object.values(rooms).find(room =>
    room && room.players && room.players.some(p => p.socketId === socketId)
  );
}

// REST 
app.get('/', (req, res) => res.send('Skribbl server running'));

// Socket.IO 
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  //Create Room
  socket.on('create_room', ({ playerName, settings, avatar }) => {
    const player = new Player(socket.id, playerName, avatar);
    player.isHost = true;

    const room = new Room(player, settings);
    rooms[room.id] = room;

    socket.join(room.id);

    socket.emit('room_created', {
      roomId: room.id,
      player: player.toJSON(),
      room: room.toJSON(),
    });

    console.log(`Room ${room.id} created by ${playerName}`);
  });

  //Join Room
  socket.on('join_room', ({ roomId, playerName, avatar}) => {
    const room = rooms[roomId.toUpperCase()];

    if (!room) {
      socket.emit('join_error', { reason: 'Room not found' });
      return;
    }

    const player = new Player(socket.id, playerName, avatar);
    const result = room.addPlayer(player);

    if (!result.success) {
      socket.emit('join_error', { reason: result.reason });
      return;
    }

    socket.join(room.id);

    socket.emit('room_joined', {
      roomId: room.id,
      player: player.toJSON(),
      room: room.toJSON(),
    });

    io.to(room.id).emit('player_joined', {
      player: player.toJSON(),
      players: room.players.map(p => p.toJSON()),
    });

    console.log(`${playerName} joined room ${room.id}`);
  });

  // Start Game
  socket.on('start_game', () => {
    const room = getRoomBySocketId(socket.id);
    if (!room) return;

    const player = room.getPlayer(socket.id);
    if (!player || !player.isHost) return;

    if (room.players.length < 2) {
      socket.emit('start_error', { reason: 'Need at least 2 players' });
      return;
    }

    const game = new Game(room, io);
    room.game = game;
    game.startGame();
  });

  // Word Chosen 
  socket.on('word_chosen', ({ word }) => {
    const room = getRoomBySocketId(socket.id);
    if (!room || !room.game) return;

    const player = room.getPlayer(socket.id);
    if (!player || !player.isDrawing) return;

    room.game.setWord(word);
  });

  // Drawing Events
  socket.on('draw_start', (data) => {
    const room = getRoomBySocketId(socket.id);
    if (!room) return;
    socket.to(room.id).emit('draw_start', data);
  });

  socket.on('draw_move', (data) => {
    const room = getRoomBySocketId(socket.id);
    if (!room) return;
    socket.to(room.id).emit('draw_move', data);
  });

  socket.on('draw_end', () => {
    const room = getRoomBySocketId(socket.id);
    if (!room) return;
    socket.to(room.id).emit('draw_end');
  });

  socket.on('canvas_clear', () => {
    const room = getRoomBySocketId(socket.id);
    if (!room || !room.game) return;

    const player = room.getPlayer(socket.id);
    if (!player || !player.isDrawing) return;

    room.game.clearCanvas();
  });

  socket.on('draw_undo', (data) => {
    const room = getRoomBySocketId(socket.id);
    if (!room) return;

    const player = room.getPlayer(socket.id);
    if (!player || !player.isDrawing) return;

    socket.to(room.id).emit('draw_undo', data);
  });

  // Guess 
  socket.on('guess', ({ text }) => {
    const room = getRoomBySocketId(socket.id);
    if (!room || !room.game) return;

    const player = room.getPlayer(socket.id);
    if (!player || player.isDrawing) return;

    room.game.checkGuess(player, text);
  });

  socket.on('chat', ({ text }) => {
    const room = getRoomBySocketId(socket.id);
    if (!room) return;

    const player = room.getPlayer(socket.id);
    if (!player) return;

    io.to(room.id).emit('chat_message', {
      playerId: player.id,
      playerName: player.name,
      text,
    });
  });

  //  Disconnect
  socket.on('disconnect', () => {
    const room = getRoomBySocketId(socket.id);
    if (!room) return;

    const player = room.getPlayer(socket.id);
    room.removePlayer(socket.id);

    if (room.isEmpty()) {
      delete rooms[room.id];
      console.log(`Room ${room.id} deleted (empty)`);
      return;
    }

    io.to(room.id).emit('player_left', {
      playerId: player?.id,
      playerName: player?.name,
      players: room.players.map(p => p.toJSON()),
      newHost: room.host.toJSON(),
    });

    console.log(`${player?.name} left room ${room.id}`);
  });
});

// Start Server 
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));