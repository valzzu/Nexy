<template>
    <div class="flex h-full min-h-0 flex-col overflow-hidden p-2 rounded-xl bg-(--profile-card)">
        <div class="shrink-0" style="display: flex; align-items: center; justify-content: space-between">
            <div style="display: flex; align-items: center">
                <Button
                    class="rounded-full"
                    variant="ghost"
                    size="icon-sm"
                    :disabled="userDialog.isGroupsLoading"
                    @click="getUserGroups(userDialog.id)">
                    <Spinner v-if="userDialog.isGroupsLoading" />
                    <RefreshCw v-else />
                </Button>
                <span class="ml-1.5 text-sm">{{
                    t('dialog.user.groups.total_count', { count: userDialog.userGroups.groups.length })
                }}</span>
            </div>
            <div style="display: flex; align-items: center">
                <Input
                    v-model="groupSearchQuery"
                    class="h-8 w-40 mr-2"
                    :placeholder="t('dialog.user.groups.search_placeholder')"
                    @click.stop />
                <span style="margin-right: 6px">{{ t('dialog.user.groups.sort_by') }}</span>
                <Select
                    :model-value="userDialogGroupSortingKey"
                    :disabled="userDialog.isGroupsLoading"
                    @update:modelValue="setUserDialogGroupSortingByKey">
                    <SelectTrigger size="sm" @click.stop>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem
                            v-for="(item, key) in userDialogGroupSortingOptions"
                            :key="String(key)"
                            :value="String(key)"
                            :disabled="
                                item === userDialogGroupSortingOptions.inGame && userDialog.id !== currentUser.id
                            ">
                            {{ t(item.name) }}
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
        <div class="min-h-0 flex-1 overflow-auto">
            <div style="margin-top: 8px">
                <template v-if="groupSearchActive">
                    <div class="flex flex-wrap items-start" style="margin-top: 8px">
                        <UserDialogGroupCard
                            v-for="group in allFilteredGroups"
                            :key="group.id"
                            :group="group"
                            :can-manage="currentUser.id === userDialog.id" />
                    </div>
                </template>
                <template v-else>
                    <div class="flex justify-between align-bottom">
                        <span class="text-base font-bold"
                            >{{ t('dialog.user.groups.own_groups') }}
                            <span class="text-xs ml-1.5">{{ userDialog.userGroups.ownGroups.length }}</span></span
                        >

                        <TooltipWrapper
                            v-if="currentUser.id === userDialog.id"
                            :content="createGroupTooltip"
                            side="top">
                            <span class="ml-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    :disabled="!canCreateGroup"
                                    @click="showCreateGroupDialog">
                                    <Plus />
                                    {{ t('dialog.group_edit.create') }}
                                </Button>
                            </span>
                        </TooltipWrapper>
                    </div>
                    <div class="flex flex-wrap items-start" style="margin-top: 8px; margin-bottom: 16px">
                        <UserDialogGroupCard
                            v-for="group in userDialog.userGroups.ownGroups"
                            :key="group.id"
                            :group="group"
                            :can-manage="currentUser.id === userDialog.id" />
                    </div>
                    <template v-if="userDialog.userGroups.mutualGroups.length > 0">
                        <span class="text-base font-bold">{{ t('dialog.user.groups.mutual_groups') }}</span>
                        <span class="text-xs ml-1.5">{{ userDialog.userGroups.mutualGroups.length }}</span>
                        <div class="flex flex-wrap items-start" style="margin-top: 8px; margin-bottom: 16px">
                            <UserDialogGroupCard
                                v-for="group in userDialog.userGroups.mutualGroups"
                                :key="group.id"
                                :group="group"
                                :can-manage="currentUser.id === userDialog.id" />
                        </div>
                    </template>
                    <template v-if="userDialog.userGroups.remainingGroups.length > 0">
                        <span class="text-base font-bold">{{ t('dialog.user.groups.groups') }}</span>
                        <span class="text-xs ml-1.5">
                            {{ userDialog.userGroups.remainingGroups.length }}
                        </span>
                        <div class="flex flex-wrap items-start" style="margin-top: 8px; margin-bottom: 16px">
                            <UserDialogGroupCard
                                v-for="group in userDialog.userGroups.remainingGroups"
                                :key="group.id"
                                :group="group"
                                :can-manage="currentUser.id === userDialog.id" />
                        </div>
                    </template>
                </template>
            </div>
        </div>
    </div>
</template>

