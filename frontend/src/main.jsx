console.log('DEBUG: main.jsx executing');

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

try {
  console.log('Try block starting');
  const rootElement = document.getElementById('root');
  if (rootElement) {
    const root = createRoot(rootElement);
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    console.log('App Render attempted');
  }
} catch (e) {
  console.error('CRASH:', e);
}
