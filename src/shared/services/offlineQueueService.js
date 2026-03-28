const OFFLINE_QUEUE_KEY = 'jarvis_offline_action_queue_v1';
const SYNC_VERSION_KEY = 'jarvis_sync_version_map_v1';

export class OfflineQueuedError extends Error {
    constructor(message, actionId) {
        super(message);
        this.name = 'OfflineQueuedError';
        this.actionId = actionId;
    }
}

const readJson = (key, fallback) => {
    try {
        return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
    } catch (_error) {
        return fallback;
    }
};

const writeJson = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
};

const nowIso = () => new Date().toISOString();

export const listQueuedActions = () => readJson(OFFLINE_QUEUE_KEY, []);

export const getPendingActionCount = () => listQueuedActions().filter((item) => item.status === 'queued').length;

export const enqueueAction = ({ type, payload, conflictKey }) => {
    const queue = listQueuedActions();
    const action = {
        id: `${type}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        type,
        payload,
        conflictKey: conflictKey || null,
        status: 'queued',
        attempts: 0,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        lastError: null,
    };

    writeJson(OFFLINE_QUEUE_KEY, [action, ...queue]);
    return action;
};

const updateAction = (actionId, updater) => {
    const queue = listQueuedActions().map((action) => (
        action.id === actionId ? updater(action) : action
    ));
    writeJson(OFFLINE_QUEUE_KEY, queue);
};

export const markActionDone = (actionId) => {
    updateAction(actionId, (action) => ({
        ...action,
        status: 'done',
        updatedAt: nowIso(),
        lastError: null,
    }));
};

export const markActionFailed = (actionId, errorMessage) => {
    updateAction(actionId, (action) => ({
        ...action,
        status: 'queued',
        attempts: action.attempts + 1,
        updatedAt: nowIso(),
        lastError: errorMessage || 'Unknown error',
    }));
};

const readSyncVersions = () => readJson(SYNC_VERSION_KEY, {});

export const getSyncVersion = (conflictKey) => {
    if (!conflictKey) {
        return null;
    }
    return readSyncVersions()[conflictKey] || null;
};

export const setSyncVersion = (conflictKey, timestamp) => {
    if (!conflictKey) {
        return;
    }

    const versions = readSyncVersions();
    versions[conflictKey] = timestamp || nowIso();
    writeJson(SYNC_VERSION_KEY, versions);
};

export const isConflictedAction = (action) => {
    if (!action?.conflictKey) {
        return false;
    }

    const latestVersion = getSyncVersion(action.conflictKey);
    if (!latestVersion) {
        return false;
    }

    return new Date(latestVersion).getTime() > new Date(action.updatedAt).getTime();
};
