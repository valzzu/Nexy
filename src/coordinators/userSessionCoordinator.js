import { getWorldName, parseLocation } from '../shared/utils';
import { runUpdateFriendshipsFlow, updateUserCurrentStatus } from './friendRelationshipCoordinator';
import { useAuthStore } from '../stores/auth';
import { useGameStore } from '../stores/game';
import { applyPresenceGroups } from './groupCoordinator';
import { useInstanceStore } from '../stores/instance';
import { useUserStore } from '../stores/user';

/**
 * Runs one-time side effects for first current-user hydration after login.
 *
 * @param {object} ref Current user state reference.
 * @param {object} [options] Test seams.
 * @param {function} [options.now] Timestamp provider.
 */
export function runFirstLoginFlow(ref, { now = Date.now } = {}) {
    const gameStore = useGameStore();
    const authStore = useAuthStore();
    const userStore = useUserStore();

    if (gameStore.isGameRunning) {
        ref.$previousAvatarSwapTime = now();
    }
    userStore.clearCachedUsers(); // clear before running applyUser
    userStore.setCurrentUser(ref);
    authStore.loginComplete();
}

/**
 * Runs cross-store synchronization after current-user data is applied.
 *
 * @param {object} ref Current user state reference.
 */
export function runPostApplySyncFlow(ref) {
    const instanceStore = useInstanceStore();

    applyPresenceGroups(ref);
    instanceStore.applyQueuedInstance(ref.queuedInstance);
    updateUserCurrentStatus(ref);
    if (typeof ref.friends !== 'undefined') {
        runUpdateFriendshipsFlow(ref);
    }
}

/**
 * Syncs home location derived state and visible dialog display name.
 *
 * @param {object} ref Current user state reference.
 */
export function runHomeLocationSyncFlow(ref) {
    const userStore = useUserStore();

    if (ref.homeLocation === ref.$homeLocation?.tag) {
        return;
    }
    ref.$homeLocation = parseLocation(ref.homeLocation);
    // apply home location name to user dialog
    if (userStore.userDialog.visible && userStore.userDialog.id === ref.id) {
        getWorldName(userStore.currentUser.homeLocation).then((worldName) => {
            userStore.userDialog.$homeLocationName = worldName;
        });
    }
}
