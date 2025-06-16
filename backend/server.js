import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import bodyParser from 'body-parser';
import chessMoveRoutes from './routes/chessMoves.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api/chess', chessMoveRoutes);

// Basic route
app.get('/', (req, res) => {
  res.send('Chess API is running');
});

// Game rooms storage
const games = {};
const players = {};

// Socket.IO handlers
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Create a new game
  socket.on('createGame', () => {
    const gameId = generateGameId();
    games[gameId] = {
      boardState: [
        ["bR", "bN", "bB", "bQ", "bK", "bB", "bN", "bR"],
        ["bP", "bP", "bP", "bP", "bP", "bP", "bP", "bP"],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        ["wP", "wP", "wP", "wP", "wP", "wP", "wP", "wP"],
        ["wR", "wN", "wB", "wQ", "wK", "wB", "wN", "wR"]
      ],
      currentPlayer: 'w',
      gameStatus: 'waiting',
      players: {
        white: socket.id,
        black: null
      },
      spectators: []
    };
    
    players[socket.id] = gameId;
    socket.join(gameId);
    
    socket.emit('gameCreated', { 
      gameId,
      yourColor: 'w'
    });
  });
  
  // Join an existing game
  socket.on('joinGame', ({ gameId }) => {
    if (!games[gameId]) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }
    
    const game = games[gameId];
    
    // Handle player joining a game room
    if (game.players.white === null) {
      game.players.white = socket.id;
      players[socket.id] = gameId;
      socket.join(gameId);
      
      socket.emit('gameState', {
        boardState: game.boardState,
        currentPlayer: game.currentPlayer,
        gameStatus: 'active',
        yourColor: 'w'
      });
      
      // Notify other players
      socket.to(gameId).emit('playerJoined', {
        color: 'w',
        gameStatus: 'active'
      });
    } 
    else if (game.players.black === null) {
      game.players.black = socket.id;
      players[socket.id] = gameId;
      socket.join(gameId);
      game.gameStatus = 'active';
      
      socket.emit('gameState', {
        boardState: game.boardState,
        currentPlayer: game.currentPlayer,
        gameStatus: 'active',
        yourColor: 'b'
      });
      
      // Notify other players
      socket.to(gameId).emit('playerJoined', {
        color: 'b',
        gameStatus: 'active'
      });
      
      // Update both players with active game
      io.to(gameId).emit('gameState', {
        boardState: game.boardState,
        currentPlayer: game.currentPlayer,
        gameStatus: 'active'
      });
    } 
    else {
      // Join as spectator
      game.spectators.push(socket.id);
      players[socket.id] = gameId;
      socket.join(gameId);
      
      socket.emit('gameState', {
        boardState: game.boardState,
        currentPlayer: game.currentPlayer,
        gameStatus: game.gameStatus,
        asSpectator: true
      });
    }
  });
  
  // Get valid moves for a piece
  socket.on('getValidMoves', ({ gameId, position }) => {
    if (!games[gameId]) return;
    
    const game = games[gameId];
    const { row, col } = position;
    const piece = game.boardState[row][col];
    
    // Check piece ownership
    if (socket.id === game.players.white && piece.charAt(0) !== 'w') return;
    if (socket.id === game.players.black && piece.charAt(0) !== 'b') return;
    
    try {
      // Get valid moves from chess logic
      const validMoves = getValidMoves(game.boardState, position, piece.charAt(0));
      socket.emit('validMoves', { validMoves });
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });
  
  // Make a move
  socket.on('makeMove', ({ gameId, from, to }) => {
    if (!games[gameId]) return;
    
    const game = games[gameId];
    const isWhitePlayer = socket.id === game.players.white;
    const isBlackPlayer = socket.id === game.players.black;
    const currentColor = game.currentPlayer === 'w' ? 'white' : 'black';
    
    // Verify it's this player's turn
    if ((isWhitePlayer && game.currentPlayer !== 'w') || 
        (isBlackPlayer && game.currentPlayer !== 'b')) {
      socket.emit('error', { message: 'Not your turn' });
      return;
    }
    
    try {
      // Validate and make the move
      const result = validateMove(game.boardState, from, to, game.currentPlayer);
      
      // Update the game state
      games[gameId].boardState = result.boardState;
      games[gameId].currentPlayer = game.currentPlayer === 'w' ? 'b' : 'w';
      
      // Check for check/checkmate
      if (result.isCheckmate) {
        games[gameId].gameStatus = 'checkmate';
        
        // Notify all players in the room
        io.to(gameId).emit('gameOver', {
          result: 'checkmate',
          winner: game.currentPlayer,
          message: `${game.currentPlayer === 'w' ? 'White' : 'Black'} wins by checkmate!`
        });
      } else if (result.isCheck) {
        // Notify that the king is in check
        io.to(gameId).emit('check', {
          player: games[gameId].currentPlayer
        });
      }
      
      // Broadcast the updated state to all players in the room
      io.to(gameId).emit('gameState', {
        boardState: games[gameId].boardState,
        currentPlayer: games[gameId].currentPlayer,
        gameStatus: games[gameId].gameStatus
      });
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });
  
  // Offer draw
  socket.on('offerDraw', ({ gameId }) => {
    if (!games[gameId]) return;
    
    const game = games[gameId];
    const isWhitePlayer = socket.id === game.players.white;
    const isBlackPlayer = socket.id === game.players.black;
    
    if (!isWhitePlayer && !isBlackPlayer) return;
    
    const opponent = isWhitePlayer ? game.players.black : game.players.white;
    if (opponent) {
      io.to(opponent).emit('drawOffered', {
        from: isWhitePlayer ? 'white' : 'black'
      });
    }
  });
  
  // Accept draw
  socket.on('acceptDraw', ({ gameId }) => {
    if (!games[gameId]) return;
    
    games[gameId].gameStatus = 'draw';
    
    io.to(gameId).emit('gameOver', {
      result: 'draw',
      message: 'Game ended in a draw by agreement'
    });
  });
  
  // Resign
  socket.on('resign', ({ gameId }) => {
    if (!games[gameId]) return;
    
    const game = games[gameId];
    const isWhitePlayer = socket.id === game.players.white;
    const isBlackPlayer = socket.id === game.players.black;
    
    if (!isWhitePlayer && !isBlackPlayer) return;
    
    games[gameId].gameStatus = 'resigned';
    
    io.to(gameId).emit('gameOver', {
      result: 'resigned',
      winner: isWhitePlayer ? 'black' : 'white',
      message: `${isWhitePlayer ? 'White' : 'Black'} resigned. ${isWhitePlayer ? 'Black' : 'White'} wins!`
    });
  });
  
  // Leave game
  socket.on('leaveGame', ({ gameId }) => {
    leaveGame(socket);
  });
  
  // Handle disconnections
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    leaveGame(socket);
  });
  
  function leaveGame(socket) {
    const gameId = players[socket.id];
    if (!gameId || !games[gameId]) return;
    
    const game = games[gameId];
    
    // Handle player disconnect
    if (game.players.white === socket.id) {
      game.players.white = null;
      io.to(gameId).emit('playerLeft', {
        color: 'white',
        message: 'White player disconnected'
      });
    } 
    else if (game.players.black === socket.id) {
      game.players.black = null;
      io.to(gameId).emit('playerLeft', {
        color: 'black',
        message: 'Black player disconnected'
      });
    }
    else {
      // Remove from spectators
      const index = game.spectators.indexOf(socket.id);
      if (index !== -1) {
        game.spectators.splice(index, 1);
      }
    }
    
    // If both players have left, remove the game
    if (game.players.white === null && game.players.black === null && game.spectators.length === 0) {
      delete games[gameId];
    }
    
    // Remove from players mapping
    delete players[socket.id];
    
    // Leave the room
    socket.leave(gameId);
  }
});

// Helper function to generate a unique game ID
function generateGameId() {
  return Math.random().toString(36).substring(2, 8);
}

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Import your existing chess logic functions here
import { validateMove, getValidMoves } from './utils/chessLogic.js';
