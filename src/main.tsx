import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import posthog from 'posthog-js';

posthog.init('phc_1EenA4y8XyMZm2fe7pYmlovFJ06lSJFiw3XccyJOnPe', {
  api_host: 'https://us.i.posthog.com',
  defaults: '2025-05-24',
});

createRoot(document.getElementById('root')!).render(<App />);

