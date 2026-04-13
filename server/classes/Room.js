const { v4: uuidv4 } = require('uuid');

class Room {
  constructor(hostPlayer, settings = {}) {
    this.id = uuidv4().slice(0, 6).toUpperCase();
    this.host = hostPlayer;
    this.players = [hostPlayer];
    this.settings = {
      maxPlayers: settings.maxPlayers || 8,
      rounds: settings.rounds || 3,
      drawTime: settings.drawTime || 80,
      wordCount: settings.wordCount || 3,
      hints: settings.hints || 2,
    };
    this.isGameStarted = false;
    this.game = null;
  }

  addPlayer(player) {
    if (this.players.length >= this.settings.maxPlayers) {
      return { success: false, reason: 'Room is full' };
    }
    if (this.isGameStarted) {
      return { success: false, reason: 'Game already started' };
    }
    this.players.push(player);
    return { success: true };
  }

  removePlayer(socketId) {
    this.players = this.players.filter(p => p.socketId !== socketId);
    if (this.players.length > 0 && this.host.socketId === socketId) {
      this.host = this.players[0];
      this.host.isHost = true;
    }
  }

  getPlayer(socketId) {
    return this.players.find(p => p.socketId === socketId);
  }

  isEmpty() {
    return this.players.length === 0;
  }

  toJSON() {
    return {
      id: this.id,
      host: this.host.toJSON(),
      players: this.players.map(p => p.toJSON()),
      settings: this.settings,
      isGameStarted: this.isGameStarted,
    };
  }
}

module.exports = Room;