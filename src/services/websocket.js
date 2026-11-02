import { reactive } from 'vue';
import { toast } from 'vue-sonner';

import { useNotificationStore, useUserStore } from '../stores';
import { applyUser, applyCurrentUser, getCurrentUser } from '../coordinators/userCoordinator';
import { handleFriendAdd, handleFriendDelete } from '../coordinators/friendRelationshipCoordinator';
import { parseLocation } from '../shared/utils';
import { AppDebug } from './appConfig';
import { presenceState, presenceToUser, toVrcNotification } from './nexvr/mappers';
import { realtime } from './nexvr/realtime';
import { startGameSession } from './nexvr/gameSession';
import { startGroupInstances } from './nexvr/groupInstances';
import { request } from './request';
import { runUpdateFriendFlow } from '../coordinators/friendPresenceCoordinator';
import { runSetCurrentUserLocationFlow } from '../coordinators/locationCoordinator';
import { watchState } from './watchState';

import * as workerTimers from 'worker-timers';

const PING_INTERVAL = 120000; // NexVR shows users offline after 5 minutes unseen

let realtimeAttached = false;
/** @type {(() => void)[]} */
let detachRealtime = [];
/** @type {Set<string>} */
let knownNotificationIds = new Set();
let pingTimer = null;
let webSocketClosedGracefully = true;

/**
 * Reactive WebSocket state for status bar telemetry.
 * - connected: whether the WS is currently open
 * - messageCount: total messages received (used for rate delta)
 */
export const wsState = reactive({
    connected: false,
    messageCount: 0,
    bytesReceived: 0
});

export function initWebsocket() {
    if (!watchState.isFriendsLoaded || realtimeAttached) {
        return;
    }
    return request('auth', {
        method: 'GET'
    })
        .then((json) => {
            if (json.ok) {
                connectWebSocket(json.token);
            }
        })
        .catch((err) => {
            console.error('WebSocket init error:', err);
        });
}

/**
 * Attaches to the NexVR realtime socket (opened at login for the friends
 * snapshot) and replays its updates as the VRChat pipeline events that
 * handlePipeline already understands.
 *
 * @param {string} token
 * @returns {Promise<void>}
 */
async function connectWebSocket(token) {
    const userStore = useUserStore();
    const notificationStore = useNotificationStore();
    if (realtimeAttached) {
        return;
    }
    realtimeAttached = true;
    knownNotificationIds = new Set(realtime.notifications.map((n) => n.id));
    detachRealtime = [
        realtime.on('friends', handleRealtimeFriends),
        realtime.on('notifications', handleRealtimeNotifications),
        realtime.on('message', (bytes) => {
            wsState.messageCount++;
            wsState.bytesReceived += bytes;
        }),
        realtime.on('close', ({ code, reason }) => {
            wsState.connected = false;
            stopPing();
            webSocketClosedGracefully = code === 1000 || code === 1001; // Normal Closure or Going Away
            if (!webSocketClosedGracefully || AppDebug.debugWebSocket) {
                console.log('WebSocket closed', { code, reason });
            }
            detachRealtimeListeners();
            scheduleReconnect();
        })
    ];
    const ok = await realtime.connect(token, userStore.currentUser.id);
    if (!ok) {
        if (!realtime.ws) {
            // rejected before the close listener could fire; getCurrentUser
            // refreshes an expired token before the retry asks for it again
            detachRealtimeListeners();
            webSocketClosedGracefully = false;
            getCurrentUser().catch(() => {});
            scheduleReconnect();
        }
        return;
    }
    wsState.connected = true;
    startPing();
    // Game Log and Player List from the NexVR session; stopped with the other listeners
    detachRealtime.push(startGameSession());
    detachRealtime.push(startGroupInstances());
    if (!webSocketClosedGracefully && watchState.isLoggedIn && watchState.isFriendsLoaded) {
        console.warn('WebSocket reconnected after unexpected closure');
        webSocketClosedGracefully = true;
        notificationStore.refreshNotifications();
    }
    if (AppDebug.debugWebSocket) {
        console.log('WebSocket connected');
    }
}

function scheduleReconnect() {
    workerTimers.setTimeout(() => {
        if (watchState.isLoggedIn && watchState.isFriendsLoaded && !realtimeAttached) {
            initWebsocket();
        }
    }, 5000);
}

