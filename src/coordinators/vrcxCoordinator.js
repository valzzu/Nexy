import { removeWorldFromCache } from './worldCoordinator';
import { useFriendStore } from '../stores/friend';
import { useGroupStore } from '../stores/group';
import { useInstanceStore } from '../stores/instance';
import { useLocationStore } from '../stores/location';
import { useUserStore } from '../stores/user';
import { useWorldStore } from '../stores/world';
import { failedGetRequests } from '../services/request';

/**
 * Clears caches across multiple stores while preserving data that is
 * still needed (friends, current user, active instances).
 */
export function clearVRCXCache() {
    const userStore = useUserStore();
    const worldStore = useWorldStore();
    const groupStore = useGroupStore();
    const instanceStore = useInstanceStore();
    const friendStore = useFriendStore();
    const locationStore = useLocationStore();

    console.log('Clearing VRCX cache...');
    failedGetRequests.clear();
    userStore.cachedUsers.forEach((ref, id) => {
        if (
            !friendStore.friends.has(id) &&
            !locationStore.lastLocation.playerList.has(ref.id) &&
            id !== userStore.currentUser.id
        ) {
            userStore.deleteCachedUser(id);
        }
    });
    userStore.cachedProfiles.forEach((ref, id) => {
        if (
            !friendStore.friends.has(id) &&
            !locationStore.lastLocation.playerList.has(ref.id) &&
            id !== userStore.currentUser.id
        ) {
            userStore.deleteCachedProfile(id);
        }
    });
    worldStore.cachedWorlds.forEach((ref, id) => {
        if (ref.authorId !== userStore.currentUser.id) {
            removeWorldFromCache(id);
        }
    });
    groupStore.cachedGroups.forEach((ref, id) => {
        if (!groupStore.currentUserGroups.has(id)) {
            groupStore.cachedGroups.delete(id);
        }
    });
    instanceStore.cachedInstances.forEach((ref, id) => {
        if ([...friendStore.friends.values()].some((f) => f.$location?.tag === id)) {
            return;
        }
        // delete instances over an hour old
        if (Date.parse(ref.$fetchedAt) < Date.now() - 3600000) {
            instanceStore.cachedInstances.delete(id);
        }
    });
    userStore.customUserTags.clear();
}
