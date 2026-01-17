import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/index.css'

import { GlobalErrorBoundary } from './components/ErrorBoundaries/GlobalErrorBoundary'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <GlobalErrorBoundary>
            <App />
        </GlobalErrorBoundary>
    </React.StrictMode>,
)
