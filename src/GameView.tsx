import { useState, useEffect, useMemo, useOptimistic } from 'react'
import { Link, useLoaderData, useParams } from 'react-router'
import type { Game, Board } from './game.ts'
import { NewGameButton } from './NewGameButton.tsx'
import { TicTacToeMoApiClient } from './api.ts'
import { io } from "socket.io-client"
import { GAME_UPDATED, USER_JOINED, REQUEST_GAME } from '../constants'

// Utility function used to produced the class string for a cell at a given coordinate 
function getCellClassString(curGame: Game, x: number, y: number) {
  const baseClass = 'flex outline-2 aspect-square w-16 justify-center items-center'

  let curPlayerHoverColor = ''
  if (curGame.currentPlayer == 'x') {
    curPlayerHoverColor = ' hover:bg-red-100'
  } else if (curGame.currentPlayer == 'o') {
    curPlayerHoverColor = ' hover:bg-blue-100'
  } else {
    curPlayerHoverColor = ' hover:bg-green-100'
  }

  if (curGame.board[x][y] === 'x') {
    return baseClass + ' outline-red-800 bg-red-200';
  } else if (curGame.board[x][y] === 'o') {
    return baseClass + ' outline-blue-800 bg-blue-200';
  } else if (curGame.board[x][y] === 'y') {
    return baseClass + ' outline-green-800 bg-green-200';
  } else {
    return baseClass + ' bg-gray-200' + curPlayerHoverColor;
  }
}


type ContextDisplayProps = { contextMessage: string }
function ContextDisplay({ contextMessage }: ContextDisplayProps) {
  return (
    <div className="font-bold">
      {contextMessage}
    </div>
  )
}

type PostGameButtonsProps = { curGame: Game }
function PostGameButtons({ curGame }: PostGameButtonsProps) {
  let classString = "flex outline-2 h-8 w-24 justify-center items-center bg-gray-200 hover:bg-gray-300 hover:cursor-pointer"
  if (!curGame.done) {
    return (
      <Link className={classString} to="/">
        Lobby
      </Link>
    )
  } else {
    return (
      <div className="flex flex-row gap-4">
        < NewGameButton />
        <Link className={classString} to="/">
          Lobby
        </Link>
      </div >
    )
  }
}

type CellProps = {
  curGame: Game
  x: number
  y: number
}
function CellDisplay({ curGame, x, y }: CellProps) {
  if (curGame.board[y][x] === null) {
    return null
  } else {
    return curGame.board[y][x]
  }
}

export function GameView() {
  const api = useMemo(() => new TicTacToeMoApiClient(), [])
  const { gameId } = useParams()
  const [game, setGame] = useState<Game | undefined>(undefined)

  useEffect(() => {
    // setup the socket client
    const socket = io('http://localhost:3000')
    socket.on("connect", () => {
      console.log('connected to socket')
      // send a signal about joining the game room
      socket.emit('join-game', gameId)

      // set the socket client to update the game when it receives a 'GAME_UPDATE' signal
      socket.on(GAME_UPDATED, (game: Game) => {
        console.log(`game updated\n${JSON.stringify(game)}`)
        setGame(game)
      })

      // request a copy of the game associated with this ID
      socket.emit(REQUEST_GAME, gameId)
    })
  }, [gameId])

  const moveAndSetGame = async (id: string, x: number, y: number) => {
    if (!game || game.done) return;
    let newBoard: Board = game.board;
    newBoard[y][x] = game.currentPlayer;
    setGame({ ...game, board: newBoard })
    const newGame = await api.makeMove(id, x, y)
    console.log(`Game obtained from moveAndSetGame: ${newGame}`)
    setGame(newGame);
  }

  if (!game) {
    return (
      <div>
        Now Loading...
      </div>
    )
  } else {
    return (
      <div className="flex flex-col min-h-screen gap-4 justify-center items-center bg-gray-100">
        <h1 className="font-bold">Tic Tac Toe Mo</h1>
        <h2 className="font-thin text-xs">{game.id}</h2>
        <div className="grid grid-cols-5 gap-2 max-w-fit">
          {
            game.board.map((row, rowIndex) =>
              row.map((cell, cellIndex) =>
                <div
                  key={`${cellIndex}, ${rowIndex}`}
                  onClick={() => moveAndSetGame(game.id, cellIndex, rowIndex)}
                  className={getCellClassString(game, rowIndex, cellIndex)}
                >
                  <CellDisplay curGame={game} x={cellIndex} y={rowIndex} />
                </div>
              ))
          }
        </div>
        <ContextDisplay contextMessage={game.contextMessage} />
        <PostGameButtons curGame={game} />
      </div >
    )
  }
}