import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log("LifeHub main.tsx starting core initialization...");
if (!document.getElementById('root')) {
  console.error("Critical: 'root' element not found in DOM!");
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
