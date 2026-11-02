<template>
    <div style="flex: none" class="flex items-center">
        <DropdownMenu>
            <DropdownMenuTrigger as-child>
                <div class="ml-2">
                    <Button
                        variant="outline"
                        size="icon"
                        class="rounded-lg border-muted-foreground/30!"
                        :style="{
                            color:
                                userDialog.theme.iconColor === 'var(--muted-foreground)'
                                    ? 'var(--foreground)'
                                    : userDialog.theme.iconColor
                        }"
                        :class="{ 'dot-indicator': hasRequest }"
                        :ariaLabel="t('nav_tooltip.manage')">
                        <MoreHorizontal />
                    </Button>
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem @click="onCommand('Refresh')">
                    <RefreshCw class="size-4" />
                    {{ t('dialog.user.actions.refresh') }}
                </DropdownMenuItem>
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        <Share2 class="size-4 mr-2" />
                        <span>{{ t('dialog.user.actions.share') }}</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent side="right" align="start" class="w-56">
                        <DropdownMenuItem @click="onCommand('Copy DisplayName')">
                            <Copy class="size-4" />
                            {{ t('dialog.user.info.copy_display_name') }}
                        </DropdownMenuItem>
                        <DropdownMenuItem @click="onCommand('Copy UserId')">
                            <Copy class="size-4" />
                            {{ t('dialog.user.info.copy_id') }}
                        </DropdownMenuItem>
                    </DropdownMenuSubContent>
                </DropdownMenuSub>
                <template v-if="userDialog.ref.id === currentUser.id">
                    <DropdownMenuItem @click="onCommand('Edit Profile')">
                        <Pencil class="size-4" />
                        {{ t('dialog.user.actions.edit_profile') }}
                    </DropdownMenuItem>
                </template>
                <template v-else>
                    <template v-if="userDialog.isFriend">
                        <DropdownMenuSeparator />
                        <DropdownMenuItem @click="onCommand('Request Invite')">
                            <Mail class="size-4" />
                            {{ t('dialog.user.actions.request_invite') }}
                            <DropdownMenuShortcut v-if="isActionRecent(userDialog.id, 'Request Invite')">
                                <Clock class="size-3.5 text-muted-foreground" />
                            </DropdownMenuShortcut>
                        </DropdownMenuItem>
                        <template v-if="isGameRunning">
                            <DropdownMenuItem
                                :disabled="!checkCanInvite(lastLocation.location)"
                                @click="onCommand('Invite')">
                                <MessageSquare class="size-4" />
                                {{ t('dialog.user.actions.invite') }}
                                <DropdownMenuShortcut v-if="isActionRecent(userDialog.id, 'Invite')">
                                    <Clock class="size-3.5 text-muted-foreground" />
                                </DropdownMenuShortcut>
                            </DropdownMenuItem>
                        </template>
                    </template>
                    <template v-else-if="userDialog.incomingRequest">
                        <DropdownMenuItem @click="onCommand('Accept Friend Request')">
                            <Check class="size-4" />
                            {{ t('dialog.user.actions.accept_friend_request') }}
                        </DropdownMenuItem>
                        <DropdownMenuItem @click="onCommand('Decline Friend Request')">
                            <X class="size-4" />
                            {{ t('dialog.user.actions.decline_friend_request') }}
                        </DropdownMenuItem>
                    </template>
                    <DropdownMenuItem
                        v-else-if="userDialog.outgoingRequest"
                        @click="onCommand('Cancel Friend Request')">
                        <X class="size-4" />
                        {{ t('dialog.user.actions.cancel_friend_request') }}
                    </DropdownMenuItem>
                    <DropdownMenuItem v-else @click="onCommand('Send Friend Request')">
                        <Plus class="size-4" />
                        {{ t('dialog.user.actions.send_friend_request') }}
                        <DropdownMenuShortcut v-if="isActionRecent(userDialog.id, 'Send Friend Request')">
                            <Clock class="size-3.5 text-muted-foreground" />
                        </DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="onCommand('Edit Note Memo')">
                        <Pencil class="size-4" />
                        {{ t('dialog.user.actions.edit_note_memo') }}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem @click="onCommand('Previous Instances')">
                        <LineChart class="size-4" />
                        {{ t('dialog.user.actions.show_previous_instances') }}
                    </DropdownMenuItem>
                    <template v-if="userDialog.isFriend">
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" @click="onCommand('Unfriend')">
                            <Trash2 class="size-4" />
                            {{ t('dialog.user.actions.unfriend') }}
                        </DropdownMenuItem>
                    </template>
                </template>
            </DropdownMenuContent>
        </DropdownMenu>
    </div>
</template>

<script setup>
    import {
        Check,
        Clock,
        Copy,
        LineChart,
        Mail,
        MessageSquare,
        MoreHorizontal,
        Pencil,
        Plus,
        RefreshCw,
        Share2,
        Trash2,
        X
    } from 'lucide-vue-next';
    import { Button } from '@/components/ui/button';
    import { computed } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuSeparator,
        DropdownMenuSub,
        DropdownMenuSubContent,
        DropdownMenuSubTrigger,
        DropdownMenuShortcut,
        DropdownMenuTrigger
    } from '../../ui/dropdown-menu';
    import { useGameStore, useLocationStore, useUserStore } from '../../../stores';
    import { useInviteChecks } from '../../../composables/useInviteChecks';
    import { isActionRecent } from '../../../composables/useRecentActions';

    const props = defineProps({
        userDialogCommand: {
            type: Function,
            required: true
        }
    });

    const { t } = useI18n();

    const { userDialog, currentUser } = storeToRefs(useUserStore());
    const { isGameRunning } = storeToRefs(useGameStore());
    const { lastLocation } = storeToRefs(useLocationStore());
    const { checkCanInvite } = useInviteChecks();

    const hasRequest = computed(() => userDialog.value.incomingRequest || userDialog.value.outgoingRequest);

    function onCommand(command) {
        props.userDialogCommand(command);
    }
</script>
<style scoped>
    .dot-indicator::after {
        margin-left: 30px;
        margin-bottom: 30px;
        content: '';
        width: 10px;
        height: 10px;
        background-color: var(--color-emerald-500);
        border-radius: 50%;
        position: absolute;
    }
</style>
