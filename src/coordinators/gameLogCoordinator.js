import dayjs from 'dayjs';
import { watch } from 'vue';

import {
    createJoinLeaveEntry,
    createLocationEntry,
    findUserByDisplayName,
    parseLocation,
    replaceBioSymbols
} from '../shared/utils';
import { i18n } from '../plugins/i18n';
import { AppDebug } from '../services/appConfig';
import { database } from '../services/database';
import { runLastLocationResetFlow, runUpdateCurrentUserLocationFlow } from './locationCoordinator';
import { getGroupName } from '../shared/utils';
import { userRequest } from '../api';
import { toast } from 'vue-sonner';

import { useAdvancedSettingsStore } from '../stores/settings/advanced';
import { useFriendStore } from '../stores/friend';
import { useGameStore } from '../stores/game';
import { useGameLogStore } from '../stores/gameLog';
import { useInstanceStore } from '../stores/instance';
import { useLocationStore } from '../stores/location';
import { useModalStore } from '../stores/modal';
import { useNotificationStore } from '../stores/notification';
import { useSharedFeedStore } from '../stores/sharedFeed';
import { useUserStore } from '../stores/user';
import { useVrStore } from '../stores/vr';

/**
 * Loads the player list from game log history and syncs it to
 * locationStore, instanceStore, vrStore, and userStore.
 */
export async function tryLoadPlayerList() {
    const gameStore = useGameStore();
    const locationStore = useLocationStore();
    const userStore = useUserStore();
    const friendStore = useFriendStore();
    const instanceStore = useInstanceStore();
    const vrStore = useVrStore();

    if (!gameStore.isGameRunning) {
        return;
    }
    console.log('Loading player list from game log...');
    let ctx;
    let i;
    let sessionChanged = false;
    // Live updates (including in-place player changes) take precedence over
    // history. Watch synchronously across both asynchronous reads.
    const stopWatching = watch(
        [() => gameStore.isGameRunning, () => locationStore.lastLocation],
        () => {
            sessionChanged = true;
        },
        { deep: true, flush: 'sync' }
    );
    let data;
    let isProcessRunning;
    try {
        data = await database.getGamelogDatabase();
        if (!gameStore.isGameRunning || data.length === 0 || sessionChanged) {
            return;
        }
        // The polling loop awaits this restore, so its stored flag alone
        // cannot detect a process exit during the history read.
        isProcessRunning = await AppApi.IsGameRunning();
    } finally {
        stopWatching();
    }
    if (!isProcessRunning || !gameStore.isGameRunning || sessionChanged) {
        return;
    }
    let length = 0;
    for (i = data.length - 1; i > -1; i--) {
        ctx = data[i];
        if (ctx.type === 'Location') {
            // Older Nexy builds imported VRChat logs. Keep that history, but
            // never restore its player list or request those IDs from NexVR.
            if (ctx.location?.startsWith('wrld_')) {
                return;
            }
            locationStore.setLastLocation({
                date: Date.parse(ctx.created_at),
                location: ctx.location,
                name: ctx.worldName,
                playerList: new Map(),
                friendList: new Map()
            });
            length = i;
            break;
        }
    }
    if (length > 0) {
        for (i = length + 1; i < data.length; i++) {
            ctx = data[i];
            if (ctx.type === 'OnPlayerJoined') {
                if (!ctx.userId) {
                    ctx.userId =
                        findUserByDisplayName(
                            userStore.cachedUsers,
                            ctx.displayName,
                            userStore.cachedUserIdsByDisplayName
                        )?.id ?? '';
                }
                if (!ctx.userId || ctx.userId.startsWith('usr_')) {
                    continue;
                }
                const userMap = {
                    displayName: ctx.displayName,
                    userId: ctx.userId,
                    joinTime: Date.parse(ctx.created_at),
                    lastAvatar: ''
                };
                locationStore.lastLocation.playerList.set(ctx.userId, userMap);
                if (friendStore.friends.has(ctx.userId)) {
                    locationStore.lastLocation.friendList.set(ctx.userId, userMap);
                }
            }
            if (ctx.type === 'OnPlayerLeft') {
                locationStore.lastLocation.playerList.delete(ctx.userId);
                locationStore.lastLocation.friendList.delete(ctx.userId);
            }
        }
        locationStore.lastLocation.playerList.forEach((ref1) => {
            if (ref1.userId && typeof ref1.userId === 'string') {
                if (!userStore.cachedUsers.has(ref1.userId)) {
                    userRequest.getUser({ userId: ref1.userId });
                }
                if (!userStore.cachedProfiles.has(ref1.userId)) {
                    userRequest.getPublicProfile({ userId: ref1.userId });
                }
            }
        });

        runUpdateCurrentUserLocationFlow();
        instanceStore.updateCurrentInstanceWorld();
        vrStore.updateVRLastLocation();
        instanceStore.getCurrentInstanceUserList();
        userStore.applyUserDialogLocation();
        instanceStore.applyWorldDialogInstances();
        instanceStore.applyGroupDialogInstances();
    }
}

/**
 * Core game log entry processor. Dispatches game log events to the
 * appropriate stores based on type.
 *
 * @param {object} gameLog
 * @param {string} location
 */
