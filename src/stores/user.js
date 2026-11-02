import { reactive, ref, shallowReactive, watch } from 'vue';
import { defineStore } from 'pinia';

import { compareByDisplayName, compareByLocationAt, isRealInstance, parseLocation } from '../shared/utils';
import { getAllUserMemos } from '../coordinators/memoCoordinator';
import { instanceRequest, userRequest } from '../api';
import { runUpdateCurrentUserLocationFlow } from '../coordinators/locationCoordinator';
import { useAppearanceSettingsStore } from './settings/appearance';
import { useFriendStore } from './friend';
import { useInstanceStore } from './instance';
import { useLocationStore } from './location';
import { useUiStore } from './ui';
import { watchState } from '../services/watchState';

export const useUserStore = defineStore('User', () => {
    const appearanceSettingsStore = useAppearanceSettingsStore();
    const friendStore = useFriendStore();
    const locationStore = useLocationStore();
    const instanceStore = useInstanceStore();
    const uiStore = useUiStore();

    const currentUser = ref(
        /** @type {import('@/types/vrcx').VrcxCurrentUser} */ {
            acceptedPrivacyVersion: 0,
            acceptedTOSVersion: 0,
            accountDeletionDate: null,
            accountDeletionLog: null,
            accountStanding: '',
            activeFriends: [],
            ageVerificationStatus: '',
            ageVerified: false,
            allowAvatarCopying: false,
            appleDetails: {},
            appleId: '',
            badges: [],
            bannerColor: '',
            bannerType: 'color',
            bannerUrl: '',
            bio: '',
            bioLinks: [],
            completedTutorials: [],
            currentAvatar: '',
            currentAvatarImageUrl: '',
            currentAvatarTags: [],
            currentAvatarThumbnailImageUrl: '',
            date_joined: '',
            developerType: '',
            discordDetails: {
                global_name: '',
                id: ''
            },
            discordId: '',
            displayName: '',
            emailVerified: false,
            fallbackAvatar: '',
            friendGroupNames: [],
            friendKey: '',
            friends: [],
            googleDetails: {},
            googleId: '',
            hasAcceptedDiscordSocialSDKPerms: false,
            hasBirthday: false,
            hasDiscordFriendsOptOut: false,
            hasEmail: false,
            hasLoggedInFromClient: false,
            hasPendingEmail: false,
            hasSharedConnectionsOptOut: false,
            hideContentFilterSettings: false,
            homeLocation: '',
            id: '',
            isAdult: true,
            isBoopingEnabled: false,
            isEconomyCreator: false,
            isFriend: false,
            isTemporary: false,
            iconFrame: '',
            iconUrl: '',
            last_activity: '',
            last_login: '',
            last_mobile: null,
            last_platform: '',
            nameplateEffect: '',
            obfuscatedEmail: '',
            obfuscatedPendingEmail: '',
            oculusId: '',
            offlineFriends: [],
            onlineFriends: [],
            pastDisplayNames: [],
            picoId: '',
            platform_history: [],
            presence: {
                avatarThumbnail: '',
                currentAvatarTags: '',
                debugflag: '',
                displayName: '',
                groups: [],
                id: '',
                instance: '',
                instanceType: '',
                platform: '',
                profilePicOverride: '',
                status: '',
                travelingToInstance: '',
                travelingToWorld: '',
                userIcon: '',
                world: ''
            },
            profileEffect: '',
            profilePicOverride: '',
            profilePicOverrideThumbnail: '',
            pronouns: '',
            pronounsHistory: [],
            queuedInstance: '',
            receiveMobileInvitations: false,
            state: '',
            status: '',
            statusDescription: '',
            statusFirstTime: false,
            statusHistory: [],
            steamDetails: {},
            steamId: '',
            tags: [],
            temporaryExpiryDate: null,
            twitchDetails: {
                display_name: '',
                id: '',
                login: '',
                profile_image_url: ''
            },
            twitchId: '',
            twoFactorAuthEnabled: false,
            twoFactorAuthEnabledDate: null,
            unsubscribe: false,
            updated_at: '',
            userIcon: '',
            userLanguage: '',
            userLanguageCode: '',
            username: '',
            usesGeneratedPassword: false,
            viveId: '',
            // VRCX
            $online_for: Date.now(),
            $offline_for: null,
            $location_at: Date.now(),
            $travelingToTime: Date.now(),
            $previousAvatarSwapTime: null,
            $homeLocation: {},
            $isVRCPlus: false,
            $isModerator: false,
            $isTroll: false,
            $isProbableTroll: false,
            $trustLevel: 'Visitor',
            $trustClass: 'x-tag-untrusted',
            $userColour: '',
            $trustSortNum: 1,
            $languages: [],
            $locationTag: '',
            $travelingToLocation: '',
            $friendsComplete: false
        }
    );

    const currentUserCredits = ref(null);

    const userDialog = ref({
        visible: false,
        loading: false,
        activeTab: 'Info',
        lastActiveTab: 'Info',
        id: '',
        ref: {},
        publicProfileRef: {},
        theme: {
            iconColor: '',
            buttonColor: '',
            subtextColor: ''
        },
        friend: {},
        isFriend: false,
        incomingRequest: false,
        outgoingRequest: false,
        isBlock: false,
        isMute: false,
        isHideAvatar: false,
        isShowAvatar: false,
        isInteractOff: false,
        isMuteChat: false,
        isFavorite: false,
        $location: {},
        $homeLocationName: '',
        users: [],
        instance: {
            id: '',
            tag: '',
            $location: {},
            friendCount: 0,
            users: [],
            shortName: '',
            ref: {}
        },
        worlds: [],
        avatars: [],
        licensedAvatars: [],
        isWorldsLoading: false,
        isFavoriteWorldsLoading: false,
        isAvatarsLoading: false,
        isGroupsLoading: false,
        // Kept here, not in the tabs, so they survive the dialog remounting
        groupsRequestId: 0,
        worldsRequestId: 0,
        worldsRequestUserId: null,
        userFavoriteWorlds: [],
        userGroups: {
            groups: [],
            ownGroups: [],
            mutualGroups: [],
            remainingGroups: []
        },

        worldSorting: {
            name: 'dialog.user.worlds.sorting.updated',
            value: 'updated'
        },
        worldOrder: {
            name: 'dialog.user.worlds.order.descending',
            value: 'descending'
        },
        groupSorting: {
            name: 'dialog.user.groups.sorting.alphabetical',
            value: 'alphabetical'
        },
        mutualFriendSorting: {
            name: 'dialog.user.mutual_friends.sorting.alphabetical',
            value: 'alphabetical'
        },
        avatarSorting: 'update',
        avatarReleaseStatus: 'all',
        activityPeriodDays: '30',
        memo: '',
        $avatarInfo: {
            ownerId: '',
            avatarName: '',
            fileCreatedAt: ''
        },
        representedGroup: {
            bannerId: '',
            bannerUrl: '',
            description: '',
            discriminator: '',
            groupId: '',
            iconUrl: '',
            id: '',
            isRepresenting: false,
            memberCount: 0,
            memberVisibility: '',
            name: '',
            ownerId: '',
            privacy: '',
            shortCode: '',
            $thumbnailUrl: '',
            $memberId: ''
        },
        isRepresentedGroupLoading: false,
        joinCount: 0,
        timeSpent: 0,
        lastSeen: '',
        avatarModeration: 0,
        previousDisplayNames: [],
        dateFriended: '',
        unFriended: false,
        dateFriendedInfo: [],
        mutualFriendCount: 0,
        mutualGroupCount: 0,
        mutualFriends: [],
        isMutualFriendsLoading: false
    });

    const editProfileDialog = ref({
        visible: false,
        loading: false,
        selfProfileRef: {},
        status: '',
        statusDescription: '',
        pronouns: '',
        bio: ''
    });

    const currentTravelers = reactive(new Map());
    const subsetOfLanguages = ref([]);
    const showUserDialogHistory = reactive(new Set());
    const customUserTags = reactive(new Map());

    const state = reactive({
        instancePlayerCount: new Map()
    });

    const cachedUsers = shallowReactive(new Map());
    const cachedProfiles = ref(new Map());
    const cachedUserIdsByDisplayName = shallowReactive(new Map());

    function addCachedUserDisplayNameEntry(displayName, userId) {
        if (!displayName || !userId) {
            return;
        }
        let userIds = cachedUserIdsByDisplayName.get(displayName);
        if (!userIds) {
            userIds = new Set();
            cachedUserIdsByDisplayName.set(displayName, userIds);
        }
        userIds.add(userId);
    }

    function removeCachedUserDisplayNameEntry(displayName, userId) {
        if (!displayName || !userId) {
            return;
        }
        const userIds = cachedUserIdsByDisplayName.get(displayName);
        if (!userIds) {
            return;
        }
        userIds.delete(userId);
        if (userIds.size === 0) {
            cachedUserIdsByDisplayName.delete(displayName);
        }
    }

    function syncCachedUserDisplayName(ref, previousDisplayName = '') {
        if (!ref?.id) {
            return;
        }
        if (previousDisplayName && previousDisplayName !== ref.displayName) {
            removeCachedUserDisplayNameEntry(previousDisplayName, ref.id);
        }
        addCachedUserDisplayNameEntry(ref.displayName, ref.id);
    }

    function setCachedUser(ref, previousDisplayName = '', { skipIndex = false } = {}) {
        if (!ref?.id) {
            return;
        }
        cachedUsers.set(ref.id, ref);
        if (!skipIndex) {
            syncCachedUserDisplayName(ref, previousDisplayName);
        }
    }

    function deleteCachedUser(userId) {
        const ref = cachedUsers.get(userId);
        if (!ref) {
            return false;
        }
        removeCachedUserDisplayNameEntry(ref.displayName, userId);
        return cachedUsers.delete(userId);
    }

    function deleteCachedProfile(userId) {
        const ref = cachedProfiles.value.get(userId);
        if (!ref) {
            return false;
        }
        return cachedProfiles.value.delete(userId);
    }

    function clearCachedUsers() {
        cachedUsers.clear();
        cachedProfiles.value.clear();
        cachedUserIdsByDisplayName.clear();
    }

    function rebuildCachedUserDisplayNameIndex() {
        cachedUserIdsByDisplayName.clear();
        for (const ref of cachedUsers.values()) {
            addCachedUserDisplayNameEntry(ref.displayName, ref.id);
        }
    }

    watch(
        () => watchState.isLoggedIn,
        (isLoggedIn) => {
            if (!isLoggedIn) {
                currentTravelers.clear();
                showUserDialogHistory.clear();
                state.instancePlayerCount.clear();
                customUserTags.clear();
                subsetOfLanguages.value = [];
                uiStore.clearDialogCrumbs();
            }
        },
        { flush: 'sync' }
    );

    watch(
        () => watchState.isFriendsLoaded,
        (isFriendsLoaded) => {
            if (isFriendsLoaded) {
                getAllUserMemos();
            }
        },
        { flush: 'sync' }
    );

    /**
     * @param {object} ref
     */
    function applyUserLanguage(ref) {
        if (!ref || !ref.tags || !subsetOfLanguages.value) {
            return;
        }

        ref.$languages = [];
        const languagePrefix = 'language_';
        const prefixLength = languagePrefix.length;

        for (const tag of ref.tags) {
            if (tag.startsWith(languagePrefix)) {
                const key = tag.substring(prefixLength);
                const value = subsetOfLanguages.value[key];

                if (value !== undefined) {
                    ref.$languages.push({ key, value });
                }
            }
        }
    }

    /**
     * @param {object} ref
     */
    function applyPresenceLocation(ref) {
        const presence = ref.presence;
        if (isRealInstance(presence.world)) {
            ref.$locationTag = `${presence.world}:${presence.instance}`;
        } else {
            ref.$locationTag = presence.world;
        }
        if (isRealInstance(presence.travelingToWorld)) {
            ref.$travelingToLocation = `${presence.travelingToWorld}:${presence.travelingToInstance}`;
        } else {
            ref.$travelingToLocation = presence.travelingToWorld;
        }
        runUpdateCurrentUserLocationFlow();
    }

    /**
     * @param {boolean} updateInstanceOccupants
     */
    function applyUserDialogLocation(updateInstanceOccupants = false) {
        let addUser;
        let friend;
        let ref;
        const D = userDialog.value;
        if (!D.visible) {
            return;
        }
        const L = parseLocation(D.ref.$location?.tag);
        if (updateInstanceOccupants && L.isRealInstance) {
            instanceRequest.getInstance({
                worldId: L.worldId,
                instanceId: L.instanceId
            });
        }
        D.$location = L;
        L.user = {};
        if (L.userId) {
            ref = cachedUsers.get(L.userId);
            if (typeof ref === 'undefined') {
                userRequest
                    .getUser({
                        userId: L.userId
                    })
                    .then((args) => {
                        if (args.ref.id === L.userId) {
                            Object.assign(L.user, args.ref);
                            D.$location = L;
                            applyUserDialogLocation();
                        }
                    });
            } else {
                L.user = ref;
            }
        }
        const users = [];
        let friendCount = 0;
        const playersInInstance = locationStore.lastLocation.playerList;
        const cachedCurrentUser = cachedUsers.get(currentUser.value.id);
        const currentLocation = cachedCurrentUser?.$location?.tag;
        if (!L.isOffline && currentLocation === L.tag) {
            ref = cachedUsers.get(currentUser.value.id);
            if (typeof ref !== 'undefined') {
                users.push(ref); // add self
            }
        }
        // dont use gamelog when using api location
        if (locationStore.lastLocation.location === L.tag && playersInInstance.size > 0) {
            const friendsInInstance = locationStore.lastLocation.friendList;
            for (friend of friendsInInstance.values()) {
                // if friend isn't in instance add them
                addUser = !users.some(function (user) {
                    return friend.userId === user.id;
                });
                if (addUser) {
                    ref = cachedUsers.get(friend.userId);
                    if (typeof ref !== 'undefined') {
                        users.push(ref);
                    }
                }
            }
            friendCount = users.length - 1;
        }
        if (!L.isOffline) {
            for (friend of friendStore.friends.values()) {
                if (typeof friend.ref === 'undefined') {
                    continue;
                }
                if (friend.ref.location === locationStore.lastLocation.location) {
                    // don't add friends to currentUser gameLog instance (except when traveling)
                    continue;
                }
                if (friend.ref.$location.tag === L.tag) {
                    if (friend.state !== 'online' && friend.ref.location === 'private') {
                        // don't add offline friends to private instances
                        continue;
                    }
                    // if friend isn't in instance add them
                    addUser = !users.some(function (user) {
                        return friend.name === user.displayName;
                    });
                    if (addUser) {
                        users.push(friend.ref);
                    }
                }
            }
            friendCount = users.length;
        }
        if (appearanceSettingsStore.instanceUsersSortAlphabetical) {
            users.sort(compareByDisplayName);
        } else {
            users.sort(compareByLocationAt);
        }
        D.users = users;
        if ((L.worldId && currentLocation === L.tag && playersInInstance.size > 0) || !L.isRealInstance) {
            D.instance = {
                id: L.instanceId,
                tag: L.tag,
                $location: L,
                friendCount: 0,
                users: [],
                shortName: '',
                ref: {}
            };
        }
        const instanceRef = instanceStore.cachedInstances.get(L.tag) || {};
        Object.assign(D.instance.ref, instanceRef);
        D.instance.friendCount = friendCount;
    }

    /**
     * @param {string} value
     */
    function setUserDialogMemo(value) {
        userDialog.value.memo = value;
    }

    /**
     * @param {boolean} value
     */
    function setUserDialogVisible(value) {
        userDialog.value.visible = value;
    }

    /**
     * @param {boolean} value
     */
    function setUserDialogIsFavorite(value) {
        userDialog.value.isFavorite = value;
    }

    /**
     * @param {string} value
     */
    function setCurrentUserColour(value) {
        currentUser.value.$userColour = value;
    }

    /**
     * @param {string} location
     * @param {string} travelingToLocation
     * @param {number} timestamp
     */
    function setCurrentUserLocationState(location, travelingToLocation, timestamp = Date.now()) {
        currentUser.value.$location_at = timestamp;
        currentUser.value.$travelingToTime = timestamp;
        currentUser.value.$locationTag = location;
        currentUser.value.$travelingToLocation = travelingToLocation;
    }

    /**
     * @param {number} value
     */
    function setCurrentUserTravelingToTime(value) {
        currentUser.value.$travelingToTime = value;
    }

    /**
     * @param {object} value
     */
    function setCurrentUser(value) {
        currentUser.value = value;
    }

    /**
     * @param {number | null} value
     */
    function setCurrentUserCredits(value) {
        currentUserCredits.value = value;
    }

    /**
     * @param {object} value
     */
    function setSubsetOfLanguages(value) {
        subsetOfLanguages.value = value;
    }

    function showEditProfileDialog() {
        const D = editProfileDialog.value;
        D.status = currentUser.value.status;
        D.statusDescription = currentUser.value.statusDescription;
        D.pronouns = currentUser.value.pronouns;

        userRequest.getSelfProfile().then((args) => {
            const ref = args.json;
            D.selfProfileRef = ref;
            D.pronouns = ref.pronouns;
            D.bio = ref.bio;
        });

        D.visible = true;
    }

    function markCurrentUserGameStarted() {
        currentUser.value.$online_for = Date.now();
        currentUser.value.$offline_for = null;
        currentUser.value.$previousAvatarSwapTime = Date.now();
    }

    function markCurrentUserGameStopped() {
        currentUser.value.$online_for = 0;
        currentUser.value.$offline_for = Date.now();
        currentUser.value.$previousAvatarSwapTime = null;
    }

    return {
        state,

        currentUser,
        currentUserCredits,
        currentTravelers,
        userDialog,
        editProfileDialog,
        subsetOfLanguages,
        showUserDialogHistory,
        customUserTags,
        cachedUsers,
        cachedProfiles,
        cachedUserIdsByDisplayName,
        applyUserLanguage,
        applyPresenceLocation,
        applyUserDialogLocation,
        setCachedUser,
        syncCachedUserDisplayName,
        deleteCachedUser,
        deleteCachedProfile,
        clearCachedUsers,
        rebuildCachedUserDisplayNameIndex,
        showEditProfileDialog,
        setUserDialogMemo,
        setUserDialogVisible,
        setUserDialogIsFavorite,
        setCurrentUserColour,
        setCurrentUserLocationState,
        setCurrentUserTravelingToTime,
        setCurrentUser,
        setSubsetOfLanguages,
        setCurrentUserCredits,
        markCurrentUserGameStarted,
        markCurrentUserGameStopped
    };
});
