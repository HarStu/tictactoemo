import type { Game } from "./game.ts"
import { generateInitialGame, move } from "./game.ts"
import { SERVER_URL } from './utils/constants.ts'

const BASE_URL = SERVER_URL

export interface TicTacToeMoApi {
  // Function which generates a new game
  createGame(): Promise<Game>

  // Function which retrieves a game associated with a given gameId
  getGame(gameId: string): Promise<Game>

  // Function which retrieves a list of gameId values associated w/ incomplete games
  getPendingGames(): Promise<string[]>

  // Function which delivers a move to a game
  makeMove(gameId: string, x: number, y: number): Promise<Game>
}

export class InMemoryTicTacToeMoApi implements TicTacToeMoApi {
  private games: Map<string, Game> = new Map()

  async createGame(): Promise<Game> {
    const game = generateInitialGame()
    this.games.set(game.id, game)
    return game;
  }

  async getGame(gameId: string): Promise<Game> {
    const game = this.games.get(gameId)
    if (!game) {
      throw new Error(`No game with ID ${gameId} found`)
    } else {
      return game;
    }
  }

  async getPendingGames(): Promise<string[]> {
    const incompleteGames = []
    for (const [id, game] of this.games) {
      if (!game.done) {
        incompleteGames.push(id)
      }
    }
    return incompleteGames
  }

  async makeMove(gameId: string, x: number, y: number): Promise<Game> {
    const curGame = await this.getGame(gameId)
    const newGame = move(curGame, x, y)
    this.games.set(gameId, newGame)
    return newGame
  }
}

export class TicTacToeMoApiClient implements TicTacToeMoApi {
  async createGame(): Promise<Game> {
    const res = await fetch(`${BASE_URL}/api/newGame`)
    const game = await res.json()
    return game
  }

  async getGame(gameId: string): Promise<Game> {
    const res = await fetch(`${BASE_URL}/api/game/${gameId}`)
    const game = await res.json()
    return game
  }

  async getPendingGames(): Promise<string[]> {
    const res = await fetch(`${BASE_URL}/api/pendingGames`)
    const gamesList = await res.json()
    return gamesList
  }

  async makeMove(gameId: string, x: number, y: number): Promise<Game> {
    const res = await fetch(`${BASE_URL}/api/game/${gameId}/move`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ x, y })
    })
    const game = await res.json()
    return game
  }
}

