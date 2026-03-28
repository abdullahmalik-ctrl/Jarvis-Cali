import * as Sentry from '@sentry/react';

export const initErrorMonitoring = () => {
    const dsn = import.meta.env.VITE_SENTRY_DSN;
    if (!dsn) {
        return;
    }

    Sentry.init({
        dsn,
        integrations: [Sentry.browserTracingIntegration()],
        tracesSampleRate: 0.1,
        environment: import.meta.env.MODE,
    });
};

export const captureAppError = (error, extra = {}) => {
    if (!import.meta.env.VITE_SENTRY_DSN) {
        return;
    }

    Sentry.captureException(error, { extra });
};
