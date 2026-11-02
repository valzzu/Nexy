import { reactive, shallowReactive, watch } from 'vue';
import { defineStore } from 'pinia';

import { preloadOwnWorlds } from '../coordinators/worldCoordinator';
import { watchState } from '../services/watchState';

export const useWorldStore = defineStore('World', () => {
    const worldDialog = reactive({
        visible: false,
        loading: false,
        activeTab: 'Instances',
        lastActiveTab: 'Instances',
        id: '',
        memo: '',
        $location: {},
        ref: {},
        isFavorite: false,
        avatarScalingDisabled: false,
        focusViewDisabled: false,
        rooms: [],
        lastVisit: '',
        visitCount: 0,
        timeSpent: 0,
        isPC: false,
        isQuest: false,
        isIos: false,
        listings: []
    });

    const cachedWorlds = shallowReactive(new Map());

    watch(
        () => watchState.isLoggedIn,
        (isLoggedIn) => {
            worldDialog.visible = false;
            cachedWorlds.clear();
            if (isLoggedIn) {
                preloadOwnWorlds();
            }
        },
        { flush: 'sync' }
    );

    /**
     * @param {boolean} value
     */
    function setWorldDialogLoading(value) {
        worldDialog.loading = value;
    }

    /**
     * @param {boolean} value
     */
    function setWorldDialogVisible(value) {
        worldDialog.visible = value;
    }

    /**
     * @param {boolean} value
     */
    function setWorldDialogIsFavorite(value) {
        worldDialog.isFavorite = value;
    }

    return {
        worldDialog,
        cachedWorlds,
        setWorldDialogVisible,
        setWorldDialogIsFavorite,
        setWorldDialogLoading
    };
});
