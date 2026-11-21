import { Route, Routes } from 'react-router-dom'
import { BoardPage } from './pages/BoardPage'
import { LoginPage } from './pages/LoginPage'

export function App() {
  return (
    <Routes>
      <Route path="/" element={<BoardPage />} />
      <Route path="/login" element={<LoginPage />} />
    </Routes>
  )
}

export default App
