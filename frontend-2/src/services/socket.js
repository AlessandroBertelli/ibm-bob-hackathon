import { partyAPI } from './api';

const subscriptions = new Map();
let activeKey = null;
let pollHandle = null;
const POLL_INTERVAL_MS = 1500;

const stopPolling = () => {
    if (pollHandle) {
        clearTimeout(pollHandle);
        pollHandle = null;
    }
};

const tick = async () => {
    const sub = activeKey ? subscriptions.get(activeKey) : null;
    if (!sub) return;
    try {
        const status = await partyAPI.getPartyStatus(sub.sessionId);
        sub.listeners.forEach((cb) => cb(status));
    } catch (err) {
        sub.errorListeners.forEach((cb) => cb(err));
    } finally {
        if (activeKey === sub.sessionId) {
            pollHandle = setTimeout(tick, POLL_INTERVAL_MS);
        }
    }
};

const startPolling = (sessionId) => {
    if (activeKey === sessionId && pollHandle) return;
    stopPolling();
    activeKey = sessionId;
    pollHandle = setTimeout(tick, 0);
};

export const subscribeToParty = (sessionId, onUpdate, onError) => {
    let sub = subscriptions.get(sessionId);
    if (!sub) {
        sub = {
            sessionId,
            listeners: new Set(),
            errorListeners: new Set(),
        };
        subscriptions.set(sessionId, sub);
    }
    if (onUpdate) sub.listeners.add(onUpdate);
    if (onError) sub.errorListeners.add(onError);

    startPolling(sessionId);

    return () => {
        const current = subscriptions.get(sessionId);
        if (!current) return;
        if (onUpdate) current.listeners.delete(onUpdate);
        if (onError) current.errorListeners.delete(onError);
        if (current.listeners.size === 0 && current.errorListeners.size === 0) {
            subscriptions.delete(sessionId);
            if (activeKey === sessionId) {
                activeKey = null;
                stopPolling();
            }
        }
    };
};

export const stopAllSubscriptions = () => {
    subscriptions.clear();
    activeKey = null;
    stopPolling();
};
