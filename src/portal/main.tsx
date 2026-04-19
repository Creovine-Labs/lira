import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './portal.css'

createRoot(document.getElementById('lira-portal')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
