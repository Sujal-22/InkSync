const { v4: uuidv4 } = require('uuid');

class Player{
    constructor(socketId, name, avatar ={}) {
        this.id = uuidv4();
        this.socketId = socketId;
        this.name = name;
        this.avatar = avatar;
        this.score = 0;
        this.isHost = false;
        this.hasGuessedCorrectly = false;
        this.isDrawing = false;
    }

    addScore(points) {
        this.score += points;
    }
    resetRoundState() {
        this.hasGuessedCorrectly = false;
        this.isDrawing = false;
    }
    
    toJSON() {
        return {
            id: this.id,
            socketId: this.socketId,
            name: this.name,
            avatar: this.avatar,
            score: this.score,
            isHost: this.isHost,
            hasGuessedCorrectly: this.hasGuessedCorrectly,
            isDrawing: this.isDrawing
        };
    }
}

module.exports = Player;