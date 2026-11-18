import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './style.css';
import {telegram} from './telegram';
import {initializeTelegramDisplay} from './telegram-display';
import {lockGestures} from './no-zoom';
import {showErrors} from './error-report';
import {reloadOnStaleChunks} from './stale-reload';
import {listenForTaps} from './audio/ui-feedback';
import {sound} from './audio/sound';

lockGestures(document);
showErrors();
reloadOnStaleChunks(window, (() => { try { return sessionStorage; } catch { return undefined; } })(), () => location.reload());
listenForTaps(document as never, () => {sound.unlock(); sound.fx('click');});
initializeTelegramDisplay(telegram);
createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
