import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './style.css';
import {telegram} from './telegram';
import {initializeTelegramDisplay} from './telegram-display';
import {lockGestures} from './no-zoom';

lockGestures(document);
initializeTelegramDisplay(telegram);
createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
