import { toast } from 'vue-sonner';

import { isRealInstance } from '../shared/utils';
import { database } from '../services/database';
import { useAdvancedSettingsStore } from '../stores/settings/advanced';
import { useGameLogStore } from '../stores/gameLog';
import { useGameStore } from '../stores/game';
import { useInstanceStore } from '../stores/instance';
import { useLaunchStore } from '../stores/launch';
import { useLocationStore } from '../stores/location';
import { runLastLocationResetFlow } from './locationCoordinator';
import { tryLoadPlayerList } from './gameLogCoordinator';
import { useNotificationStore } from '../stores/notification';
import { useUpdateLoopStore } from '../stores/updateLoop';
import { useUserStore } from '../stores/user';
import { useVrStore } from '../stores/vr';
import { watchState } from '../services/watchState';

import configRepository from '../services/config';

import * as workerTimers from 'worker-timers';

/**
 * Runs shared side effects when game running state changes.
 *
 * @param {boolean} isGameRunning Whether VRChat is running.
 */
export async function runGameRunningChangedFlow(isGameRunning) {
    const userStore = useUserStore();
    const instanceStore = useInstanceStore();
    const updateLoopStore = useUpdateLoopStore();
    const vrStore = useVrStore();
    const gameStore = useGameStore();

    if (isGameRunning) {
        userStore.markCurrentUserGameStarted();
    } else {
        await configRepository.setBool('isGameNoVR', gameStore.isGameNoVR);
        // persist last session data before markCurrentUserGameStopped resets $online_for
        const sessionStart = userStore.currentUser.$online_for;
        const offlineAt = Date.now();
        if (sessionStart && sessionStart > 0) {
            const sessionDuration = offlineAt - sessionStart;
            // set store state synchronously so UI reads it immediately
            gameStore.setLastSession(sessionDuration, offlineAt);
            await Promise.all([
                configRepository.setString('VRCX_lastGameSessionMs', String(sessionDuration)),
                configRepository.setString('VRCX_lastGameOfflineAt', String(offlineAt))
            ]);
        }
        userStore.markCurrentUserGameStopped();
        instanceStore.removeAllQueuedInstances();
        runCheckIfGameCrashedFlow();
        updateLoopStore.setIpcTimeout(0);
    }

    await runLastLocationResetFlow();
    vrStore.updateVRLastLocation();
}

/**
 * Orchestrates the game running state update from IPC.
 *
 * @param {boolean} isGameRunningArg Game running flag from IPC.
 * @param {boolean} isSteamVRRunningArg SteamVR running flag from IPC.
 */
export async function runUpdateIsGameRunningFlow(isGameRunningArg, isSteamVRRunningArg) {
    const gameStore = useGameStore();
    const advancedSettingsStore = useAdvancedSettingsStore();
    const vrStore = useVrStore();

    if (advancedSettingsStore.gameLogDisabled) {
        return;
    }
    if (isGameRunningArg !== gameStore.isGameRunning) {
        gameStore.setIsGameRunning(isGameRunningArg);
        await runGameRunningChangedFlow(isGameRunningArg);
        if (isGameRunningArg && watchState.isFriendsLoaded) {
            // Friends may have loaded before game detection. Restore after
            // the running-state flow finishes resetting the previous location.
            await tryLoadPlayerList();
        }
        console.log(new Date(), 'isGameRunning', isGameRunningArg);
    }

    if (isSteamVRRunningArg !== gameStore.isSteamVRRunning) {
        gameStore.setIsSteamVRRunning(isSteamVRRunningArg);
        console.log('isSteamVRRunning:', isSteamVRRunningArg);
    }
    vrStore.updateOpenVR();
}

/**
 * Orchestrates the HMD AFK state update from IPC.
 *
 * @param {boolean} isHmdAfkArg HMD AFK flag from VR polling.
 */
export function runUpdateIsHmdAfkFlow(isHmdAfkArg) {
    const gameStore = useGameStore();

    if (isHmdAfkArg !== gameStore.isHmdAfk) {
        gameStore.setIsHmdAfk(isHmdAfkArg);
        console.log('isHmdAfk', isHmdAfkArg);
    }
}

/**
 * Checks if NexVR crashed, going by its Player.log, and attempts to relaunch.
 */
export function runCheckIfGameCrashedFlow() {
    const advancedSettingsStore = useAdvancedSettingsStore();
    const locationStore = useLocationStore();
    const gameStore = useGameStore();

    if (!advancedSettingsStore.relaunchVRChatAfterCrash) {
        return;
    }
    const { location } = locationStore.lastLocation;
    AppApi.GameClosedGracefully().then((result) => {
        if (result || !isRealInstance(location)) {
            return;
        }
        // check if relaunched less than 2mins ago (prevent crash loop)
        if (
            gameStore.state.lastCrashedTime &&
            new Date().getTime() - gameStore.state.lastCrashedTime.getTime() < 120_000
        ) {
            console.log('NexVR was recently crashed, not relaunching');
            return;
        }
        gameStore.setLastCrashedTime(new Date());
        // wait a bit for SteamVR to potentially close before deciding to relaunch
        let restartDelay = 8000;
        if (gameStore.isGameNoVR) {
            // wait for game to close before relaunching
            restartDelay = 2000;
        }
        workerTimers.setTimeout(() => runRestartCrashedGameFlow(location), restartDelay);
    });
}

/**
 * Restarts NexVR after a crash.
 *
 * @param {string} location Last known location to relaunch.
 */
async function runRestartCrashedGameFlow(location) {
    const gameStore = useGameStore();
    const notificationStore = useNotificationStore();
    const gameLogStore = useGameLogStore();
    const launchStore = useLaunchStore();

    if (!gameStore.isGameNoVR && !gameStore.isSteamVRRunning) {
        console.log("SteamVR isn't running, not relaunching NexVR");
        return;
    }
    window.electron.focusWindow();
    const message = 'NexVR crashed, attempting to rejoin last instance';
    toast(message);
    const entry = {
        created_at: new Date().toJSON(),
        type: 'Event',
        data: message
    };
    notificationStore.queueGameLogNoty(entry);
    const persistedEntry = await database.addGamelogEventToDatabase(entry);
    if (persistedEntry) {
        gameLogStore.addGameLog(persistedEntry);
    }
    launchStore.launchGame(location, '', gameStore.isGameNoVR);
}
