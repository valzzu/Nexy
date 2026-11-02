<template>
    <div class="user-dialog-scrollbars flex-1 min-h-0 min-w-0 flex flex-row">
        <DialogHeader class="sr-only">
            <DialogTitle>{{
                userDialog.ref?.displayName || userDialog.id || t('dialog.user.info.header')
            }}</DialogTitle>
            <DialogDescription>{{ getUserStateText(userDialog.ref || {}) }}</DialogDescription>
        </DialogHeader>

        <div class="flex-none w-77 overflow-y-auto">
            <UserSummaryHeader
                :get-user-state-text="getUserStateText"
                :copy-user-display-name="copyUserDisplayName"
                :user-dialog-command="userDialogCommand" />
        </div>

        <div class="flex-1 min-w-0 flex flex-col min-h-0 pl-2">
            <TabsUnderline
                v-model="userDialog.activeTab"
                :items="userDialogTabs"
                :activeColor="userDialogTabColor"
                :unmount-on-hide="false"
                fill
                :background="true"
                @update:modelValue="userDialogTabClick">
                <template #Info>
                    <UserDialogInfoTab ref="infoTabRef" />
                </template>

                <template #Groups>
                    <UserDialogGroupsTab ref="groupsTabRef" />
                </template>

                <template #Worlds>
                    <UserDialogWorldsTab ref="worldsTabRef" />
                </template>

                <template #Activity>
                    <UserDialogActivityTab ref="activityTabRef" />
                </template>

                <template #JSON>
                    <DialogJsonTab
                        class="rounded-xl bg-(--profile-card) p-2"
                        :tree-data="treeData"
                        :tree-data-key="treeData?.user?.id"
                        :dialog-id="userDialog.id"
                        :dialog-ref="userDialog.ref"
                        @refresh="refreshUserDialogTreeData()" />
                </template>
            </TabsUnderline>
        </div>
    </div>
</template>

