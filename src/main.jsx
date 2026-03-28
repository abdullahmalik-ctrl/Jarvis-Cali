import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@app/App.jsx'
import { initErrorMonitoring } from '@shared/services/errorMonitoring'
import './index.css'

initErrorMonitoring();

if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        const registration = await navigator.serviceWorker.register('/Jarvis-Cali/sw.js');

        if (registration.waiting) {
            window.dispatchEvent(new Event('jarvis-update-available'));
        }

        registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (!newWorker) {
                return;
            }

            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    window.dispatchEvent(new Event('jarvis-update-available'));
                }
            });
        });

        navigator.serviceWorker.addEventListener('controllerchange', () => {
            window.location.reload();
        });
    });
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
