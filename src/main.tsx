import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { AudioProvider } from './contexts/AudioContext';
import { SaveGameProvider } from './contexts/SaveGameContext';
import { SpectrumProvider } from './contexts/SpectrumContext';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root not found in document.');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <AudioProvider>
      <SaveGameProvider>
        <SpectrumProvider>
          <App />
        </SpectrumProvider>
      </SaveGameProvider>
    </AudioProvider>
  </React.StrictMode>
);
