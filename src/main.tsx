import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            color: '#0f172a',
            fontWeight: 600,
          },
          success: {
            style: {
              borderColor: '#10b981',
            },
          },
          error: {
            style: {
              borderColor: '#f43f5e',
            },
          },
        }}
      />
    </BrowserRouter>
  </StrictMode>,
)
