import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import Index from './index.tsx'
import Help from './help.tsx'
import Leaderboard from './leaderboard.tsx'
import GameSession from './gameSession.tsx'
import { BrowserRouter, Route, Routes } from 'react-router-dom'




ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
    <Routes>
        <Route path="/">
          <Route index element={<Index />} />
          <Route path="help" element={<Help />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="gamesession" element={<GameSession />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
