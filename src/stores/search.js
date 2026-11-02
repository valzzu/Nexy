import { computed, ref, watch } from 'vue';
import { defineStore } from 'pinia';

import { userRequest } from '../api';
import { useAppearanceSettingsStore } from './settings/appearance';
import { applyUser } from '../coordinators/userCoordinator';
import { useUserStore } from './user';
import { watchState } from '../services/watchState';

export const useSearchStore = defineStore('Search', () => {
    const userStore = useUserStore();
    const appearanceSettingsStore = useAppearanceSettingsStore();

    const searchText = ref('');
    const searchUserResults = ref([]);
    const friendsListSearch = ref('');

    const stringComparer = computed(() =>
        Intl.Collator(appearanceSettingsStore.appLanguage.replace('_', '-'), {
            usage: 'search',
            sensitivity: 'base'
        })
    );

    watch(
        () => watchState.isLoggedIn,
        () => {
            searchText.value = '';
            searchUserResults.value = [];
        },
        { flush: 'sync' }
    );

    function clearSearch() {
        searchText.value = '';
        searchUserResults.value = [];
    }

    /**
     * @param {string} value
     */
    function setSearchText(value) {
        searchText.value = value;
    }

    async function searchUserByDisplayName(displayName) {
        const params = {
            n: 10,
            offset: 0,
            fuzzy: false,
            search: displayName
        };
        await moreSearchUser(null, params);
    }

    async function moreSearchUser(go, params) {
        if (go) {
            params.offset += params.n * go;
            if (params.offset < 0) {
                params.offset = 0;
            }
        }
        await userRequest.getUsers(params).then((args) => {
            for (const json of args.json) {
                if (!json.displayName) {
                    console.error('getUsers gave us garbage', json);
                    continue;
                }
                // @ts-ignore
                applyUser(json);
            }

            const map = new Map();
            for (const json of args.json) {
                const ref = userStore.cachedUsers.get(json.id);
                if (typeof ref !== 'undefined') {
                    map.set(ref.id, ref);
                }
            }
            searchUserResults.value = Array.from(map.values());
            return args;
        });
    }

    return {
        searchText,
        searchUserResults,
        stringComparer,
        friendsListSearch,

        clearSearch,
        searchUserByDisplayName,
        moreSearchUser,
        setSearchText
    };
});