function detachRealtimeListeners() {
    for (const off of detachRealtime) {
        off();
    }
    detachRealtime = [];
    realtimeAttached = false;
}

function startPing() {
    stopPing();
    const ping = () => request('users/me/ping', { method: 'POST' }).catch(() => {});
    ping();
    pingTimer = workerTimers.setInterval(ping, PING_INTERVAL);
}

function stopPing() {
    if (pingTimer !== null) {
        workerTimers.clearInterval(pingTimer);
        pingTimer = null;
    }
}

/**
 * @param {string} type
 * @param {any} content
 */
function emitPipeline(type, content) {
    if (AppDebug.debugWebSocket) {
        const user = useUserStore().cachedUsers.get(content?.userId);
        console.log('WebSocket', type, user?.displayName ?? '', content);
    }
    try {
        handlePipeline({ json: { type, content } });
    } catch (err) {
        console.error(err);
    }
}

/**
 * @param {{ snapshot: boolean; changed: [any, any][]; removed: any[] }} update
 */
function handleRealtimeFriends({ snapshot, changed, removed }) {
    if (snapshot) {
        // the login snapshot was already consumed through auth/user
        return;
    }
    const currentUserId = useUserStore().currentUser.id;
    for (const [prev, next] of changed) {
        const now = presenceState(next);
        if (next.userId === currentUserId) {
            if (!prev || presenceState(prev).location !== now.location) {
                emitPipeline('user-location', {
                    userId: currentUserId,
                    location: now.state === 'online' ? now.location : 'offline',
                    travelingToLocation: ''
                });
            }
            continue;
        }
        const user = presenceToUser(next, useUserStore().cachedUsers.get(next.userId)?.tags);
        if (!prev) {
            emitPipeline('friend-add', { userId: next.userId, user });
            continue;
        }
        const before = presenceState(prev);
        if (now.state !== before.state) {
            if (now.state === 'offline') {
                emitPipeline('friend-offline', { userId: next.userId, platform: '' });
            } else if (now.state === 'active') {
                emitPipeline('friend-active', { userId: next.userId, platform: 'web', user });
            } else {
                emitPipeline('friend-online', {
                    userId: next.userId,
                    platform: 'standalonewindows',
                    location: now.location,
                    worldId: now.worldId,
                    travelingToLocation: '',
                    user
                });
            }
        } else if (now.location !== before.location) {
            emitPipeline('friend-location', {
                userId: next.userId,
                location: now.location,
                worldId: now.worldId,
                travelingToLocation: '',
                user
            });
        } else {
            emitPipeline('friend-update', { userId: next.userId, user });
        }
    }
    for (const prev of removed) {
        if (prev.userId !== currentUserId) {
            emitPipeline('friend-delete', { userId: prev.userId });
        }
    }
}

/**
 * NexVR pushes the whole list on every change; diff it into the add and hide
 * events VRChat sent one at a time.
 *
 * @param {any[]} list
 */
function handleRealtimeNotifications(list) {
    const userStore = useUserStore();
    const ids = new Set();
    for (const notification of list) {
        ids.add(notification.id);
        if (knownNotificationIds.has(notification.id)) {
            continue;
        }
        const json = toVrcNotification(notification);
        if (!json.senderUsername) {
            json.senderUsername =
                realtime.friends.get(json.senderUserId)?.displayName ??
                userStore.cachedUsers.get(json.senderUserId)?.displayName ??
                '';
        }
        emitPipeline('notification', json);
    }
    for (const id of knownNotificationIds) {
        if (!ids.has(id)) {
            emitPipeline('hide-notification', id);
        }
    }
    knownNotificationIds = ids;
}

/**
 * @returns {void}
 */
export function closeWebSocket() {
    stopPing();
    detachRealtimeListeners();
    realtime.disconnect();
    wsState.connected = false;
}

/**
 * @returns {void}
 */
export function reconnectWebSocket() {
    if (!watchState.isLoggedIn || !watchState.isFriendsLoaded) {
        return;
    }
    closeWebSocket();
    initWebsocket();
}

/**
 * @param {object} args
 */
