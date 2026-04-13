import { useState } from "react";
import Home from "./components/Home";
import Lobby from "./components/Lobby";
import GameRoom from "./components/GameRoom";
import socket from "./socket";

export default function App() {
  const [screen, setScreen] = useState("home");
  const [playerData, setPlayerData] = useState(null);
  const [roomData, setRoomData] = useState(null);

  const handleRoomReady = ({ player, room }) => {
    console.log("ROOM:", room);
    console.log("ROOM ID:", room?.id);
    setPlayerData(player);
    setRoomData(room);
    setScreen("lobby");
  };

  const handleGameStart = () => {
    setScreen("game");
  };

  const handleGameEnd = () => {
    setScreen("home");
    setPlayerData(null);
    setRoomData(null);
    socket.disconnect();
  };

  return (
    <div className="app">
      {screen === "home" && <Home onRoomReady={handleRoomReady} />}
      {screen === "lobby" && (
        <Lobby
          player={playerData}
          room={roomData}
          onGameStart={handleGameStart}
        />
      )}
      {screen === "game" && (
        <GameRoom
          player={playerData}
          room={roomData}
          onGameEnd={handleGameEnd}
        />
      )}
    </div>
  );
}
