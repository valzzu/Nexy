import { toast } from 'vue-sonner';
import { useFavoriteStore } from '../stores/favorite';
import { useAppearanceSettingsStore } from '../stores/settings/appearance';
import { useFriendStore } from '../stores/friend';
import { useUserStore } from '../stores/user';
import { useWorldStore } from '../stores/world';
import { rebuildFavoriteSearchIndex } from './searchIndexCoordinator';
import { applyWorld } from './worldCoordinator';
import { database } from '../services/database';
import { i18n } from '../plugins/i18n';
import { compareByName, replaceReactiveObject } from '../shared/utils';

// --- Sort helpers ---

/**
 * @returns {void}
 */
export function sortLocalWorldFavorites() {
    const favoriteStore = useFavoriteStore();
    const appearanceSettingsStore = useAppearanceSettingsStore();
    if (!appearanceSettingsStore.sortFavorites) {
        for (let i = 0; i < favoriteStore.localWorldFavoriteGroups.length; ++i) {
            const group = favoriteStore.localWorldFavoriteGroups[i];
            if (favoriteStore.localWorldFavorites[group]) {
                favoriteStore.localWorldFavorites[group].sort(compareByName);
            }
        }
    }
}

// --- Local World Favorites ---

/**
 * @param {string} worldId
 * @param {string} group
 */
export function addLocalWorldFavorite(worldId, group) {
    const favoriteStore = useFavoriteStore();
    const worldStore = useWorldStore();

    if (favoriteStore.hasLocalWorldFavorite(worldId, group)) {
        return;
    }
    const ref = worldStore.cachedWorlds.get(worldId);
    if (typeof ref === 'undefined') {
        return;
    }
    if (!favoriteStore.localWorldFavorites[group]) {
        favoriteStore.localWorldFavorites[group] = [];
    }

    favoriteStore.localWorldFavorites[group].unshift(ref);
    database.addWorldToCache(ref);
    database.addWorldToFavorites(worldId, group);
    if (worldStore.worldDialog.visible && worldStore.worldDialog.id === worldId) {
        worldStore.setWorldDialogIsFavorite(true);
    }

    // update UI
    sortLocalWorldFavorites();
}

/**
 * @param {string} worldId
 * @param {string} group
 */
export function removeLocalWorldFavorite(worldId, group) {
    const favoriteStore = useFavoriteStore();
    const worldStore = useWorldStore();

    let i;
    const favoriteGroup = favoriteStore.localWorldFavorites[group];
    for (i = 0; i < favoriteGroup.length; ++i) {
        if (favoriteGroup[i].id === worldId) {
            favoriteGroup.splice(i, 1);
        }
    }

    // remove from cache if no longer in favorites
    let worldInFavorites = false;
    for (i = 0; i < favoriteStore.localWorldFavoriteGroups.length; ++i) {
        const groupName = favoriteStore.localWorldFavoriteGroups[i];
        if (!favoriteStore.localWorldFavorites[groupName] || group === groupName) {
            continue;
        }
        for (let j = 0; j < favoriteStore.localWorldFavorites[groupName].length; ++j) {
            const id = favoriteStore.localWorldFavorites[groupName][j].id;
            if (id === worldId) {
                worldInFavorites = true;
                break;
            }
        }
    }
    if (!worldInFavorites) {
        database.removeWorldFromCache(worldId);
    }
    database.removeWorldFromFavorites(worldId, group);
    if (worldStore.worldDialog.visible && worldStore.worldDialog.id === worldId) {
        worldStore.setWorldDialogIsFavorite(favoriteStore.localWorldFavoritesList.includes(worldId));
    }

    // update UI
    sortLocalWorldFavorites();
}

/**
 * @returns {Promise<void>}
 */
export async function getLocalWorldFavorites() {
    const favoriteStore = useFavoriteStore();
    const worldStore = useWorldStore();

    const localGroups = new Set();
    const localListSet = new Set();
    const localFavorites = Object.create(null);

    const worldCache = await database.getWorldCache();
    for (let i = 0; i < worldCache.length; ++i) {
        const ref = worldCache[i];
        if (!worldStore.cachedWorlds.has(ref.id)) {
            applyWorld(ref);
        }
    }

    const favorites = await database.getWorldFavorites();
    for (let i = 0; i < favorites.length; ++i) {
        const favorite = favorites[i];

        localListSet.add(favorite.worldId);

        if (!localFavorites[favorite.groupName]) {
            localFavorites[favorite.groupName] = [];
        }
        localGroups.add(favorite.groupName);

        let ref = worldStore.cachedWorlds.get(favorite.worldId);
        if (typeof ref === 'undefined') {
            ref = { id: favorite.worldId };
        }
        localFavorites[favorite.groupName].unshift(ref);
    }

    let groupsArr = Array.from(localGroups);
    if (groupsArr.length === 0) {
        localFavorites.Favorites = [];
        // default group
        groupsArr = ['Favorites'];
    }

    replaceReactiveObject(favoriteStore.localWorldFavorites, localFavorites);

    sortLocalWorldFavorites();
}

/**
 * @param {string} newName
 * @param {string} group
 */