export async function addGameLogEntry(gameLog, location) {
    const gameLogStore = useGameLogStore();
    const locationStore = useLocationStore();
    const instanceStore = useInstanceStore();
    const userStore = useUserStore();
    const friendStore = useFriendStore();
    const vrStore = useVrStore();
    const gameStore = useGameStore();
    const advancedSettingsStore = useAdvancedSettingsStore();
    const sharedFeedStore = useSharedFeedStore();
    const notificationStore = useNotificationStore();

    let entry = undefined;
    let persistedEntryPromise;
    if (advancedSettingsStore.gameLogDisabled) {
        return;
    }
    let userId = String(gameLog.userId || '');
    if (!userId && gameLog.displayName) {
        userId =
            findUserByDisplayName(userStore.cachedUsers, gameLog.displayName, userStore.cachedUserIdsByDisplayName)
                ?.id ?? '';
    }
    switch (gameLog.type) {
        case 'location':
            instanceStore.addInstanceJoinHistory(locationStore.lastLocation.location, gameLog.dt);
            const worldName = replaceBioSymbols(gameLog.worldName);
            if (gameStore.isGameRunning) {
                await runLastLocationResetFlow(gameLog.dt);
                locationStore.setLastLocation({
                    date: Date.parse(gameLog.dt),
                    location: gameLog.location,
                    name: worldName,
                    playerList: new Map(),
                    friendList: new Map()
                });
                instanceStore.removeQueuedInstance(gameLog.location);
                runUpdateCurrentUserLocationFlow();
                vrStore.updateVRLastLocation();
                instanceStore.updateCurrentInstanceWorld();
                userStore.applyUserDialogLocation();
                instanceStore.applyWorldDialogInstances();
                instanceStore.applyGroupDialogInstances();
            }
            instanceStore.addInstanceJoinHistory(gameLog.location, gameLog.dt);
            const L = parseLocation(gameLog.location);
            entry = createLocationEntry(gameLog.dt, gameLog.location, L.worldId, worldName);
            getGroupName(gameLog.location).then((groupName) => {
                entry.groupName = groupName;
            });
            persistedEntryPromise = gameLogStore.addGamelogLocationToDatabase(entry);
            break;
        case 'player-joined':
            const joinTime = Date.parse(gameLog.dt);
            const userMap = {
                displayName: gameLog.displayName,
                userId,
                joinTime,
                lastAvatar: ''
            };
            locationStore.lastLocation.playerList.set(userId, userMap);
            const ref = userStore.cachedUsers.get(userId);
            if (!userId) {
                console.error('Missing userId:', gameLog.displayName);
            } else if (userId === userStore.currentUser.id) {
                // skip
            } else if (friendStore.friends.has(userId) && typeof ref !== 'undefined') {
                locationStore.lastLocation.friendList.set(userId, userMap);
                friendStore.updateFriendLastSeen(userId, gameLog.dt);
                if (
                    ref.location !== locationStore.lastLocation.location &&
                    ref.travelingToLocation !== locationStore.lastLocation.location
                ) {
                    ref.$location_at = joinTime;
                }
            } else if (typeof ref !== 'undefined') {
                ref.$location_at = joinTime;
            } else {
                if (AppDebug.debugGameLog || AppDebug.debugWebRequests) {
                    console.log('Fetching user from gameLog:', userId);
                }
                userRequest.getUser({ userId });
                userRequest.getPublicProfile({ userId });
            }
            vrStore.updateVRLastLocation();
            instanceStore.getCurrentInstanceUserList();
            entry = createJoinLeaveEntry('OnPlayerJoined', gameLog.dt, gameLog.displayName, location, userId);
            persistedEntryPromise = database.addGamelogJoinLeaveToDatabase(entry);
            break;
        case 'player-left':
            const ref1 = locationStore.lastLocation.playerList.get(userId);
            if (typeof ref1 === 'undefined') {
                break;
            }
            const time = dayjs(gameLog.dt).valueOf() - ref1.joinTime;
            locationStore.lastLocation.playerList.delete(userId);
            locationStore.lastLocation.friendList.delete(userId);
            friendStore.updateFriendLastSeen(userId, gameLog.dt);
            gameLogStore.state.lastLocationAvatarList.delete(gameLog.displayName);
            vrStore.updateVRLastLocation();
            instanceStore.getCurrentInstanceUserList();
            entry = createJoinLeaveEntry('OnPlayerLeft', gameLog.dt, gameLog.displayName, location, userId, time);
            persistedEntryPromise = database.addGamelogJoinLeaveToDatabase(entry);
            break;
    }
    if (typeof entry !== 'undefined') {
        sharedFeedStore.addEntry(entry);
        notificationStore.queueGameLogNoty(entry);
        if (persistedEntryPromise) {
            const persistedEntry = await persistedEntryPromise;
            if (persistedEntry) {
                gameLogStore.addGameLog(persistedEntry);
            }
        } else {
            gameLogStore.addGameLog(entry);
        }
    }
}

/**
 * Shows confirmation dialog before toggling the game log disabled setting.
 */
export async function disableGameLogDialog() {
    const gameStore = useGameStore();
    const advancedSettingsStore = useAdvancedSettingsStore();
    const modalStore = useModalStore();
    const t = i18n.global.t;

    if (gameStore.isGameRunning) {
        toast.error(t('message.gamelog.vrchat_must_be_closed'));
        return;
    }
    if (!advancedSettingsStore.gameLogDisabled) {
        modalStore
            .confirm({
                description: t('confirm.disable_gamelog'),
                title: t('confirm.title')
            })
            .then(({ ok }) => {
                if (!ok) return;
                advancedSettingsStore.setGameLogDisabled();
            })
            .catch(() => {});
    } else {
        advancedSettingsStore.setGameLogDisabled();
    }
}
