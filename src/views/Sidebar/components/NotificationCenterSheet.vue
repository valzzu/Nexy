<template>
    <Sheet v-model:open="isNotificationCenterOpen">
        <SheetContent side="right" class="flex flex-col p-0 sm:max-w-md px-1" @open-auto-focus.prevent>
            <SheetHeader class="border-b px-4 pt-4 pb-3">
                <div class="flex items-center pr-6">
                    <SheetTitle>{{ t('side_panel.notification_center.title') }}</SheetTitle>
                </div>
            </SheetHeader>
            <Tabs v-model="activeTab" class="flex min-h-0 flex-1 flex-col">
                <TabsList class="mr-4 ml-2 mt-2 grid w-auto grid-cols-3">
                    <TabsTrigger value="friend">
                        {{ t('side_panel.notification_center.tab_friend') }}
                        <span v-if="unseenFriendNotifications.length" class="ml-1 text-xs text-muted-foreground">
                            ({{ unseenFriendNotifications.length }})
                        </span>
                    </TabsTrigger>
                    <TabsTrigger value="group">
                        {{ t('side_panel.notification_center.tab_group') }}
                        <span v-if="unseenGroupNotifications.length" class="ml-1 text-xs text-muted-foreground">
                            ({{ unseenGroupNotifications.length }})
                        </span>
                    </TabsTrigger>
                    <TabsTrigger value="other">
                        {{ t('side_panel.notification_center.tab_other') }}
                        <span v-if="unseenOtherNotifications.length" class="ml-1 text-xs text-muted-foreground">
                            ({{ unseenOtherNotifications.length }})
                        </span>
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="friend" class="mt-0 min-h-0 flex-1 overflow-hidden">
                    <NotificationList
                        :notifications="unseenFriendNotifications"
                        :recent-notifications="recentFriendNotifications"
                        @navigate-to-table="navigateToTable" />
                </TabsContent>
                <TabsContent value="group" class="mt-0 min-h-0 flex-1 overflow-hidden">
                    <NotificationList
                        :notifications="unseenGroupNotifications"
                        :recent-notifications="recentGroupNotifications"
                        @navigate-to-table="navigateToTable" />
                </TabsContent>
                <TabsContent value="other" class="mt-0 min-h-0 flex-1 overflow-hidden">
                    <NotificationList
                        :notifications="unseenOtherNotifications"
                        :recent-notifications="recentOtherNotifications"
                        @navigate-to-table="navigateToTable" />
                </TabsContent>
            </Tabs>
        </SheetContent>
    </Sheet>
</template>

<script setup>
    import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
    import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
    import { ref, watch } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';
    import { useRouter } from 'vue-router';

    import { useNotificationStore } from '../../../stores';

    import NotificationList from './NotificationList.vue';

    const { t } = useI18n();
    const router = useRouter();

    const {
        isNotificationCenterOpen,
        unseenFriendNotifications,
        unseenGroupNotifications,
        unseenOtherNotifications,
        recentFriendNotifications,
        recentGroupNotifications,
        recentOtherNotifications
    } = storeToRefs(useNotificationStore());

    const activeTab = ref('friend');

    watch(isNotificationCenterOpen, (open) => {
        if (open) {
            if (unseenFriendNotifications.value.length) {
                activeTab.value = 'friend';
            } else if (unseenGroupNotifications.value.length) {
                activeTab.value = 'group';
            } else if (unseenOtherNotifications.value.length) {
                activeTab.value = 'other';
            } else {
                activeTab.value = 'friend';
            }
        }
    });

    function navigateToTable() {
        isNotificationCenterOpen.value = false;
        router.push({ name: 'notification', query: { fromCenter: '1' } });
    }
</script>
