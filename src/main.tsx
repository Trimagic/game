import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './style.css';
import {telegram} from './telegram';
import {initializeTelegramDisplay} from './telegram-display';
import {lockGestures} from './no-zoom';
import {listenForTaps} from './audio/ui-feedback';
import {sound} from './audio/sound';

lockGestures(document);
listenForTaps(document as never, () => {sound.unlock(); sound.fx('click');});
initializeTelegramDisplay(telegram);
createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