<script setup>
    import { Plus, RefreshCw } from 'lucide-vue-next';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { computed, ref, watch } from 'vue';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Spinner } from '@/components/ui/spinner';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import UserDialogGroupCard from './UserDialogGroupCard.vue';
    import { useGroupStore, useUserStore } from '../../../stores';
    import { applyGroup, saveCurrentUserGroups, handleGroupList } from '../../../coordinators/groupCoordinator';
    import { compareByMemberCount, compareByName } from '../../../shared/utils';
    import { groupRequest } from '../../../api';
    import { useOptionKeySelect } from '../../../composables/useOptionKeySelect';
    import { userDialogGroupSortingOptions } from '../../../shared/constants';

    const { t } = useI18n();

    const { userDialog, currentUser } = storeToRefs(useUserStore());
    const groupStore = useGroupStore();
    const { currentUserGroups } = storeToRefs(groupStore);
    const { showCreateGroupDialog } = groupStore;

    const { selectedKey: userDialogGroupSortingKey, selectByKey: setUserDialogGroupSortingByKey } = useOptionKeySelect(
        userDialogGroupSortingOptions,
        () => userDialog.value.groupSorting,
        setUserDialogGroupSorting
    );

    const groupSearchQuery = ref('');
    const groupSearchActive = computed(() => groupSearchQuery.value.trim().length > 0);
    // NexVR needs no VRC+ and enforces each account's own group limit when
    // creating, so the button only waits for the group list to load
    const canCreateGroup = computed(
        () => currentUser.value.id === userDialog.value.id && !userDialog.value.isGroupsLoading
    );
    const createGroupTooltip = computed(() => undefined);
    const allFilteredGroups = computed(() => {
        const query = groupSearchQuery.value.trim().toLowerCase();
        if (!query) return [];
        return userDialog.value.userGroups.groups.filter((g) => (g.name || '').toLowerCase().includes(query));
    });

    watch(
        () => userDialog.value.id,
        () => {
            groupSearchQuery.value = '';
        }
    );

    /**
     * @param sortOrder
     */
    async function setUserDialogGroupSorting(sortOrder) {
        const D = userDialog.value;
        if (D.groupSorting.value === sortOrder.value) {
            return;
        }
        D.groupSorting = sortOrder;
        await sortCurrentUserGroups();
    }

    /**
     * @param userId
     */
    async function getUserGroups(userId) {
        const requestId = ++userDialog.value.groupsRequestId;
        userDialog.value.isGroupsLoading = true;
        userDialog.value.userGroups = {
            groups: [],
            ownGroups: [],
            mutualGroups: [],
            remainingGroups: []
        };
        try {
            const args = await groupRequest.getGroups({ userId });
            // A newer request owns the lists now, even one for this same user, so
            // a stale response must not touch them or the shared group caches
            if (requestId !== userDialog.value.groupsRequestId) {
                return;
            }
            handleGroupList(args);
            if (userId !== userDialog.value.id) {
                return;
            }
            if (userId === currentUser.value.id) {
                // update current user groups
                currentUserGroups.value.clear();
                args.json.forEach((group) => {
                    const ref = applyGroup(group);
                    if (!currentUserGroups.value.has(group.id)) {
                        currentUserGroups.value.set(group.id, ref);
                    }
                });

                saveCurrentUserGroups();
            }
            userDialog.value.userGroups.groups = args.json;
            for (let i = 0; i < args.json.length; ++i) {
                const group = args.json[i];
                if (!group?.id) {
                    console.error('getUserGroups, group ID is missing', group);
                    continue;
                }
                if (group.ownerId === userId) {
                    userDialog.value.userGroups.ownGroups.unshift(group);
                }
                if (userId === currentUser.value.id) {
                    // skip mutual groups for current user
                    if (group.ownerId !== userId) {
                        userDialog.value.userGroups.remainingGroups.unshift(group);
                    }
                    continue;
                }
                if (group.mutualGroup) {
                    userDialog.value.userGroups.mutualGroups.unshift(group);
                }
                if (!group.mutualGroup && group.ownerId !== userId) {
                    userDialog.value.userGroups.remainingGroups.unshift(group);
                }
            }
            await sortCurrentUserGroups();
        } finally {
            if (requestId === userDialog.value.groupsRequestId) {
                userDialog.value.isGroupsLoading = false;
            }
        }
    }

    async function sortCurrentUserGroups() {
        const D = userDialog.value;
        /** @type {(a: any, b: any) => number} */
        let sortMethod = () => 0;

        switch (D.groupSorting.value) {
            case 'alphabetical':
                sortMethod = compareByName;
                break;
            case 'members':
                sortMethod = compareByMemberCount;
                break;
        }

        userDialog.value.userGroups.ownGroups.sort(sortMethod);
        userDialog.value.userGroups.mutualGroups.sort(sortMethod);
        userDialog.value.userGroups.remainingGroups.sort(sortMethod);
    }

    defineExpose({ getUserGroups });
</script>
