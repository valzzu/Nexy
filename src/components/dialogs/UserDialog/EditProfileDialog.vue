<template>
    <Dialog v-model:open="editProfileDialog.visible">
        <DialogContent class="x-dialog sm:max-w-150 max-h-[85vh] overflow-hidden p-0 gap-0 flex flex-col">
            <DialogHeader class="px-6 pt-6 pb-4">
                <DialogTitle>{{ t('dialog.user.actions.edit_profile') }}</DialogTitle>
            </DialogHeader>

            <div
                class="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 py-2 space-y-4 [&>section]:rounded-lg [&>section]:border [&>section]:border-border [&>section]:bg-muted/20 [&>section]:p-4">
                <section class="space-y-3">
                    <h3 class="text-sm font-semibold">{{ t('dialog.social_status.header') }}</h3>

                    <div class="flex items-center gap-2 min-w-0">
                        <Select
                            :model-value="editProfileDialog.status"
                            :disabled="editProfileDialog.loading"
                            @update:modelValue="handleSocialStatusChange">
                            <SelectTrigger size="sm" class="w-42 shrink-0">
                                <SelectValue>
                                    <template v-if="selectedStatusOption">
                                        <span class="inline-flex items-center gap-2">
                                            <i class="x-user-status" :class="selectedStatusOption.statusClass"></i>
                                            <span>{{ selectedStatusOption.label }}</span>
                                        </span>
                                    </template>
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem
                                        v-for="option in statusOptions"
                                        :key="option.value"
                                        :value="option.value"
                                        :text-value="option.label">
                                        <div class="flex items-center gap-2">
                                            <i class="x-user-status" :class="option.statusClass"></i>
                                            <span>{{ option.label }}</span>
                                        </div>
                                    </SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>

                        <InputGroupField
                            class="min-w-0 flex-1"
                            v-model="editProfileDialog.statusDescription"
                            :placeholder="t('dialog.social_status.status_placeholder')"
                            :maxlength="32"
                            clearable>
                        </InputGroupField>
                    </div>

                    <div v-if="presets.length" class="space-y-2">
                        <span class="text-xs text-muted-foreground block">
                            {{ t('dialog.social_status.presets') }}
                        </span>
                        <div class="flex flex-wrap gap-1.5">
                            <div
                                v-for="(preset, index) in presets"
                                :key="index"
                                class="group inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full border bg-background text-xs cursor-pointer hover:bg-accent transition-colors max-w-50"
                                @click="applyPreset(preset)">
                                <i class="x-user-status flex-none" :class="getStatusClass(preset.status)"></i>
                                <span class="truncate">{{
                                    preset.statusDescription || getStatusLabel(preset.status)
                                }}</span>
                                <button
                                    class="flex-none size-4 inline-flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 hover:bg-muted transition-opacity cursor-pointer"
                                    @click.stop="handleDeletePreset(index)">
                                    <X class="size-3" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <Button variant="outline" :disabled="editProfileDialog.loading" @click="handleSavePreset">
                        <Bookmark class="size-4" />
                        {{ t('dialog.social_status.save_preset') }}
                    </Button>
                </section>

                <section class="space-y-3">
                    <h3 class="text-sm font-semibold">{{ t('dialog.pronouns.header') }}</h3>
                    <InputGroupTextareaField
                        v-model="editProfileDialog.pronouns"
                        :maxlength="32"
                        :rows="1"
                        input-class="min-h-0 py-2"
                        :placeholder="t('dialog.pronouns.pronouns_placeholder')"
                        show-count />
                </section>

                <section class="space-y-3">
                    <h3 class="text-sm font-semibold">{{ t('dialog.bio.header') }}</h3>

                    <InputGroupTextareaField
                        v-model="editProfileDialog.bio"
                        :maxlength="512"
                        :rows="5"
                        :placeholder="t('dialog.bio.bio_placeholder')"
                        show-count
                        autosize />
                </section>
            </div>

            <DialogFooter class="px-6 py-4">
                <Button
                    variant="outline"
                    :disabled="editProfileDialog.loading"
                    @click="editProfileDialog.visible = false">
                    {{ t('dialog.user.note_memo.cancel') }}
                </Button>
                <Button :disabled="editProfileDialog.loading" @click="saveProfile">
                    {{ t('dialog.bio.update') }}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<script setup>
    import { computed } from 'vue';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';
    import { Bookmark, X } from 'lucide-vue-next';

    import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { Button } from '@/components/ui/button';
    import { InputGroupField, InputGroupTextareaField } from '@/components/ui/input-group';

    import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';

    import { userRequest } from '../../../api';
    import { useUserStore } from '../../../stores';
    import { useStatusPresets } from './composables/useStatusPresets';
    import { updateUserDialogProfile } from '@/coordinators/userCoordinator';

    const { t } = useI18n();
    const { currentUser } = storeToRefs(useUserStore());
    const { presets, addPreset, removePreset, getStatusClass, MAX_PRESETS } = useStatusPresets();

    const props = defineProps({
        editProfileDialog: {
            type: Object,
            required: true
        }
    });

    const statusOptions = computed(() => {
        const options = [
            {
                value: 'join me',
                statusClass: 'joinme',
                label: t('dialog.user.status.join_me')
            },
            {
                value: 'active',
                statusClass: 'online',
                label: t('dialog.user.status.online')
            },
            {
                value: 'ask me',
                statusClass: 'askme',
                label: t('dialog.user.status.ask_me')
            },
            {
                value: 'busy',
                statusClass: 'busy',
                label: t('dialog.user.status.busy')
            }
        ];
        if (currentUser.value?.$isModerator) {
            options.push({
                value: 'offline',
                statusClass: 'offline',
                label: t('dialog.user.status.offline')
            });
        }
        return options;
    });

    const selectedStatusOption = computed(() =>
        statusOptions.value.find((option) => option.value === props.editProfileDialog.status)
    );

    function getStatusLabel(status) {
        const option = statusOptions.value.find((item) => item.value === status);
        return option?.label || status;
    }

    function applyPreset(preset) {
        props.editProfileDialog.status = preset.status;
        props.editProfileDialog.statusDescription = preset.statusDescription;
    }

    async function handleSavePreset() {
        const D = props.editProfileDialog;
        const result = await addPreset(D.status, D.statusDescription);
        if (result === 'ok') {
            toast.success(t('dialog.social_status.preset_saved'));
        } else if (result === 'exists') {
            toast.info(t('dialog.social_status.preset_exists'));
        } else if (result === 'limit') {
            toast.warning(t('dialog.social_status.preset_limit', { max: MAX_PRESETS }));
        }
    }

    async function handleDeletePreset(index) {
        await removePreset(index);
    }

    function handleSocialStatusChange(value) {
        props.editProfileDialog.status = String(value);
    }

    async function saveProfile() {
        const D = props.editProfileDialog;
        if (D.loading) {
            return;
        }

        const userPayload = {};
        if (D.status !== currentUser.value.status) {
            userPayload.status = D.status;
        }
        if (D.statusDescription !== currentUser.value.statusDescription) {
            userPayload.statusDescription = D.statusDescription;
        }
        if (D.pronouns !== currentUser.value.pronouns) {
            userPayload.pronouns = D.pronouns;
        }
        if (D.bio !== D.selfProfileRef?.bio) {
            userPayload.bio = D.bio;
        }

        D.loading = true;
        try {
            if (Object.keys(userPayload).length) {
                await userRequest.saveCurrentUser(userPayload);
            }
            D.visible = false;
            updateUserDialogProfile();
            toast.success('Profile updated');
        } finally {
            D.loading = false;
        }
    }
</script>
