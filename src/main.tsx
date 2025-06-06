import { createRoot } from 'react-dom/client'
import { createBrowserRouter, redirect, RouterProvider } from 'react-router'
import { TicTacToeMoApiClient } from './api'
import { Lobby } from './Lobby.tsx'
import { GameView } from './GameView.tsx'
import App from './App.tsx'
import './index.css'

const api = new TicTacToeMoApiClient()

const router = createBrowserRouter([
  {
    path: '/',
    Component: App,
    children: [
      {
        path: '/',
        Component: Lobby,
        loader: async () => {
          const pendingGames = await api.getPendingGames()
          return { pendingGames }
        }
      },
      {
        path: '/game/:gameId',
        Component: GameView,
      },
      {
        path: '/game/new',
        loader: async () => {
          const newGame = await api.createGame()
          console.log(JSON.stringify(newGame))
          console.log(newGame.id)
          return redirect(`/game/${newGame.id}`)
        }
      }
    ]
  },
])

createRoot(document.getElementById('root')!).render(
  <RouterProvider router={router} />
)
