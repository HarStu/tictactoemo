import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import { eq } from 'drizzle-orm';
import { gamesTable } from './schema.ts'
import { generateInitialGame, move } from '../game.ts'
import type { Game, Player, Board } from '../game.ts'
import type { TicTacToeMoApi } from '../api.ts'

const DATABASE_URL = process.env.DATABASE_URL
console.log(DATABASE_URL)
if (!DATABASE_URL) throw Error("no valid database url found")

export class DbTicTacToeMo implements TicTacToeMoApi {

  private db = drizzle(DATABASE_URL as string)

  async createGame(): Promise<Game> {
    const newGame = generateInitialGame()
    const values: typeof gamesTable.$inferInsert = newGame
    await this.db.insert(gamesTable).values(values)
    return newGame
  }

  async getGame(gameId: string): Promise<Game> {
    const res = await this.db.select().from(gamesTable).where(eq(gamesTable.id, gameId))
    if (res.length !== 1) {
      throw new Error(`Erroneous result fetching game ${gameId}! Found ${res.length} results where 1 was expected`)
    } else {
      const resultGame = res[0]
      return {
        id: resultGame.id,
        currentPlayer: resultGame.currentPlayer as Player,
        board: resultGame.board as Board,
        done: resultGame.done,
        contextMessage: resultGame.contextMessage
      }
    }
  }

  async getPendingGames(): Promise<string[]> {
    const res = await this.db.select().from(gamesTable).where(eq(gamesTable.done, false))
    const gameIds = res.map(game => game.id)
    return gameIds
  }

  async makeMove(gameId: string, x: number, y: number): Promise<Game> {
    const curGame = await this.getGame(gameId)
    const newGame = move(curGame, x, y)
    const values: typeof gamesTable.$inferInsert = newGame
    await this.db.update(gamesTable).set(values).where(eq(gamesTable.id, gameId))
    return newGame
  }
}

