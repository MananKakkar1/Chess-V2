const express = require('express');
const router = express.Router();
const { validateMove, getValidMoves } = require('../utils/chessLogic');

// Start a new game
router.post('/new-game', (req, res) => {
  // Initialize a new chess board
  const initialBoard = [
    ["bR", "bN", "bB", "bQ", "bK", "bB", "bN", "bR"],
    ["bP", "bP", "bP", "bP", "bP", "bP", "bP", "bP"],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    ["wP", "wP", "wP", "wP", "wP", "wP", "wP", "wP"],
    ["wR", "wN", "wB", "wQ", "wK", "wB", "wN", "wR"]
  ];

  res.json({
    boardState: initialBoard,
    currentPlayer: 'w',
    gameStatus: 'active'
  });
});

// Get valid moves for a selected piece
router.post('/valid-moves', (req, res) => {
  const { boardState, position, currentPlayer } = req.body;
  
  try {
    const validMoves = getValidMoves(boardState, position, currentPlayer);
    res.json({ validMoves });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Make a move
router.post('/move', (req, res) => {
  const { boardState, from, to, currentPlayer } = req.body;
  
  try {
    // Validate and make the move
    const result = validateMove(boardState, from, to, currentPlayer);
    
    // Return the updated board and next player
    res.json({
      boardState: result.boardState,
      currentPlayer: currentPlayer === 'w' ? 'b' : 'w',
      gameStatus: result.gameStatus,
      isCheck: result.isCheck,
      isCheckmate: result.isCheckmate
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;