function handlePipeline(args) {
    const userStore = useUserStore();

    const notificationStore = useNotificationStore();
    const { type, content, err } = args.json;
    if (typeof err !== 'undefined') {
        console.error('PIPELINE: error', args);
        if (AppDebug.errorNoty) {
            toast.dismiss(AppDebug.errorNoty);
        }
        AppDebug.errorNoty = toast.error(`WebSocket Error: ${err}`);
        return;
    }
    if (typeof content === 'undefined') {
        console.error('PIPELINE: missing content', args);
        return;
    }
    if (typeof content.user !== 'undefined') {
        // I forgot about this...
        delete content.user.state;
    }
    switch (type) {
        case 'notification':
            notificationStore.handleNotification({
                json: content,
                params: {
                    notificationId: content.id
                }
            });
            notificationStore.handlePipelineNotification({
                json: content,
                params: {
                    notificationId: content.id
                }
            });
            break;

        case 'hide-notification':
            notificationStore.handleNotificationHide(content);
            notificationStore.handleNotificationSee(content);
            break;

        case 'friend-add':
            applyUser(content.user);
            handleFriendAdd({
                params: {
                    userId: content.userId
                }
            });
            break;

        case 'friend-delete':
            handleFriendDelete({
                params: {
                    userId: content.userId
                }
            });
            break;

        case 'friend-online':
            // Where is instanceId, travelingToWorld, travelingToInstance?
            // More JANK, what a mess
            const $location = parseLocation(content.location);
            const $travelingToLocation = parseLocation(content.travelingToLocation);
            if (content?.user?.id) {
                const onlineJson = {
                    id: content.userId,
                    platform: content.platform,
                    state: 'online',

                    location: content.location,
                    worldId: content.worldId,
                    instanceId: $location.instanceId,
                    travelingToLocation: content.travelingToLocation,
                    travelingToWorld: $travelingToLocation.worldId,
                    travelingToInstance: $travelingToLocation.instanceId,

                    ...content.user
                };
                applyUser(onlineJson);
            } else {
                console.error('friend-online missing user id', content);
                runUpdateFriendFlow(content.userId, 'online');
            }
            break;

        case 'friend-active':
            if (content?.user?.id) {
                const activeJson = {
                    id: content.userId,
                    platform: content.platform,
                    state: 'active',

                    location: 'offline',
                    worldId: 'offline',
                    instanceId: 'offline',
                    travelingToLocation: 'offline',
                    travelingToWorld: 'offline',
                    travelingToInstance: 'offline',

                    ...content.user
                };
                applyUser(activeJson);
            } else {
                console.error('friend-active missing user id', content);
                runUpdateFriendFlow(content.userId, 'active');
            }
            break;

        case 'friend-offline':
            // more JANK, hell yeah
            const offlineJson = {
                id: content.userId,
                platform: content.platform,
                state: 'offline',

                location: 'offline',
                worldId: 'offline',
                instanceId: 'offline',
                travelingToLocation: 'offline',
                travelingToWorld: 'offline',
                travelingToInstance: 'offline'
            };
            // @ts-ignore
            applyUser(offlineJson);
            break;

        case 'friend-update':
            applyUser(content.user);
            break;

        case 'friend-location':
            const $location1 = parseLocation(content.location);
            const $travelingToLocation1 = parseLocation(content.travelingToLocation);
            if (!content?.user?.id) {
                console.error('friend-location missing user id', content);
                const jankLocationJson = {
                    id: content.userId,
                    location: content.location,
                    worldId: content.worldId,
                    instanceId: $location1.instanceId,
                    travelingToLocation: content.travelingToLocation,
                    travelingToWorld: $travelingToLocation1.worldId,
                    travelingToInstance: $travelingToLocation1.instanceId
                };
                // @ts-ignore
                applyUser(jankLocationJson);
                break;
            }
            const locationJson = {
                location: content.location,
                worldId: content.worldId,
                instanceId: $location1.instanceId,
                travelingToLocation: content.travelingToLocation,
                travelingToWorld: $travelingToLocation1.worldId,
                travelingToInstance: $travelingToLocation1.instanceId,
                ...content.user,
                state: 'online' // JANK
            };
            applyUser(locationJson);

            break;

        case 'user-update':
            applyCurrentUser(content.user);
            break;

        case 'user-location':
            // update current user location
            if (content.userId !== userStore.currentUser.id) {
                console.error('user-location wrong userId', content);
                break;
            }

            // content.user: {} // we don't trust this
            // content.world: {} // this is long gone
            // content.worldId // where did worldId go?
            // content.instance // without worldId, this is useless

            runSetCurrentUserLocationFlow(content.location, content.travelingToLocation);
            break;

        default:
            console.log('Unknown pipeline type', args.json);
    }
}
