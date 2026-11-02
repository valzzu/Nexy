import { computed } from 'vue';
import { defineStore } from 'pinia';

import { useAdvancedSettingsStore } from './settings/advanced';
import { useGameStore } from './game';

export const useInviteStore = defineStore('Invite', () => {
    const gameStore = useGameStore();
    const advancedSettingsStore = useAdvancedSettingsStore();

    const canOpenInstanceInGame = computed(() => {
        return gameStore.isGameRunning && !advancedSettingsStore.selfInviteOverride;
    });

    return {
        canOpenInstanceInGame
    };
});