<script setup>
    import { computed, onMounted, ref, watch } from 'vue';
    import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { TabsUnderline } from '@/components/ui/tabs';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import {
        useFriendStore,
        useInstanceStore,
        useLocationStore,
        useModalStore,
        useNotificationStore,
        useUserStore
    } from '../../../stores';
    import { copyToClipboard } from '../../../shared/utils';
    import { getRawPresence, getRawResponse, presentSections } from '../../../services/nexvr/rawResponses';
    import { useUserDialogCommands } from './useUserDialogCommands';
    import { showUserDialog } from '../../../coordinators/userCoordinator';
    import { getFriendRequest, handleFriendDelete } from '../../../coordinators/friendRelationshipCoordinator';

    import DialogJsonTab from '../DialogJsonTab.vue';
    import UserDialogActivityTab from './UserDialogActivityTab.vue';
    import UserDialogGroupsTab from './UserDialogGroupsTab.vue';
    import UserDialogInfoTab from './UserDialogInfoTab.vue';
    import UserDialogWorldsTab from './UserDialogWorldsTab.vue';
    import UserSummaryHeader from './UserSummaryHeader.vue';

    const props = defineProps({
        previousIds: {
            type: Object,
            required: true
        },
        updatePreviousId: {
            type: Function,
            default: () => {}
        }
    });

    const { t } = useI18n();
    const userDialogTabs = computed(() => {
        const tabs = [
            { value: 'Info', label: t('dialog.user.info.header') },
            { value: 'Groups', label: t('dialog.user.groups.header') },
            { value: 'Worlds', label: t('dialog.user.worlds.header') },
            { value: 'JSON', label: t('dialog.user.json.header') }
        ];
        // Insert Activity before JSON
        const jsonIdx = tabs.findIndex((tab) => tab.value === 'JSON');
        tabs.splice(jsonIdx, 0, { value: 'Activity', label: t('dialog.user.activity.header') });
        return tabs;
    });
    const infoTabRef = ref(null);
    const activityTabRef = ref(null);
    const worldsTabRef = ref(null);
    const groupsTabRef = ref(null);

    const modalStore = useModalStore();
    const instanceStore = useInstanceStore();

    const { userDialog, currentUser } = storeToRefs(useUserStore());
    const userDialogTabColor = computed(() => {
        const color = userDialog.value.theme?.buttonColor;
        if (!color) {
            return 'var(--primary)';
        }
        return color;
    });
    const scrollbarThumbColor = computed(() => {
        const color = userDialog.value.theme?.buttonColor;
        return color === 'var(--primary)'
            ? 'color-mix(in oklab, var(--foreground) 30%, transparent)'
            : `color-mix(in oklab, ${color} 50%, transparent)`;
    });
    const { cachedUsers, showEditProfileDialog } = useUserStore();
    const { lastLocation, lastLocationDestination } = storeToRefs(useLocationStore());
    const { friendLogTable } = storeToRefs(useFriendStore());

    const { userDialogCommand, registerCallbacks } = useUserDialogCommands(userDialog, {
        t,
        toast,
        modalStore,
        cachedUsers,
        friendLogTable,
        lastLocation,
        lastLocationDestination,
        showUserDialog,
        getFriendRequest,
        handleFriendDelete,
        instanceStore,
        useNotificationStore,
        showEditProfileDialog
    });

    // Watching the id too: a cached user can load within one tick, so loading
    // flips true and back to false unseen and the open tab kept the last user
    watch([() => userDialog.value.visible, () => userDialog.value.loading, () => userDialog.value.id], () => {
        if (userDialog.value.visible && !userDialog.value.loading) {
            loadLastActiveTab();
        }
    });

    // The dialog can finish loading before this mounts, so the watcher above
    // never fires for it
    onMounted(() => {
        if (userDialog.value.visible && !userDialog.value.loading) {
            loadLastActiveTab();
        }
    });

    /** @type {import('vue').Ref<any>} */
    const treeData = ref({});

    // the dialog opens from the cached profile before NexVR's response is in,
    // so an open JSON tab refills once it arrives
    watch(
        () => [getRawResponse(`/users/${userDialog.value.id}`), getRawResponse('/auth/me')],
        () => {
            if (userDialog.value.visible && userDialog.value.lastActiveTab === 'JSON') {
                refreshUserDialogTreeData();
            }
        }
    );

    /**
     * @param user
     */
    function getUserStateText(user) {
        let state = '';
        if (user.state === 'active') {
            state = t('dialog.user.status.active');
        } else if (user.state === 'offline') {
            state = t('dialog.user.status.offline');
        } else {
            return getUserStatusText(user.status);
        }
        if (user.status && user.status !== 'active') {
            state += ` (${getUserStatusText(user.status)})`;
        }
        return state;
    }

    /**
     * @param status
     */
    function getUserStatusText(status) {
        if (status === 'active') {
            return t('dialog.user.status.active');
        }
        if (status === 'join me') {
            return t('dialog.user.status.join_me');
        }
        if (status === 'ask me') {
            return t('dialog.user.status.ask_me');
        }
        if (status === 'busy') {
            return t('dialog.user.status.busy');
        }
        return t('dialog.user.status.offline');
    }

    // What NexVR sent, not Nexy's VRChat-shaped copy: the profile, the live
    // presence for friends, and for yourself the signed-in account
    function refreshUserDialogTreeData() {
        const D = userDialog.value;
        treeData.value = presentSections({
            me: D.id === currentUser.value.id ? getRawResponse('/auth/me') : undefined,
            user: getRawResponse(`/users/${D.id}`),
            presence: getRawPresence(D.id)
        });
    }

    /**
     * @param tabName
     */
    function handleUserDialogTab(tabName) {
        userDialog.value.lastActiveTab = tabName;
        const userId = userDialog.value.id;
        if (tabName === 'Info') {
            infoTabRef.value?.onTabActivated();
        } else if (tabName === 'Groups') {
            if (props.previousIds.group !== userId) {
                props.updatePreviousId('group', userId);
                groupsTabRef.value?.getUserGroups(userId);
            }
        } else if (tabName === 'Worlds') {
            worldsTabRef.value?.setUserDialogWorlds(userId);
            if (props.previousIds.world !== userId) {
                props.updatePreviousId('world', userId);
                worldsTabRef.value?.refreshUserDialogWorlds();
            }
        } else if (tabName === 'Activity') {
            activityTabRef.value?.loadOnlineFrequency(userId);
        } else if (tabName === 'JSON') {
            refreshUserDialogTreeData();
        }
    }

    function loadLastActiveTab() {
        const tab = userDialog.value.lastActiveTab;
        handleUserDialogTab(tab);
    }

    /**
     * @param tabName
     */
    function userDialogTabClick(tabName) {
        if (tabName === userDialog.value.lastActiveTab) {
            if (tabName === 'JSON') {
                refreshUserDialogTreeData();
            }
            return;
        }
        handleUserDialogTab(tabName);
    }

    // Register simple dialog openers as callbacks for the command composable
    registerCallbacks({
        showEditProfileDialog,
        showEditNoteAndMemoDialog: () => infoTabRef.value?.showEditNoteAndMemoDialog()
    });

    /**
     * @param displayName
     */
    function copyUserDisplayName(displayName) {
        copyToClipboard(displayName, 'User DisplayName copied to clipboard');
    }
</script>

<style scoped>
    .user-dialog-scrollbars {
        --user-dialog-scrollbar-thumb: v-bind(scrollbarThumbColor);
        --user-dialog-scrollbar-track: transparent;
    }

    .user-dialog-scrollbars :deep(*) {
        scrollbar-color: var(--user-dialog-scrollbar-thumb) var(--user-dialog-scrollbar-track);
    }
</style>
