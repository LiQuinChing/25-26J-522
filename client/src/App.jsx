import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import FAQ from './pages/FAQ'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<FAQ />} />
        <Route path="/faq" element={<FAQ />} />
      </Routes>
    </Router>
  )
}

export default App
