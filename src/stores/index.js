import { createPinia } from 'pinia';

import { getSentry, isSentryOptedIn } from '../plugins';
import { useAdvancedSettingsStore } from './settings/advanced';
import { useActivityStore } from './activity';
import { useAppearanceSettingsStore } from './settings/appearance';
import { useAuthStore } from './auth';
import { useChartsStore } from './charts';
import { useDashboardStore } from './dashboard';
import { useExternalLinkStore } from './externalLink';
import { useFavoriteStore } from './favorite';
import { useFeedStore } from './feed';
import { useFriendStore } from './friend';
import { useGalleryStore } from './gallery';
import { useGameLogStore } from './gameLog';
import { useGameStore } from './game';
import { useGeneralSettingsStore } from './settings/general';
import { useQuickSearchStore } from './quickSearch';
import { useGroupStore } from './group';
import { useInstanceStore } from './instance';
import { useInviteStore } from './invite';
import { useLaunchStore } from './launch';
import { useLocationStore } from './location';
import { useModalStore } from './modal';
import { useModerationStore } from './moderation';
import { useNotificationStore } from './notification';
import { useNotificationsSettingsStore } from './settings/notifications';
import { useSearchStore } from './search';
import { useSharedFeedStore } from './sharedFeed';
import { useUiStore } from './ui';
import { useToolsStore } from './tools';
import { useUpdateLoopStore } from './updateLoop';
import { useUserStore } from './user';
import { useVRCXUpdaterStore } from './vrcxUpdater';
import { useVrStore } from './vr';
import { useVrcxStore } from './vrcx';
import { useWorldStore } from './world';
import { useWristOverlaySettingsStore } from './settings/wristOverlay';

export const pinia = createPinia();

async function registerSentryPiniaPlugin() {
    if (!NIGHTLY) return;
    if (!(await isSentryOptedIn())) return;

    const Sentry = await getSentry();

    pinia.use(
        Sentry.createSentryPiniaPlugin({
            stateTransformer: (state) => ({
                ...state,
                Auth: null,
                Feed: null,
                Favorite: null,
                Friend: null,
                User: {
                    // @ts-ignore
                    ...state.User,
                    currentUser: null,
                    subsetOfLanguages: null
                },
                GameLog: {
                    // @ts-ignore
                    ...state.GameLog,
                    gameLogTable: null
                },
                Notification: {
                    // @ts-ignore
                    ...state.Notification,
                    notificationTable: null
                },
                Moderation: {
                    // @ts-ignore
                    ...state.Moderation,
                    playerModerationTable: null,
                    cachedPlayerModerations: null,
                    cachedPlayerModerationsUserIds: null
                },
                SharedFeed: {
                    // @ts-ignore
                    ...state.SharedFeed,
                    sharedFeedData: null
                },
                Group: {
                    // @ts-ignore
                    ...state.Group,
                    groupInstances: null
                }
            })
        })
    );
}

export async function initPiniaPlugins() {
    await registerSentryPiniaPlugin();
}

export function createGlobalStores() {
    return {
        advancedSettings: useAdvancedSettingsStore(),
        activity: useActivityStore(),
        appearanceSettings: useAppearanceSettingsStore(),
        generalSettings: useGeneralSettingsStore(),
        notificationsSettings: useNotificationsSettingsStore(),
        wristOverlaySettings: useWristOverlaySettingsStore(),
        externalLink: useExternalLinkStore(),
        favorite: useFavoriteStore(),
        friend: useFriendStore(),
        user: useUserStore(),
        vrcxUpdater: useVRCXUpdaterStore(),
        world: useWorldStore(),
        group: useGroupStore(),
        location: useLocationStore(),
        instance: useInstanceStore(),
        moderation: useModerationStore(),
        invite: useInviteStore(),
        gallery: useGalleryStore(),
        notification: useNotificationStore(),
        feed: useFeedStore(),
        ui: useUiStore(),
        tools: useToolsStore(),
        gameLog: useGameLogStore(),
        search: useSearchStore(),
        game: useGameStore(),
        launch: useLaunchStore(),
        vr: useVrStore(),
        vrcx: useVrcxStore(),
        sharedFeed: useSharedFeedStore(),
        updateLoop: useUpdateLoopStore(),
        auth: useAuthStore(),
        charts: useChartsStore(),
        dashboard: useDashboardStore(),
        modal: useModalStore(),
        quickSearch: useQuickSearchStore()
    };
}

export {
    useAuthStore,
    useExternalLinkStore,
    useFavoriteStore,
    useFeedStore,
    useFriendStore,
    useGalleryStore,
    useGameStore,
    useGameLogStore,
    useGroupStore,
    useInstanceStore,
    useInviteStore,
    useLaunchStore,
    useLocationStore,
    useModerationStore,
    useNotificationStore,
    useSearchStore,
    useChartsStore,
    useDashboardStore,
    useAdvancedSettingsStore,
    useActivityStore,
    useAppearanceSettingsStore,
    useGeneralSettingsStore,
    useNotificationsSettingsStore,
    useWristOverlaySettingsStore,
    useToolsStore,
    useUiStore,
    useUserStore,
    useVrStore,
    useVrcxStore,
    useVRCXUpdaterStore,
    useWorldStore,
    useSharedFeedStore,
    useUpdateLoopStore,
    useModalStore,
    useQuickSearchStore
};
