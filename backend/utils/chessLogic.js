/**
 * Chess game logic for backend validation
 */

/**
 * Get all valid moves for a piece
 */
function getValidMoves(boardState, position, currentPlayer) {
  const { row, col } = position;
  const piece = boardState[row][col];
  
  // Ensure piece exists and belongs to current player
  if (!piece) {
    throw new Error('No piece at selected position');
  }
  
  if (piece.charAt(0) !== currentPlayer) {
    throw new Error('Not your piece');
  }
  
  const validMoves = [];
  
  // Switch based on piece type
  switch (piece.charAt(1)) {
    case 'P': // Pawn
      validMoves.push(...getPawnMoves(boardState, row, col, currentPlayer));
      break;
    case 'R': // Rook
      validMoves.push(...getRookMoves(boardState, row, col, currentPlayer));
      break;
    case 'N': // Knight
      validMoves.push(...getKnightMoves(boardState, row, col, currentPlayer));
      break;
    case 'B': // Bishop
      validMoves.push(...getBishopMoves(boardState, row, col, currentPlayer));
      break;
    case 'Q': // Queen
      validMoves.push(...getQueenMoves(boardState, row, col, currentPlayer));
      break;
    case 'K': // King
      validMoves.push(...getKingMoves(boardState, row, col, currentPlayer));
      break;
  }
  
  // Filter moves that would put or leave the king in check
  return filterCheckMoves(boardState, row, col, validMoves, currentPlayer);
}

/**
 * Validate and execute a move
 */
function validateMove(boardState, from, to, currentPlayer) {
  const { row: fromRow, col: fromCol } = from;
  const { row: toRow, col: toCol } = to;
  
  // Check if source position has a piece
  const piece = boardState[fromRow][fromCol];
  if (!piece) {
    throw new Error('No piece at source position');
  }
  
  // Check if piece belongs to current player
  if (piece.charAt(0) !== currentPlayer) {
    throw new Error('Not your piece');
  }
  
  // Get valid moves and check if target is valid
  const validMoves = getValidMoves(boardState, from, currentPlayer);
  const isValidMove = validMoves.some(move => move.row === toRow && move.col === toCol);
  
  if (!isValidMove) {
    throw new Error('Invalid move');
  }
  
  // Make the move
  const newBoard = deepCopy(boardState);
  newBoard[toRow][toCol] = piece;
  newBoard[fromRow][fromCol] = null;
  
  // Check if the opponent is in check after move
  const nextPlayer = currentPlayer === 'w' ? 'b' : 'w';
  const isCheck = isKingInCheck(newBoard, nextPlayer);
  const isCheckmate = isCheck && isKingInCheckmate(newBoard, nextPlayer);
  
  return {
    boardState: newBoard,
    gameStatus: isCheckmate ? 'checkmate' : (isCheck ? 'check' : 'active'),
    isCheck,
    isCheckmate
  };
}

/**
 * Get valid pawn moves
 */
function getPawnMoves(boardState, row, col, player) {
  const moves = [];
  const direction = player === 'w' ? -1 : 1;
  const startRow = player === 'w' ? 6 : 1;
  
  // Forward move
  if (isInBounds(row + direction, col) && !boardState[row + direction][col]) {
    moves.push({ row: row + direction, col });
    
    // Double move from start position
    if (row === startRow && !boardState[row + 2 * direction][col]) {
      moves.push({ row: row + 2 * direction, col });
    }
  }
  
  // Captures
  for (let i = -1; i <= 1; i += 2) {
    if (isInBounds(row + direction, col + i)) {
      const target = boardState[row + direction][col + i];
      if (target && target.charAt(0) !== player) {
        moves.push({ row: row + direction, col: col + i });
      }
    }
  }
  
  return moves;
}

/**
 * Get valid rook moves
 */
function getRookMoves(boardState, row, col, player) {
  return getStraightLineMoves(boardState, row, col, player, [
    { rowDir: 0, colDir: 1 },  // right
    { rowDir: 0, colDir: -1 }, // left
    { rowDir: 1, colDir: 0 },  // down
    { rowDir: -1, colDir: 0 }  // up
  ]);
}

/**
 * Get valid knight moves
 */
