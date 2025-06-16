// src/pages/Multiplayer.jsx
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import io from "socket.io-client";
import Board from "../components/Board";
import "../css_files/Multiplayer.css";

const socket = io("http://localhost:5000");

export default function Multiplayer() {
  const { gameId } = useParams();
  const [game, setGame] = useState(null);
  const [playerColor, setPlayerColor] = useState(null);
  const [boardState, setBoardState] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState("w");
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [gameStatus, setGameStatus] = useState("waiting");
  const [opponent, setOpponent] = useState(null);

  // Initialize connection to the game room
  useEffect(() => {
    // Join game room
    socket.emit("joinGame", { gameId });

    // Listen for game state updates
    socket.on("gameState", (data) => {
      setBoardState(data.boardState);
      setCurrentPlayer(data.currentPlayer);
      setGameStatus(data.gameStatus);
      setPlayerColor(data.yourColor);
      setOpponent(data.opponent);

      if (selectedSquare) {
        setSelectedSquare(null);
        setValidMoves([]);
      }
    });

    // Listen for valid moves
    socket.on("validMoves", (data) => {
      setValidMoves(data.validMoves);
    });

    // Listen for game over events
    socket.on("gameOver", (data) => {
      setGameStatus(data.result);
      alert(`Game over: ${data.message}`);
    });

    // Clean up listeners on unmount
    return () => {
      socket.off("gameState");
      socket.off("validMoves");
      socket.off("gameOver");
      socket.emit("leaveGame", { gameId });
    };
  }, [gameId]);

  // Handle square selection and moves
  const handleSquareClick = (row, col) => {
    // If the game isn't active or it's not this player's turn, ignore clicks
    if (gameStatus !== "active" || currentPlayer !== playerColor.charAt(0)) {
      return;
    }

    // If a square is already selected
    if (selectedSquare) {
      const { row: selectedRow, col: selectedCol } = selectedSquare;

      // Check if clicked square is a valid move
      const isValidMove = validMoves.some(
        (move) => move.row === row && move.col === col
      );

      if (isValidMove) {
        // Make the move through socket
        socket.emit("makeMove", {
          gameId,
          from: { row: selectedRow, col: selectedCol },
          to: { row, col },
        });

        setSelectedSquare(null);
        setValidMoves([]);
      } else {
        // If clicked on another one of the player's pieces, select that piece instead
        if (
          boardState[row][col] &&
          boardState[row][col].charAt(0) === playerColor.charAt(0)
        ) {
          setSelectedSquare({ row, col });
          socket.emit("getValidMoves", { gameId, position: { row, col } });
        } else {
          // Otherwise, deselect the current piece
          setSelectedSquare(null);
          setValidMoves([]);
        }
      }
    } else {
      // No square selected yet - select if it contains the player's piece
      const piece = boardState[row][col];
      if (piece && piece.charAt(0) === playerColor.charAt(0)) {
        setSelectedSquare({ row, col });
        socket.emit("getValidMoves", { gameId, position: { row, col } });
      }
    }
  };

  // Show waiting screen if game or player color isn't set yet
  if (!boardState || !playerColor) {
    return (
      <div className="waiting-container">
        <h2>Waiting for opponent...</h2>
        <p>Game ID: {gameId}</p>
        <p>Share this ID with a friend to play together</p>
      </div>
    );
  }

  return (
    <div className="multiplayer-container">
      <div className="game-info">
        <div className="player-info">
          <span
            className={
              currentPlayer === playerColor.charAt(0) ? "active-player" : ""
            }
          >
            You ({playerColor === "w" ? "White" : "Black"})
          </span>
          <span
            className={
              currentPlayer !== playerColor.charAt(0) ? "active-player" : ""
            }
          >
            {opponent ? opponent : "Opponent"} (
            {playerColor === "w" ? "Black" : "White"})
          </span>
        </div>

        <div className="game-status">
          {gameStatus === "active"
            ? currentPlayer === playerColor.charAt(0)
              ? "Your turn"
              : "Opponent's turn"
            : gameStatus}
        </div>
      </div>

      <Board
        boardState={boardState}
        selectedSquare={selectedSquare}
        validMoves={validMoves}
        handleSquareClick={handleSquareClick}
        perspective={playerColor}
      />

      <div className="game-controls">
        <button onClick={() => socket.emit("offerDraw", { gameId })}>
          Offer Draw
        </button>
        <button onClick={() => socket.emit("resign", { gameId })}>
          Resign
        </button>
      </div>
    </div>
  );
}
