export type Cell = 'x' | 'o' | 'y' | null
export type Board = Cell[][]
export type Player = 'x' | 'o' | 'y'

export type Game = {
  id: string
  currentPlayer: Player
  board: Board
  done: boolean
  contextMessage: string
}

export function generateInitialGame(): Game {
  const newGame: Game = {
    id: crypto.randomUUID(),
    currentPlayer: 'x',
    board: [[null, null, null, null, null], [null, null, null, null, null], [null, null, null, null, null]],
    done: false,
    contextMessage: "It's x's Turn",
  }
  return newGame
}

export function move(curGame: Game, cellx: number, celly: number): Game {
  if (curGame.done) {
    // The game is over! Return an exact copy
    return curGame;
  }

  // if the cell is as-of-yet unclicked
  if (curGame.board[celly][cellx] === null) {
    // create a structured clone
    const newGame = structuredClone(curGame)

    // set the value of the cell to the current player's identifier
    newGame.board[celly][cellx] = newGame.currentPlayer

    // check if the game has been won
    // if it hasn't...
    if (!checkWin(newGame)) {
      // move to the next player
      if (newGame.currentPlayer === 'x') {
        newGame.currentPlayer = 'o';
      } else if (newGame.currentPlayer === 'o') {
        newGame.currentPlayer = 'y';
      } else if (newGame.currentPlayer === 'y') {
        newGame.currentPlayer = 'x';
      }
      // Set the context messages
      newGame.contextMessage = `It's ${newGame.currentPlayer}'s Turn`;

      // Check if we've reached a tie
      if (checkTie(newGame)) {
        newGame.contextMessage = 'Tie Game';
        newGame.done = true;
      }

      // return the game
      return newGame;
    } else {
      // the player who last moved won!
      newGame.done = true;
      newGame.contextMessage = `Player ${newGame.currentPlayer} has won!`;
      //console.log('WIN!');
      return newGame;
    }

  } else {
    return curGame
  }
}

export function checkWin(curGame: Game): boolean {
  //console.log("Checking for a win on this board:")
  //logBoard(curGame)
  // check for a vertical win
  for (let x = 0; x < 5; x++) {
    const cols = [
      curGame.board[0][x],
      curGame.board[1][x],
      curGame.board[2][x]
    ]
    //console.log(`cols checked: ${cols}`)
    if (cols.every(val => val !== null) && new Set(cols).size === 1) {
      //console.log('Win found')
      return true
    }
  }

  // check for a horizontal win
  for (let i = 0; i < 3; i++) {
    for (let y = 0; y < 3; y++) {
      const rows = [
        curGame.board[y][0 + i],
        curGame.board[y][1 + i],
        curGame.board[y][2 + i]
      ]
      // console.log(`Rows checked: ${rows}`)
      if (rows.every(val => val !== null) && new Set(rows).size === 1) {
        console.log('Win found')
        return true
      }
    }
  }

  // check for a negative slope diag win
  for (let i = 0; i < 3; i++) {
    const negDiags = [
      curGame.board[0][0 + i],
      curGame.board[1][1 + i],
      curGame.board[2][2 + i]
    ]
    //console.log(`Negative slope diagonals checked: ${negDiags}`)
    if (negDiags.every(val => val !== null) && new Set(negDiags).size === 1) {
      console.log('Win found')
      return true
    }
  }

  // check for a positive slope diag win 
  for (let i = 0; i < 3; i++) {
    const posDiags = [
      curGame.board[0][2 + i],
      curGame.board[1][1 + i],
      curGame.board[2][0 + i]
    ]
    //console.log(`Positive slope diagonals checked: ${posDiags}`)
    if (posDiags.every(val => val !== null) && new Set(posDiags).size === 1) {
      console.log('Win found')
      return true
    }
  }

  //console.log('No win')
  return false
}

export function checkTie(curGame: Game): boolean {
  if (curGame.board.flat().includes(null)) {
    return false
  } else {
    return true
  }
}