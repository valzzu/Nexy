<template>
    <Dialog :open="groupEditDialog.visible" @update:open="handleOpenChange">
        <DialogContent class="x-dialog sm:max-w-180 max-h-[85vh] overflow-hidden p-0 gap-0 flex flex-col">
            <DialogHeader class="px-6 pt-6 pb-4">
                <DialogTitle>
                    {{ isEditMode ? t('dialog.group_edit.edit_header') : t('dialog.group_edit.create_header') }}
                </DialogTitle>
            </DialogHeader>

            <div class="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 py-2">
                <FieldGroup class="gap-4">
                    <Field>
                        <FieldLabel>{{ t('dialog.group_edit.name') }}</FieldLabel>
                        <FieldContent>
                            <InputGroupField
                                v-model="groupEditDialog.name"
                                size="sm"
                                :maxlength="64"
                                :disabled="groupEditDialog.loading"
                                show-count />
                        </FieldContent>
                    </Field>

                    <Field>
                        <FieldLabel>{{ t('dialog.group_edit.description') }}</FieldLabel>
                        <FieldContent>
                            <InputGroupTextareaField
                                v-model="groupEditDialog.description"
                                :rows="4"
                                :maxlength="250"
                                :disabled="groupEditDialog.loading"
                                show-count />
                        </FieldContent>
                    </Field>

                    <Field>
                        <FieldLabel>{{ t('dialog.group_edit.join_state') }}</FieldLabel>
                        <FieldContent>
                            <Select v-model="groupEditDialog.joinState" :disabled="groupEditDialog.loading">
                                <SelectTrigger size="sm" class="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectItem
                                            v-for="option in joinStateOptions"
                                            :key="option.value"
                                            :value="option.value">
                                            {{ option.label }}
                                        </SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </FieldContent>
                    </Field>
                </FieldGroup>
            </div>

            <DialogFooter class="px-6 py-4">
                <Button variant="secondary" :disabled="groupEditDialog.loading" @click="closeDialog">
                    {{ t('common.actions.cancel') }}
                </Button>
                <Button :disabled="!canSubmit" @click="saveGroup">
                    {{
                        groupEditDialog.loading
                            ? t('dialog.group_edit.saving')
                            : isEditMode
                              ? t('dialog.group_edit.save')
                              : t('dialog.group_edit.create')
                    }}
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

    import { Button } from '@/components/ui/button';
    import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { Field, FieldContent, FieldGroup, FieldLabel } from '@/components/ui/field';
    import { InputGroupField, InputGroupTextareaField } from '@/components/ui/input-group';
    import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

    import { groupRequest } from '../../../api';
    import { applyGroup, showGroupDialog } from '../../../coordinators/groupCoordinator';
    import { useGroupStore } from '../../../stores';

    const { t } = useI18n();
    const { groupEditDialog } = storeToRefs(useGroupStore());

    const isEditMode = computed(() => groupEditDialog.value.mode === 'edit');
    const canSubmit = computed(() => {
        const D = groupEditDialog.value;
        return (
            !D.loading &&
            !D.roleTemplatesLoading &&
            D.name.trim().length >= 3 &&
            isJoinState(D.joinState) &&
            (isEditMode.value || (isPrivacy(D.privacy) && isRoleTemplate(D.roleTemplate)))
        );
    });

    const joinStateOptions = computed(() =>
        ['open', 'request', 'invite', 'closed'].map((value) => ({
            value,
            label: t(`dialog.group.tags.${value}`)
        }))
    );

    /**
     * @param {string} value
     * @returns {value is 'open' | 'request' | 'invite' | 'closed'}
     */
    function isJoinState(value) {
        return value === 'open' || value === 'request' || value === 'invite' || value === 'closed';
    }

    /**
     * @param {string} value
     * @returns {value is import('vrchat').GroupPrivacy}
     */
    function isPrivacy(value) {
        return value === 'default' || value === 'private';
    }

    /**
     * @param {string} value
     * @returns {value is 'default' | 'managedFree' | 'managedInvite' | 'managedRequest'}
     */
    function isRoleTemplate(value) {
        return (
            value === 'default' || value === 'managedFree' || value === 'managedInvite' || value === 'managedRequest'
        );
    }

    function closeDialog() {
        if (!groupEditDialog.value.loading) {
            groupEditDialog.value.visible = false;
        }
    }

    function handleOpenChange(open) {
        if (!open) {
            closeDialog();
        }
    }

    async function saveGroup() {
        if (!canSubmit.value) {
            return;
        }

        const D = groupEditDialog.value;
        const joinState = D.joinState;
        if (!isJoinState(joinState)) {
            return;
        }
        D.loading = true;
        try {
            const commonParams = {
                name: D.name.trim(),
                shortCode: D.shortCode,
                description: D.description.trim(),
                joinState,
                bannerId: D.bannerId || undefined,
                iconId: D.iconId || undefined
            };
            let args;
            if (isEditMode.value) {
                args = await groupRequest.editGroup({
                    id: D.groupId,
                    ...commonParams,
                    languages: D.languages.slice(0, 3),
                    rules: D.rules.trim(),
                    links: D.links.map((link) => link.trim()).filter(Boolean),
                    allowGroupJoinPrompt: D.allowGroupJoinPrompt
                });
            } else {
                const privacy = D.privacy;
                const roleTemplate = D.roleTemplate;
                if (!isPrivacy(privacy) || !isRoleTemplate(roleTemplate)) {
                    return;
                }
                args = await groupRequest.createGroup({
                    ...commonParams,
                    privacy,
                    roleTemplate
                });
            }

            const group = applyGroup(args.json);
            D.visible = false;
            toast.success(t(isEditMode.value ? 'dialog.group_edit.edit_success' : 'dialog.group_edit.create_success'));
            showGroupDialog(group.id, { forceRefresh: true });
        } catch (error) {
            console.error('Failed to save group:', error);
        } finally {
            D.loading = false;
        }
    }
</script>
