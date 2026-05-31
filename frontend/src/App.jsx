import React, { useState, useCallback } from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import UploadPage from './pages/UploadPage'
import AnalysisPage from './pages/AnalysisPage'
import DashboardPage from './pages/DashboardPage'
import { AppContext } from './context/AppContext'

export default function App() {
  const [theme, setTheme] = useState('dark')
  const [sessionId, setSessionId] = useState(null)
  const [uploadData, setUploadData] = useState(null)
  const [analysisResults, setAnalysisResults] = useState(null)

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.className = next
  }

  // Clears all session state so the user can start a fresh analysis
  const resetSession = useCallback(() => {
    setSessionId(null)
    setUploadData(null)
    setAnalysisResults(null)
  }, [])

  return (
    <AppContext.Provider value={{
      theme, toggleTheme,
      sessionId, setSessionId,
      uploadData, setUploadData,
      analysisResults, setAnalysisResults,
      resetSession,
    }}>
      <div className={`min-h-screen ${theme}`}>
        <Navbar />
        <main>
          <Routes>
            <Route path="/"          element={<HomePage />} />
            <Route path="/upload"    element={<UploadPage />} />
            <Route path="/analysis"  element={<AnalysisPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
          </Routes>
        </main>
      </div>
    </AppContext.Provider>
  )
}
