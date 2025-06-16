import React from "react";
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

function Board({ board }) {
  return (
    <div className="chessboard">
      {board.map((row, rowIdx) =>
        row.map((piece, colIdx) => {
          const isLight = (rowIdx + colIdx) % 2 === 0;
          return (
            <div
              className={`square ${isLight ? "light" : "dark"}`}
              key={`${rowIdx}-${colIdx}`}
            >
              {piece ? pieceUnicode[piece] : ""}
            </div>
          );
        })
      )}
    </div>
  );
}

export default Board;