export function renameLocalWorldFavoriteGroup(newName, group) {
    const favoriteStore = useFavoriteStore();
    const { t } = i18n.global;
    if (favoriteStore.localWorldFavoriteGroups.includes(newName)) {
        toast.error(
            t('prompt.local_favorite_group_rename.message.error', {
                name: newName
            })
        );
        return;
    }
    favoriteStore.localWorldFavorites[newName] = favoriteStore.localWorldFavorites[group];

    delete favoriteStore.localWorldFavorites[group];
    database.renameWorldFavoriteGroup(newName, group);
    sortLocalWorldFavorites();
}

/**
 * @param {string} group
 */
export function newLocalWorldFavoriteGroup(group) {
    const favoriteStore = useFavoriteStore();
    const { t } = i18n.global;
    if (favoriteStore.localWorldFavoriteGroups.includes(group)) {
        toast.error(
            t('prompt.new_local_favorite_group.message.error', {
                name: group
            })
        );
        return;
    }
    if (!favoriteStore.localWorldFavorites[group]) {
        favoriteStore.localWorldFavorites[group] = [];
    }
    sortLocalWorldFavorites();
}

// --- Local Friend Favorites ---

/**
 * @param {string} userId
 * @param {string} group
 */
export function addLocalFriendFavorite(userId, group) {
    const favoriteStore = useFavoriteStore();
    const userStore = useUserStore();
    const friendStore = useFriendStore();

    if (favoriteStore.hasLocalFriendFavorite(userId, group)) {
        return;
    }
    if (!favoriteStore.localFriendFavorites[group]) {
        favoriteStore.localFriendFavorites[group] = [];
    }
    favoriteStore.localFriendFavorites[group].unshift(userId);
    database.addFriendToLocalFavorites(userId, group);
    const userDialog = userStore.userDialog;
    if (userDialog.visible && userDialog.id === userId) {
        userStore.setUserDialogIsFavorite(true);
    }
    friendStore.updateLocalFavoriteFriends();
}

/**
 * @param {string} userId
 * @param {string} group
 */
export function removeLocalFriendFavorite(userId, group) {
    const favoriteStore = useFavoriteStore();
    const userStore = useUserStore();
    const friendStore = useFriendStore();

    const favoriteGroup = favoriteStore.localFriendFavorites[group];
    if (favoriteGroup) {
        const idx = favoriteGroup.indexOf(userId);
        if (idx !== -1) {
            favoriteGroup.splice(idx, 1);
        }
    }
    database.removeFriendFromLocalFavorites(userId, group);
    const userDialog = userStore.userDialog;
    if (userDialog.visible && userDialog.id === userId) {
        userStore.setUserDialogIsFavorite(favoriteStore.isInAnyLocalFriendGroup(userId));
    }
    friendStore.updateLocalFavoriteFriends();
}

/**
 * @param {string} group
 */
export function deleteLocalFriendFavoriteGroup(group) {
    const favoriteStore = useFavoriteStore();
    const friendStore = useFriendStore();

    delete favoriteStore.localFriendFavorites[group];
    database.deleteFriendFavoriteGroup(group);
    friendStore.updateLocalFavoriteFriends();
}

/**
 * @returns {Promise<void>}
 */
export async function getLocalFriendFavorites() {
    const favoriteStore = useFavoriteStore();
    const friendStore = useFriendStore();

    const localFavorites = Object.create(null);

    const favorites = await database.getFriendFavorites();
    for (let i = 0; i < favorites.length; ++i) {
        const favorite = favorites[i];
        if (!localFavorites[favorite.groupName]) {
            localFavorites[favorite.groupName] = [];
        }
        localFavorites[favorite.groupName].unshift(favorite.userId);
    }

    if (Object.keys(localFavorites).length === 0) {
        localFavorites.Favorites = [];
    }

    replaceReactiveObject(favoriteStore.localFriendFavorites, localFavorites);
    friendStore.updateLocalFavoriteFriends();
}

/**
 * @param {string} newName
 * @param {string} group
 */
export function renameLocalFriendFavoriteGroup(newName, group) {
    const favoriteStore = useFavoriteStore();
    const { t } = i18n.global;
    if (favoriteStore.localFriendFavoriteGroups.includes(newName)) {
        toast.error(
            t('prompt.local_favorite_group_rename.message.error', {
                name: newName
            })
        );
        return;
    }
    favoriteStore.localFriendFavorites[newName] = favoriteStore.localFriendFavorites[group];
    delete favoriteStore.localFriendFavorites[group];
    database.renameFriendFavoriteGroup(newName, group);
}

// --- Sort / Init ---

export async function saveSortFavoritesOption() {
    const appearanceSettingsStore = useAppearanceSettingsStore();
    getLocalWorldFavorites();
    getLocalFriendFavorites();
    appearanceSettingsStore.setSortFavorites();
}

export async function initFavorites() {
    getLocalWorldFavorites();
    getLocalFriendFavorites();
}

/**
 * Called by the favorite store watch when login state changes.
 * Handles cross-store cleanup that can't stay in the store.
 *
 * @param {boolean} isLoggedIn
 */
export function onLoginStateChanged(isLoggedIn) {
    const friendStore = useFriendStore();
    friendStore.localFavoriteFriends.clear();
    if (isLoggedIn) {
        initFavorites();
    } else {
        rebuildFavoriteSearchIndex();
    }
}
