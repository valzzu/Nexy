import { computed, reactive, watch } from 'vue';
import { defineStore } from 'pinia';
import { toast } from 'vue-sonner';
import { useI18n } from 'vue-i18n';

import { replaceReactiveObject } from '../shared/utils';
import { database } from '../services/database';
import { watchState } from '../services/watchState';
import { onLoginStateChanged } from '../coordinators/favoriteCoordinator';

// Local favorites live in Nexy's own database; they don't depend on any game's API
export const useFavoriteStore = defineStore('Favorite', () => {
    const { t } = useI18n();

    const localWorldFavorites = reactive({});

    const localFriendFavorites = reactive({});

    const localWorldFavoriteGroups = computed(() => Object.keys(localWorldFavorites).sort());

    const localWorldFavoritesList = computed(() =>
        Object.values(localWorldFavorites)
            .flat()
            .map((fav) => fav.id)
    );

    const localFriendFavoritesList = computed(() => Object.values(localFriendFavorites).flat());

    const localWorldFavGroupLength = computed(() => (group) => localWorldFavorites[group]?.length ?? 0);

    const localFriendFavoriteGroups = computed(() => Object.keys(localFriendFavorites).sort());

    const localFriendFavGroupLength = computed(() => (group) => localFriendFavorites[group]?.length ?? 0);

    watch(
        () => watchState.isLoggedIn,
        (isLoggedIn) => {
            replaceReactiveObject(localWorldFavorites, {});
            // Cross-store operations delegated to coordinator
            onLoginStateChanged(isLoggedIn);
        },
        { flush: 'sync' }
    );

    /**
     * @param {string} worldId
     * @param {string} group
     * @returns {boolean}
     */
    function hasLocalWorldFavorite(worldId, group) {
        const favoriteGroup = localWorldFavorites[group];
        if (!favoriteGroup) {
            return false;
        }
        for (let i = 0; i < favoriteGroup.length; ++i) {
            if (favoriteGroup[i].id === worldId) {
                return true;
            }
        }
        return false;
    }

    /**
     * @param {string} group
     */
    function deleteLocalWorldFavoriteGroup(group) {
        let i;
        // remove from cache if no longer in favorites
        const worldIdRemoveList = new Set();
        const favoriteGroup = localWorldFavorites[group];
        for (i = 0; i < favoriteGroup.length; ++i) {
            worldIdRemoveList.add(favoriteGroup[i].id);
        }

        delete localWorldFavorites[group];
        database.deleteWorldFavoriteGroup(group);

        for (i = 0; i < localWorldFavoriteGroups.value.length; ++i) {
            const groupName = localWorldFavoriteGroups.value[i];
            if (!localWorldFavorites[groupName]) {
                continue;
            }
            for (let j = 0; j < localWorldFavorites[groupName].length; ++j) {
                const worldId = localWorldFavorites[groupName][j].id;
                if (worldIdRemoveList.has(worldId)) {
                    worldIdRemoveList.delete(worldId);
                    break;
                }
            }
        }

        worldIdRemoveList.forEach((id) => {
            database.removeWorldFromCache(id);
        });
    }

    /**
     * @param {string} userId
     * @param {string} group
     * @returns {boolean}
     */
    function hasLocalFriendFavorite(userId, group) {
        const favoriteGroup = localFriendFavorites[group];
        if (!favoriteGroup) {
            return false;
        }
        return favoriteGroup.includes(userId);
    }

    /**
     * Check if a user is in any local friend favorite group.
     *
     * @param {string} userId
     * @returns {boolean}
     */
    function isInAnyLocalFriendGroup(userId) {
        for (const group in localFriendFavorites) {
            if (localFriendFavorites[group]?.includes(userId)) {
                return true;
            }
        }
        return false;
    }

    /**
     * @param {string} group
     */
    function newLocalFriendFavoriteGroup(group) {
        if (localFriendFavoriteGroups.value.includes(group)) {
            toast.error(
                t('prompt.new_local_favorite_group.message.error', {
                    name: group
                })
            );
            return;
        }
        if (!localFriendFavorites[group]) {
            localFriendFavorites[group] = [];
        }
    }

    return {
        localWorldFavorites,
        localWorldFavoritesList,
        localFriendFavoritesList,
        localWorldFavoriteGroups,
        localFriendFavorites,
        localFriendFavoriteGroups,
        localFriendFavGroupLength,
        localWorldFavGroupLength,

        hasLocalWorldFavorite,
        deleteLocalWorldFavoriteGroup,
        hasLocalFriendFavorite,
        isInAnyLocalFriendGroup,
        newLocalFriendFavoriteGroup
    };
});