function getKnightMoves(boardState, row, col, player) {
  const moves = [];
  const knightMoves = [
    { rowOffset: -2, colOffset: -1 },
    { rowOffset: -2, colOffset: 1 },
    { rowOffset: -1, colOffset: -2 },
    { rowOffset: -1, colOffset: 2 },
    { rowOffset: 1, colOffset: -2 },
    { rowOffset: 1, colOffset: 2 },
    { rowOffset: 2, colOffset: -1 },
    { rowOffset: 2, colOffset: 1 }
  ];
  
  for (const move of knightMoves) {
    const targetRow = row + move.rowOffset;
    const targetCol = col + move.colOffset;
    
    if (isInBounds(targetRow, targetCol)) {
      const targetPiece = boardState[targetRow][targetCol];
      if (!targetPiece || targetPiece.charAt(0) !== player) {
        moves.push({ row: targetRow, col: targetCol });
      }
    }
  }
  
  return moves;
}

/**
 * Get valid bishop moves
 */
function getBishopMoves(boardState, row, col, player) {
  return getStraightLineMoves(boardState, row, col, player, [
    { rowDir: 1, colDir: 1 },   // down-right
    { rowDir: 1, colDir: -1 },  // down-left
    { rowDir: -1, colDir: 1 },  // up-right
    { rowDir: -1, colDir: -1 }  // up-left
  ]);
}

/**
 * Get valid queen moves (combination of rook and bishop)
 */
function getQueenMoves(boardState, row, col, player) {
  return [
    ...getRookMoves(boardState, row, col, player),
    ...getBishopMoves(boardState, row, col, player)
  ];
}

/**
 * Get valid king moves
 */
function getKingMoves(boardState, row, col, player) {
  const moves = [];
  
  // Check all 8 surrounding squares
  for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
    for (let colOffset = -1; colOffset <= 1; colOffset++) {
      // Skip the current position
      if (rowOffset === 0 && colOffset === 0) continue;
      
      const targetRow = row + rowOffset;
      const targetCol = col + colOffset;
      
      if (isInBounds(targetRow, targetCol)) {
        const targetPiece = boardState[targetRow][targetCol];
        if (!targetPiece || targetPiece.charAt(0) !== player) {
          moves.push({ row: targetRow, col: targetCol });
        }
      }
    }
  }
  
  return moves;
}

/**
 * Helper function for getting straight line moves (rook, bishop, queen)
 */
function getStraightLineMoves(boardState, row, col, player, directions) {
  const moves = [];
  
  for (const dir of directions) {
    let targetRow = row + dir.rowDir;
    let targetCol = col + dir.colDir;
    
    while (isInBounds(targetRow, targetCol)) {
      const targetPiece = boardState[targetRow][targetCol];
      
      // Empty square - add to valid moves
      if (!targetPiece) {
        moves.push({ row: targetRow, col: targetCol });
      } 
      // Opponent's piece - add to valid moves and stop in this direction
      else if (targetPiece.charAt(0) !== player) {
        moves.push({ row: targetRow, col: targetCol });
        break;
      } 
      // Own piece - stop in this direction
      else {
        break;
      }
      
      targetRow += dir.rowDir;
      targetCol += dir.colDir;
    }
  }
  
  return moves;
}

/**
 * Filter moves that would leave the king in check
 */
function filterCheckMoves(boardState, fromRow, fromCol, moves, player) {
  return moves.filter(move => {
    // Make the move on a copy of the board
    const testBoard = deepCopy(boardState);
    const piece = testBoard[fromRow][fromCol];
    testBoard[move.row][move.col] = piece;
    testBoard[fromRow][fromCol] = null;
    
    // If king is in check after this move, it's invalid
    return !isKingInCheck(testBoard, player);
  });
}

/**
 * Check if a king is in check
 */
