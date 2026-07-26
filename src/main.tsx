import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'

import './index.css'
import App from './App'
import { enforceHostRouting } from './host-routing'

// Send the request to the right host (apex = marketing, app. = product) before
// we render anything. If a redirect fires, don't bother mounting React.
if (!enforceHostRouting()) {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <HelmetProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </HelmetProvider>
    </StrictMode>
  )
}
