import { reactive, ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { toast } from 'vue-sonner';
import { useI18n } from 'vue-i18n';

import { DEFAULT_MAX_TABLE_SIZE, DEFAULT_SEARCH_LIMIT, SEARCH_LIMIT_MAX, SEARCH_LIMIT_MIN } from '../shared/constants';
import { debounce } from '../shared/utils';
import { AppDebug } from '../services/appConfig';
import { database } from '../services/database';
import { refreshCustomScript } from '../shared/utils/base/ui';
import { useAdvancedSettingsStore } from './settings/advanced';
import { useGameLogStore } from './gameLog';
import { showGroupDialog } from '../coordinators/groupCoordinator';
import { showWorldDialog } from '../coordinators/worldCoordinator';
import { showUserDialog, addCustomTag } from '../coordinators/userCoordinator';
import { useLocationStore } from './location';
import { useModalStore } from './modal';
import { useNotificationStore } from './notification';
import { useUpdateLoopStore } from './updateLoop';
import { useUserStore } from './user';
import { clearVRCXCache } from '../coordinators/vrcxCoordinator';
import { resetSearchIndexOnLogin } from '../coordinators/searchIndexCoordinator';
import { watchState } from '../services/watchState';

import configRepository from '../services/config';

export const useVrcxStore = defineStore('Vrcx', () => {
    const locationStore = useLocationStore();
    const notificationStore = useNotificationStore();

    const userStore = useUserStore();
    const advancedSettingsStore = useAdvancedSettingsStore();
    const gameLogStore = useGameLogStore();
    const updateLoopStore = useUpdateLoopStore();
    const { t } = useI18n();
    const modalStore = useModalStore();

    const state = reactive({
        databaseVersion: 0,
        locationX: 0,
        locationY: 0,
        sizeWidth: 800,
        sizeHeight: 600,
        windowState: '',
        externalNotifierVersion: 0
    });
    const databaseUpgradeState = ref({
        visible: false,
        fromVersion: 0,
        toVersion: 0
    });
    const databaseReadyForAutoLogin = ref(false);
    /** @type {(value?: unknown) => void} */
    let resolveDatabaseInit = () => {};
    const databaseInitComplete = new Promise((resolve) => {
        resolveDatabaseInit = resolve;
    });

    const currentlyDroppingFile = ref(null);
    const ipcEnabled = ref(false);
    const clearVRCXCacheFrequency = ref(172800);
    const maxTableSize = ref(DEFAULT_MAX_TABLE_SIZE);
    const searchLimit = ref(DEFAULT_SEARCH_LIMIT);
    const proxyServer = ref('');
    const appStartAt = Date.now();
    const isBrowserFocused = ref(true);
    const pendingLaunchCommands = [];

    async function init() {
        try {
            if (LINUX) {
                try {
                    window.electron.ipcRenderer.on('launch-command', (command) => {
                        if (command) {
                            if (watchState.isLoggedIn) eventLaunchCommand(command);
                            else pendingLaunchCommands.push(command);
                        }
                    });

                    window.electron.onWindowPositionChanged((event, position) => {
                        state.locationX = position.x;
                        state.locationY = position.y;
                        debounce(saveVRCXWindowOption, 300)();
                    });

                    window.electron.onWindowSizeChanged((event, size) => {
                        state.sizeWidth = size.width;
                        state.sizeHeight = size.height;
                        debounce(saveVRCXWindowOption, 300)();
                    });

                    window.electron.onWindowStateChange((event, newState) => {
                        state.windowState = newState.toString();
                        debounce(saveVRCXWindowOption, 300)();
                    });

                    window.electron.onBrowserFocus(() => {
                        onBrowserFocus();
                    });

                    window.electron.onBrowserBlur(() => {
                        onBrowserBlur();
                    });
                } catch (err) {
                    console.error('Failed to register Linux IPC handlers:', err);
                }
            }

            state.databaseVersion = await configRepository.getInt('VRCX_databaseVersion', 0);
            const databaseUpgradeSucceeded = await updateDatabaseVersion();
            if (!databaseUpgradeSucceeded) {
                return;
            }

            clearVRCXCacheFrequency.value = await configRepository.getInt('VRCX_clearVRCXCacheFrequency', 172800);

            if (!(await VRCXStorage.Get('VRCX_DatabaseLocation'))) {
                await VRCXStorage.Set('VRCX_DatabaseLocation', '');
            }
            if (!(await VRCXStorage.Get('VRCX_ProxyServer'))) {
                await VRCXStorage.Set('VRCX_ProxyServer', '');
            }
            if ((await VRCXStorage.Get('VRCX_DisableGpuAcceleration')) === '') {
                await VRCXStorage.Set('VRCX_DisableGpuAcceleration', 'false');
            }
            if ((await VRCXStorage.Get('VRCX_DisableVrOverlayGpuAcceleration')) === '') {
                await VRCXStorage.Set('VRCX_DisableVrOverlayGpuAcceleration', 'false');
            }
            proxyServer.value = await VRCXStorage.Get('VRCX_ProxyServer');
            state.locationX = parseInt(await VRCXStorage.Get('VRCX_LocationX'), 10);
            state.locationY = parseInt(await VRCXStorage.Get('VRCX_LocationY'), 10);
            state.sizeWidth = parseInt(await VRCXStorage.Get('VRCX_SizeWidth'), 10);
            state.sizeHeight = parseInt(await VRCXStorage.Get('VRCX_SizeHeight'), 10);
            state.windowState = await VRCXStorage.Get('VRCX_WindowState');

            maxTableSize.value = await configRepository.getInt('VRCX_maxTableSize_v2', DEFAULT_MAX_TABLE_SIZE);
            database.setMaxTableSize(maxTableSize.value);

            searchLimit.value = await configRepository.getInt('VRCX_searchLimit', DEFAULT_SEARCH_LIMIT);
            if (searchLimit.value < SEARCH_LIMIT_MIN) {
                searchLimit.value = SEARCH_LIMIT_MIN;
            }
            if (searchLimit.value > SEARCH_LIMIT_MAX) {
                searchLimit.value = SEARCH_LIMIT_MAX;
            }
            database.setSearchTableSize(searchLimit.value);

            refreshCustomScript();
            databaseReadyForAutoLogin.value = true;
        } finally {
            resolveDatabaseInit();
        }
    }

    resetSearchIndexOnLogin();
    init();

    async function updateDatabaseVersion() {
        // requires dbVars.userPrefix to be already set
        const databaseVersion = 18;
        if (state.databaseVersion < databaseVersion) {
            databaseUpgradeState.value = {
                visible: state.databaseVersion > 0,
                fromVersion: state.databaseVersion,
                toVersion: databaseVersion
            };
            console.log(`Updating database from ${state.databaseVersion} to ${databaseVersion}...`);
            try {
                await database.upgradeDatabaseVersion(); // Migrations
                await database.vacuum(); // succ
                await database.optimize();
                await configRepository.setInt('VRCX_databaseVersion', databaseVersion);
                console.log('Database update complete.');
                state.databaseVersion = databaseVersion;
                databaseUpgradeState.value.visible = false;
            } catch (err) {
                console.error(err);
                databaseUpgradeState.value.visible = false;
                await modalStore.alert({
                    title: t('message.database.upgrade_failed_title'),
                    description: t('message.database.upgrade_failed_description'),
                    dismissible: false
                });
                AppApi.ShowDevTools();
                return false;
            }
        }
        return true;
    }

    async function waitForDatabaseInit() {
        await databaseInitComplete;
        return databaseReadyForAutoLogin.value;
    }

    /**
     * @param {string} value
     */
    function setProxyServer(value) {
        proxyServer.value = value;
    }

    /**
     * @param {boolean} value
     */
    function setIpcEnabled(value) {
        ipcEnabled.value = value;
    }

    /**
     * @param {number} value
     */
    function setClearVRCXCacheFrequency(value) {
        clearVRCXCacheFrequency.value = value;
    }

    /**
     * @param {number} value
     */
    function setMaxTableSize(value) {
        maxTableSize.value = value;
    }

    /**
     * @param {number} value
     */
    function setSearchLimit(value) {
        searchLimit.value = value;
    }

    /**
     * @param data
     */
    async function eventVrcxMessage(data) {
        let entry;
        switch (data.MsgType) {
            case 'CustomTag':
                addCustomTag(data);
                break;
            case 'ClearCustomTags':
                userStore.customUserTags.forEach((value, key) => {
                    userStore.customUserTags.delete(key);
                    const ref = userStore.cachedUsers.get(key);
                    if (typeof ref !== 'undefined') {
                        ref.$customTag = '';
                        ref.$customTagColour = '';
                    }
                });
                break;
            case 'Noty':
                if (state.externalNotifierVersion && state.externalNotifierVersion > 21) {
                    return;
                }
                entry = {
                    created_at: new Date().toJSON(),
                    type: 'Event',
                    data: data.Data
                };
                notificationStore.queueGameLogNoty(entry);
                const persistedEntry = await database.addGamelogEventToDatabase(entry);
                if (persistedEntry) {
                    gameLogStore.addGameLog(persistedEntry);
                }
                break;
            case 'External': {
                const displayName = data.DisplayName ?? '';
                const notify = data.notify ?? true;
                entry = {
                    created_at: new Date().toJSON(),
                    type: 'External',
                    message: data.Data,
                    displayName,
                    userId: data.UserId,
                    location: locationStore.lastLocation.location
                };
                if (notify) {
                    notificationStore.queueGameLogNoty(entry);
                }
                const persistedEntry = await database.addGamelogExternalToDatabase(entry);
                if (persistedEntry) {
                    gameLogStore.addGameLog(persistedEntry);
                }
                break;
            }
            default:
                console.log('VRCXMessage:', data);
                break;
        }
    }

    async function saveVRCXWindowOption() {
        if (LINUX) {
            VRCXStorage.Set('VRCX_LocationX', state.locationX.toString());
            VRCXStorage.Set('VRCX_LocationY', state.locationY.toString());
            VRCXStorage.Set('VRCX_SizeWidth', state.sizeWidth.toString());
            VRCXStorage.Set('VRCX_SizeHeight', state.sizeHeight.toString());
            VRCXStorage.Set('VRCX_WindowState', state.windowState);
        }
    }

    // use in C# side
    /**
     * @param json
     */
    async function ipcEvent(json) {
        if (!watchState.isLoggedIn) {
            return;
        }
        let data;
        try {
            data = JSON.parse(json);
        } catch {
            console.log(`IPC invalid JSON, ${json}`);
            return;
        }

        switch (data.type) {
            case 'VrcxMessage':
                if (AppDebug.debugIPC) {
                    console.log('VrcxMessage:', data);
                }
                await eventVrcxMessage(data);
                break;
            case 'Ping':
                if (AppDebug.debugIPC) {
                    console.log('IPC Ping');
                }
                ipcEnabled.value = true;
                updateLoopStore.setIpcTimeout(60); // 30 seconds
                break;
            case 'MsgPing':
                if (AppDebug.debugIPC) {
                    console.log('MsgPing:', data);
                }
                state.externalNotifierVersion = data.version;
                break;
            case 'LaunchCommand':
                eventLaunchCommand(data.command);
                break;
            case 'VRCXLaunch':
                console.log('VRCXLaunch:', data);
                break;
            default:
                console.log('IPC:', data);
        }
    }

    /**
     * This function is called by .NET(CefCustomDragHandler#CefCustomDragHandler) when a file is dragged over a drop
     * zone in the app window.
     *
     * @param {string} filePath - The full path to the file being dragged into the window
     */
    function dragEnterCef(filePath) {
        currentlyDroppingFile.value = filePath;
    }

    watch(
        () => watchState.isLoggedIn,
        (isLoggedIn) => {
            if (isLoggedIn) {
                startupLaunchCommand();
            }
        },
        { flush: 'sync' }
    );

    async function startupLaunchCommand() {
        while (pendingLaunchCommands.length) eventLaunchCommand(pendingLaunchCommands.shift());
        const command = await AppApi.GetLaunchCommand();
        if (!command) {
            return;
        }
        if (command.startsWith('crash/')) {
            const crashMessage = command.replace('crash/', '');
            console.error('VRCX recovered from crash:', crashMessage);

            if (advancedSettingsStore.sentryErrorReporting) {
                try {
                    import('@sentry/vue').then((Sentry) => {
                        Sentry.withScope((scope) => {
                            scope.setLevel('fatal');
                            scope.setTag('reason', 'crash-recovery');
                            scope.setContext('session', {
                                sessionTime: performance.now() / 1000 / 60
                            });
                            Sentry.captureMessage(`crash message: ${crashMessage}`);
                        });
                    });
                } catch (error) {
                    console.error('Error setting up Sentry feedback:', error);
                }
            }

            toast.success(t('message.crash.vrcx_reload'));
            return;
        }
        eventLaunchCommand(command);
    }

    // called from C#
    /**
     * @param input
     */
    function eventLaunchCommand(input) {
        if (!watchState.isLoggedIn) {
            return;
        }
        console.log('LaunchCommand:', input);
        const args = input.split('/');
        const command = args[0];
        const commandArg = args[1]?.trim();
        switch (command) {
            case 'world':
                showWorldDialog(commandArg);
                break;
            case 'user':
                showUserDialog(commandArg);
                break;
            case 'group':
                showGroupDialog(commandArg);
                break;
        }
        window.electron.focusWindow();
    }

    // ran from Cef and Electron when browser is focused
    function onBrowserFocus() {
        isBrowserFocused.value = true;
    }

    function onBrowserBlur() {
        isBrowserFocused.value = false;
    }

    return {
        state,

        appStartAt,
        databaseUpgradeState,
        databaseReadyForAutoLogin,
        proxyServer,
        setProxyServer,
        setIpcEnabled,
        setClearVRCXCacheFrequency,
        setMaxTableSize,
        setSearchLimit,
        currentlyDroppingFile,
        ipcEnabled,
        clearVRCXCacheFrequency,
        maxTableSize,
        searchLimit,
        clearVRCXCache,
        eventVrcxMessage,
        eventLaunchCommand,
        ipcEvent,
        dragEnterCef,
        updateDatabaseVersion,
        waitForDatabaseInit,
        onBrowserFocus,
        onBrowserBlur,
        isBrowserFocused
    };
});
