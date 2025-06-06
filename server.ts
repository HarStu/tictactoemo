import express from "express"
import ViteExpress from "vite-express";
import type { Game } from './src/game.ts'
import { InMemoryTicTacToeMoApi } from "./src/api.ts"
import { DbTicTacToeMo } from "./src/db/db.ts"
import { Server } from "socket.io"
import { USER_JOINED, GAME_UPDATED, REQUEST_GAME } from './constants.ts'
import { CLIENT_URL } from './src/utils/constants.ts'
import cors from "cors"

const PORT = 3000;
const app = express();
app.use(express.json());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST']
}))

// utility function for generating consistent roomIds from games
const makeRoomId = (game: Game) => `room-${game.id}`

const api = new DbTicTacToeMo();

// express server endpoints
app.get("/api/newGame", async (req, res) => {
  try {
    const newGame = await api.createGame()
    res.status(200).json(newGame)
  } catch {
    res.status(404).json({ error: `Error fetching new game` })
  }
})

app.get("/api/pendingGames", async (req, res) => {
  try {
    const gamesList = await api.getPendingGames()
    res.status(200).json(gamesList)
  } catch (err) {
    res.status(404).json({ error: `Error fetching gamesList: ${err}` })
  }
})

app.get("/api/game/:id", async (req, res) => {
  try {
    const requestedGame = await api.getGame(req.params.id)
    res.status(200).json(requestedGame)
  } catch {
    res.status(404).json({ error: `Error fetching existing game` })
  }
})

app.post("/api/game/:id/move", async (req, res) => {
  try {
    if ('x' in req.body && 'y' in req.body) {
      const updatedGame = await api.makeMove(req.params.id, req.body.x, req.body.y)
      // once the game has been updated, send an event to all the connections in the associated room
      // include the game as a payload
      io.to(makeRoomId(updatedGame)).emit(GAME_UPDATED, updatedGame)
      res.status(200).json(updatedGame)
    } else {
      res.status(400).json({ error: `Error posting move to game` })
    }
  } catch {
    res.status(404).send({ error: `Error posting move to game` })
  }
})

// Create an http server running out express event handler
const server = app.listen(PORT, () => console.log(`Server is listening`))

// Share the http server we've created with socket.io
// Setup CORS for socket.io server?
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  }
})

// Setup the socket server's behavior in response to a new connection
io.on('connection', (socket) => {
  // log the unique id of the connection
  console.log(`a user connected: ${socket.id}`)

  // setup future behavior for this connection
  // when this connection sends a 'join-game' signal + gameId, trigger the following function
  socket.on('join-game', async (gameId: string) => {
    // get the game associated with the gameId and check that it exists
    const game = await api.getGame(gameId)
    if (!game) {
      console.error(`Game ${gameId} not found`)
      return;
    }
    // create a roomId from the game id
    const roomId = makeRoomId(game)
    // add this connection to that room and log such
    socket.join(roomId)
    console.log(`Socket ${socket.id} joined room ${roomId}`)
    // send a signal to all the other connections in this room, letting them know the new connection joined
    io.to(roomId).emit(USER_JOINED, socket.id)
  })

  // when this connection sends a request-game signal, give them that game
  socket.on(REQUEST_GAME, async (gameId: string) => {
    console.log(`Received request for game ${gameId} from ${socket.id}`)
    const game = await api.getGame(gameId)
    io.to(socket.id).emit(GAME_UPDATED, game)
  })
})
