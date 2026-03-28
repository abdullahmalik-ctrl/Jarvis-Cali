import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    getPendingActionCount,
    isConflictedAction,
    listQueuedActions,
    markActionDone,
    markActionFailed,
    setSyncVersion,
} from '@shared/services/offlineQueueService';

const useOfflineSync = (processors = {}) => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [pendingCount, setPendingCount] = useState(getPendingActionCount());
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncAt, setLastSyncAt] = useState(null);
    const [updateAvailable, setUpdateAvailable] = useState(false);

    const refreshPendingCount = useCallback(() => {
        setPendingCount(getPendingActionCount());
    }, []);

    const flushQueue = useCallback(async () => {
        if (!navigator.onLine || isSyncing) {
            return;
        }

        const queue = listQueuedActions().filter((item) => item.status === 'queued').reverse();
        if (queue.length === 0) {
            refreshPendingCount();
            return;
        }

        setIsSyncing(true);

        for (const action of queue) {
            const processor = processors[action.type];

            if (!processor) {
                markActionDone(action.id);
                continue;
            }

            if (isConflictedAction(action)) {
                markActionDone(action.id);
                continue;
            }

            try {
                await processor(action.payload, action);
                markActionDone(action.id);
                setSyncVersion(action.conflictKey, new Date().toISOString());
            } catch (error) {
                markActionFailed(action.id, error?.message);
            }
        }

        setIsSyncing(false);
        setLastSyncAt(new Date().toISOString());
        refreshPendingCount();
    }, [isSyncing, processors, refreshPendingCount]);

    const requestBackgroundSync = useCallback(async () => {
        try {
            if (!('serviceWorker' in navigator)) {
                return;
            }

            const registration = await navigator.serviceWorker.ready;
            if ('sync' in registration) {
                await registration.sync.register('jarvis-sync');
                return;
            }

            if (registration.active) {
                registration.active.postMessage({ type: 'REQUEST_SYNC' });
            }
        } catch (_error) {
            // Intentionally ignored because online fallback still runs.
        }
    }, []);

    const applyUpdate = useCallback(async () => {
        if (!('serviceWorker' in navigator)) {
            window.location.reload();
            return;
        }

        const registration = await navigator.serviceWorker.getRegistration();
        if (registration?.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            return;
        }

        window.location.reload();
    }, []);

    useEffect(() => {
        const onOnline = () => {
            setIsOnline(true);
            flushQueue();
        };
        const onOffline = () => setIsOnline(false);
        const onUpdateReady = () => setUpdateAvailable(true);
        const onWorkerMessage = (event) => {
            if (event.data?.type === 'jarvis-sync-now') {
                flushQueue();
            }
        };

        window.addEventListener('online', onOnline);
        window.addEventListener('offline', onOffline);
        window.addEventListener('jarvis-update-available', onUpdateReady);

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', onWorkerMessage);
        }

        return () => {
            window.removeEventListener('online', onOnline);
            window.removeEventListener('offline', onOffline);
            window.removeEventListener('jarvis-update-available', onUpdateReady);
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.removeEventListener('message', onWorkerMessage);
            }
        };
    }, [flushQueue]);

    useEffect(() => {
        refreshPendingCount();
        if (navigator.onLine) {
            flushQueue();
        }
    }, [flushQueue, refreshPendingCount]);

    const status = useMemo(() => ({
        isOnline,
        pendingCount,
        isSyncing,
        lastSyncAt,
        updateAvailable,
    }), [isOnline, pendingCount, isSyncing, lastSyncAt, updateAvailable]);

    return {
        ...status,
        refreshPendingCount,
        flushQueue,
        requestBackgroundSync,
        applyUpdate,
    };
};

export default useOfflineSync;
