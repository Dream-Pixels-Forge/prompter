import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';

const root = document.getElementById('root');
ReactDOM.createRoot(root ?? document.createElement('div')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
