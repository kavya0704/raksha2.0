import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ErrorBoundary } from './components/ErrorBoundary.jsx'
import './index.css'

// NOTE: StrictMode removed intentionally.
// React 19 StrictMode double-mounts components in dev mode,
// which breaks Leaflet (throws "Map container is already initialized")
// and causes the Web Audio API AudioContext to get suspended/reset.
ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
)
