import { defineStore } from 'pinia';
import { watch } from 'vue';

import { useAdvancedSettingsStore } from './settings/advanced';
import { useAppearanceSettingsStore } from './settings/appearance';
import { useFriendStore } from './friend';
import { useGameStore } from './game';
import { useLocationStore } from './location';
import { useNotificationsSettingsStore } from './settings/notifications';
import { useSharedFeedStore } from './sharedFeed';
import { useUserStore } from './user';
import { useWristOverlaySettingsStore } from './settings/wristOverlay';
import { watchState } from '../services/watchState';

export const useVrStore = defineStore('Vr', () => {
    const friendStore = useFriendStore();
    const advancedSettingsStore = useAdvancedSettingsStore();
    const wristOverlaySettingsStore = useWristOverlaySettingsStore();
    const locationStore = useLocationStore();
    const notificationsSettingsStore = useNotificationsSettingsStore();
    const appearanceSettingsStore = useAppearanceSettingsStore();
    const gameStore = useGameStore();
    const userStore = useUserStore();
    const sharedFeedStore = useSharedFeedStore();
    if (LINUX) window.electron?.onVrOverlayReady?.(() => vrInit());

    watch(
        () => watchState.isFriendsLoaded,
        (isFriendsLoaded) => {
            if (isFriendsLoaded) {
                vrInit();
            }
        },
        { flush: 'sync' }
    );

    // also runs from CEF C# on overlay browser startup
    function vrInit() {
        updateVRConfigVars();
        updateVRLastLocation();
        // run these methods again to send data to the overlay
        sharedFeedStore.sendSharedFeed();
        friendStore.updateOnlineFriendCounter(true); // force an update
    }

    async function saveOpenVROption() {
        updateVRConfigVars();
        updateVRLastLocation();
        AppApi.ExecuteVrOverlayFunction('notyClear', '');
        updateOpenVR();
    }

    function updateVRLastLocation() {
        let onlineFor = null;
        if (!wristOverlaySettingsStore.hideUptimeFromFeed) {
            onlineFor = userStore.currentUser.$online_for;
        }
        const lastLocation = {
            date: locationStore.lastLocation.date,
            location: locationStore.lastLocation.location,
            name: locationStore.lastLocation.name,
            playerList: Array.from(locationStore.lastLocation.playerList.values()),
            friendList: Array.from(locationStore.lastLocation.friendList.values()),
            onlineFor
        };
        const json = JSON.stringify(lastLocation);
        AppApi.ExecuteVrOverlayFunction('lastLocationUpdate', json);
    }

    function updateVRConfigVars() {
        let notificationTheme = 'relax';
        if (appearanceSettingsStore.isDarkMode) {
            notificationTheme = 'sunset';
        }

        /**
         * @typedef {object} VrConfigVarsPayload
         * @property {boolean} overlayNotifications
         * @property {boolean} hideDevicesFromFeed
         * @property {boolean} vrOverlayCpuUsage
         * @property {boolean} minimalFeed
         * @property {string} notificationPosition
         * @property {number} notificationTimeout
         * @property {string} notificationTheme
         * @property {boolean} backgroundEnabled
         * @property {boolean} dtHour12
         * @property {boolean} pcUptimeOnFeed
         * @property {string} appLanguage
         * @property {number} notificationOpacity
         * @property {boolean} isWristDisabled
         */

        /** @type {VrConfigVarsPayload} */
        const VRConfigVars = {
            overlayNotifications: notificationsSettingsStore.overlayNotifications,
            hideDevicesFromFeed: wristOverlaySettingsStore.hideDevicesFromFeed,
            vrOverlayCpuUsage: wristOverlaySettingsStore.vrOverlayCpuUsage,
            minimalFeed: wristOverlaySettingsStore.minimalFeed,
            notificationPosition: notificationsSettingsStore.notificationPosition,
            notificationTimeout: notificationsSettingsStore.notificationTimeout,
            notificationTheme,
            backgroundEnabled: wristOverlaySettingsStore.vrBackgroundEnabled,
            dtHour12: appearanceSettingsStore.dtHour12,
            pcUptimeOnFeed: wristOverlaySettingsStore.pcUptimeOnFeed,
            appLanguage: appearanceSettingsStore.appLanguage,
            notificationOpacity: advancedSettingsStore.notificationOpacity,
            isWristDisabled: wristOverlaySettingsStore.overlayWrist === false
        };

        /** @type {string} */
        const json = JSON.stringify(VRConfigVars);
        AppApi.ExecuteVrOverlayFunction('configUpdate', json);
    }

    function updateOpenVR() {
        let newState = {
            active: false,
            hmdOverlay: false,
            wristOverlay: false,
            menuButton: false,
            overlayHand: 0
        };
        if (
            notificationsSettingsStore.openVR &&
            gameStore.isSteamVRRunning &&
            ((gameStore.isGameRunning && !gameStore.isGameNoVR) || wristOverlaySettingsStore.openVRAlways)
        ) {
            let hmdOverlay = false;
            if (notificationsSettingsStore.overlayNotifications) {
                hmdOverlay = true;
            }
            newState = {
                active: true,
                hmdOverlay,
                wristOverlay: wristOverlaySettingsStore.overlayWrist,
                menuButton: wristOverlaySettingsStore.overlaybutton,
                overlayHand: parseInt(wristOverlaySettingsStore.overlayHand, 10)
            };
        }

        AppApi.SetVR(
            newState.active,
            newState.hmdOverlay,
            newState.wristOverlay,
            newState.menuButton,
            newState.overlayHand
        );
        if (!newState.active) {
            gameStore.setIsHmdAfk(false);
        }

        if (LINUX) {
            vrInit(); // sometimes this runs before the overlay is ready
        }
    }

    return {
        vrInit,
        saveOpenVROption,
        updateVRLastLocation,
        updateVRConfigVars,
        updateOpenVR
    };
});
