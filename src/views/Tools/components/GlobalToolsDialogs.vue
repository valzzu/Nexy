<template>
    <ExportDiscordNamesDialog v-model:discordNamesDialogVisible="exportDiscordNames" :friends="friends" />
    <ExportFriendsListDialog v-model:isExportFriendsListDialogVisible="exportFriendsList" :friends="friends" />
    <AutoChangeStatusDialog
        :isAutoChangeStatusDialogVisible="autoChangeStatus"
        @close="closeDialog('autoChangeStatus')" />
</template>

<script setup>
    import { storeToRefs } from 'pinia';

    import { useFriendStore, useToolsStore } from '../../../stores';

    import AutoChangeStatusDialog from '../dialogs/AutoChangeStatusDialog.vue';
    import ExportDiscordNamesDialog from '../dialogs/ExportDiscordNamesDialog.vue';
    import ExportFriendsListDialog from '../dialogs/ExportFriendsListDialog.vue';

    const { friends } = storeToRefs(useFriendStore());
    const toolsStore = useToolsStore();
    const { autoChangeStatus, exportDiscordNames, exportFriendsList } = storeToRefs(toolsStore);

    const { closeDialog } = toolsStore;
</script>
