// src/pages/CreateGame.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import "../css_files/CreateGame.css";

const socket = io("http://localhost:5000");

export default function CreateGame() {
  const [gameId, setGameId] = useState("");
  const [joinId, setJoinId] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for game creation confirmation
    socket.on("gameCreated", (data) => {
      navigate(`/multiplayer/${data.gameId}`);
    });

    // Listen for errors
    socket.on("error", (data) => {
      setError(data.message);
    });

    return () => {
      socket.off("gameCreated");
      socket.off("error");
    };
  }, [navigate]);

  const handleCreateGame = () => {
    socket.emit("createGame");
    navigate("/multiplayer/waiting");
    setError(""); // Clear any previous errors
  };

  const handleJoinGame = (e) => {
    e.preventDefault();
    if (!joinId.trim()) {
      setError("Please enter a game ID");
      return;
    }

    navigate(`/multiplayer/${joinId.trim()}`);
  };

  return (
    <div className="create-game-container">
      <h2>Play Chess</h2>

      <div className="game-options">
        <div className="option-card">
          <h3>Create New Game</h3>
          <p>Start a new chess game and invite a friend</p>
          <button onClick={handleCreateGame}>Create Game</button>
        </div>

        <div className="option-card">
          <h3>Join Game</h3>
          <p>Enter a game ID to join an existing game</p>
          <form onSubmit={handleJoinGame}>
            <input
              type="text"
              placeholder="Enter Game ID"
              value={joinId}
              onChange={(e) => setJoinId(e.target.value)}
            />
            <button type="submit">Join Game</button>
          </form>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
    </div>
  );
}
