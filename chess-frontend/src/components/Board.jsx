import React, { useState, useEffect } from "react";
import "../css_files/Board.css";

const pieceUnicode = {
  wK: "♔",
  wQ: "♕",
  wR: "♖",
  wB: "♗",
  wN: "♘",
  wP: "♙",
  bK: "♚",
  bQ: "♛",
  bR: "♜",
  bB: "♝",
  bN: "♞",
  bP: "♟",
};

export default function Board() {
  // State variables
  const [boardState, setBoardState] = useState(null);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState("w"); // "w" for white, "b" for black
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch initial board state when component mounts
  useEffect(() => {
    fetchInitialBoardState();
  }, []);

  // Fetch initial board state from API
  const fetchInitialBoardState = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/chess/new-game", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to start new game");
      }

      const data = await response.json();
      setBoardState(data.boardState);
      setCurrentPlayer(data.currentPlayer);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Get valid moves for a selected piece
  const getValidMoves = async (row, col) => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/chess/valid-moves",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            boardState,
            position: { row, col },
            currentPlayer,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get valid moves");
      }

      const data = await response.json();
      return data.validMoves;
    } catch (err) {
      setError(err.message);
      return [];
    }
  };

  // Make a move
  const makeMove = async (fromRow, fromCol, toRow, toCol) => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/chess/move", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          boardState,
          from: { row: fromRow, col: fromCol },
          to: { row: toRow, col: toCol },
          currentPlayer,
        }),
      });

      if (!response.ok) {
        throw new Error("Invalid move");
      }

      const data = await response.json();
      setBoardState(data.boardState);
      setCurrentPlayer(data.currentPlayer);
      setSelectedSquare(null);
      setValidMoves([]);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Handle square click
  const handleSquareClick = async (row, col) => {
    // If game is loading or there's an error, do nothing
    if (loading) return;

    // If a square is already selected
    if (selectedSquare) {
      const { row: selectedRow, col: selectedCol } = selectedSquare;

      // Check if clicked square is a valid move
      const isValidMove = validMoves.some(
        (move) => move.row === row && move.col === col
      );

      if (isValidMove) {
        // Make the move
        await makeMove(selectedRow, selectedCol, row, col);
      } else if (row === selectedRow && col === selectedCol) {
        // Deselect if clicking the same square
        setSelectedSquare(null);
        setValidMoves([]);
      } else if (
        boardState[row][col] &&
        boardState[row][col].charAt(0) === currentPlayer
      ) {
        // Select a new piece of the current player
        setSelectedSquare({ row, col });
        const moves = await getValidMoves(row, col);
        setValidMoves(moves);
      } else {
        // Invalid selection, clear
        setSelectedSquare(null);
        setValidMoves([]);
      }
    } else {
      // No square selected yet
      const piece = boardState[row][col];

      // Only select pieces of the current player
      if (piece && piece.charAt(0) === currentPlayer) {
        setSelectedSquare({ row, col });
        const moves = await getValidMoves(row, col);
        setValidMoves(moves);
      }
    }
  };

  // Check if a square is valid for movement
  const isValidMoveSquare = (row, col) => {
    return validMoves.some((move) => move.row === row && move.col === col);
  };

  // Render loading state
  if (loading && !boardState) {
    return <div className="loading">Loading...</div>;
  }

  // Render error state
  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="board-container">
      <div className="game-info">
        <div className="player-turn">
          {currentPlayer === "w" ? "White's turn" : "Black's turn"}
        </div>
      </div>

      <div className="board-with-notation">
        <div className="rank-notation">
          {["8", "7", "6", "5", "4", "3", "2", "1"].map((rank) => (
            <div key={rank} className="notation-item">
              {rank}
            </div>
          ))}
        </div>

        <div className="board-and-files">
          <div className="chessboard">
            {boardState &&
              boardState.map((row, rowIdx) =>
                row.map((piece, colIdx) => {
                  const isLight = (rowIdx + colIdx) % 2 === 0;
                  const isSelected =
                    selectedSquare &&
                    selectedSquare.row === rowIdx &&
                    selectedSquare.col === colIdx;
                  const isValidMove = isValidMoveSquare(rowIdx, colIdx);

                  return (
                    <div
                      className={`square ${isLight ? "light" : "dark"} ${
                        isSelected ? "selected" : ""
                      } ${isValidMove ? "valid-move" : ""}`}
                      key={`${rowIdx}-${colIdx}`}
                      onClick={() => handleSquareClick(rowIdx, colIdx)}
                    >
                      {piece ? pieceUnicode[piece] : ""}
                      {isValidMove && !piece && (
                        <div className="move-indicator"></div>
                      )}
                      {isValidMove && piece && (
                        <div className="capture-indicator"></div>
                      )}
                    </div>
                  );
                })
              )}
          </div>

          <div className="file-notation">
            {["a", "b", "c", "d", "e", "f", "g", "h"].map((file) => (
              <div key={file} className="notation-item">
                {file}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
