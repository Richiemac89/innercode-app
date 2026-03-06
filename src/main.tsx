import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import { UpdateBanner } from './components/UpdateBanner.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <UpdateBanner />
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)