function isKingInCheck(boardState, player) {
  // Find the king's position
  let kingRow, kingCol;
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = boardState[row][col];
      if (piece === `${player}K`) {
        kingRow = row;
        kingCol = col;
        break;
      }
    }
    if (kingRow !== undefined) break;
  }
  
  // Check if any opponent's piece can attack the king
  const opponent = player === 'w' ? 'b' : 'w';
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = boardState[row][col];
      
      if (piece && piece.charAt(0) === opponent) {
        const pieceType = piece.charAt(1);
        let canAttackKing = false;
        
        switch (pieceType) {
          case 'P': // Pawn
            canAttackKing = canPawnAttack(row, col, kingRow, kingCol, opponent);
            break;
          case 'R': // Rook
            canAttackKing = canRookAttack(boardState, row, col, kingRow, kingCol);
            break;
          case 'N': // Knight
            canAttackKing = canKnightAttack(row, col, kingRow, kingCol);
            break;
          case 'B': // Bishop
            canAttackKing = canBishopAttack(boardState, row, col, kingRow, kingCol);
            break;
          case 'Q': // Queen
            canAttackKing = canRookAttack(boardState, row, col, kingRow, kingCol) || 
                            canBishopAttack(boardState, row, col, kingRow, kingCol);
            break;
          case 'K': // King
            canAttackKing = Math.abs(row - kingRow) <= 1 && Math.abs(col - kingCol) <= 1;
            break;
        }
        
        if (canAttackKing) return true;
      }
    }
  }
  
  return false;
}

/**
 * Check if a king is in checkmate
 */
function isKingInCheckmate(boardState, player) {
  // Check if any piece can make a move that gets out of check
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = boardState[row][col];
      
      if (piece && piece.charAt(0) === player) {
        const validMoves = getValidMoves(boardState, { row, col }, player);
        
        // Filter moves that would still leave the king in check
        const safeMoves = filterCheckMoves(boardState, row, col, validMoves, player);
        
        if (safeMoves.length > 0) {
          return false; // At least one piece can move to get out of check
        }
      }
    }
  }
  
  return true; // No piece can move to get out of check
}

/**
 * Check if a pawn can attack a specific square
 */
function canPawnAttack(pawnRow, pawnCol, targetRow, targetCol, pawnPlayer) {
  const direction = pawnPlayer === 'w' ? -1 : 1;
  return (
    targetRow === pawnRow + direction &&
    (targetCol === pawnCol + 1 || targetCol === pawnCol - 1)
  );
}

/**
 * Check if a rook can attack a specific square
 */
function canRookAttack(boardState, rookRow, rookCol, targetRow, targetCol) {
  // Rook must be on the same row or column
  if (rookRow !== targetRow && rookCol !== targetCol) {
    return false;
  }
  
  // Check if path is clear
  if (rookRow === targetRow) {
    // Horizontal movement
    const step = rookCol < targetCol ? 1 : -1;
    for (let col = rookCol + step; col !== targetCol; col += step) {
      if (boardState[rookRow][col]) return false; // Path blocked
    }
  } else {
    // Vertical movement
    const step = rookRow < targetRow ? 1 : -1;
    for (let row = rookRow + step; row !== targetRow; row += step) {
      if (boardState[row][rookCol]) return false; // Path blocked
    }
  }
  
  return true;
}

/**
 * Check if a knight can attack a specific square
 */
function canKnightAttack(knightRow, knightCol, targetRow, targetCol) {
  const rowDiff = Math.abs(knightRow - targetRow);
  const colDiff = Math.abs(knightCol - targetCol);
  
  return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
}

/**
 * Check if a bishop can attack a specific square
 */
function canBishopAttack(boardState, bishopRow, bishopCol, targetRow, targetCol) {
  const rowDiff = Math.abs(bishopRow - targetRow);
  const colDiff = Math.abs(bishopCol - targetCol);
  
  // Bishop must move diagonally
  if (rowDiff !== colDiff) {
    return false;
  }
  
  // Check if path is clear
  const rowStep = bishopRow < targetRow ? 1 : -1;
  const colStep = bishopCol < targetCol ? 1 : -1;
  
  let row = bishopRow + rowStep;
  let col = bishopCol + colStep;
  
  while (row !== targetRow && col !== targetCol) {
    if (boardState[row][col]) return false; // Path blocked
    row += rowStep;
    col += colStep;
  }
  
  return true;
}

/**
 * Helper to check if position is within the board
 */
function isInBounds(row, col) {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

/**
 * Deep copy a board state
 */
function deepCopy(board) {
  return board.map(row => [...row]);
}

module.exports = {
  validateMove,
  getValidMoves,
  isKingInCheck,
  isKingInCheckmate
};