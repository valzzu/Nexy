<template>
    <Dialog
        :open="props.visible"
        @update:open="
            (open) => {
                if (!open) cancel();
            }
        ">
        <DialogContent class="x-dialog sm:max-w-125 translate-y-0" style="top: 10vh" :show-close-button="false">
            <DialogHeader>
                <DialogTitle>{{ t('dialog.user.note_memo.header') }}</DialogTitle>
            </DialogHeader>

            <div>
                <span class="name">{{ t('dialog.user.info.memo') }}</span>
                <InputGroupTextareaField
                    v-model="memo"
                    class="text-xs mt-2"
                    :rows="6"
                    :placeholder="t('dialog.user.info.memo_placeholder')"
                    input-class="resize-none min-h-0" />
            </div>

            <DialogFooter>
                <Button variant="secondary" @click="cancel" class="mr-2">{{
                    t('dialog.user.note_memo.cancel')
                }}</Button>
                <Button @click="saveChanges">{{ t('dialog.user.note_memo.confirm') }}</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<script setup>
    import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { ref, watch } from 'vue';
    import { Button } from '@/components/ui/button';
    import { InputGroupTextareaField } from '@/components/ui/input-group';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { saveUserMemo } from '../../../coordinators/memoCoordinator';
    import { useUserStore } from '../../../stores';

    const { userDialog } = storeToRefs(useUserStore());

    const { t } = useI18n();

    const props = defineProps({
        visible: {
            type: Boolean,
            required: true
        }
    });

    const emit = defineEmits(['update:visible']);

    const memo = ref('');

    watch(
        () => props.visible,
        (val) => {
            if (!val) return;
            memo.value = userDialog.value.memo;
        }
    );

    function saveChanges() {
        onUserMemoChange();
        emit('update:visible', false);
    }

    function cancel() {
        emit('update:visible', false);
    }

    function onUserMemoChange() {
        const D = userDialog.value;
        saveUserMemo(D.id, memo.value);
    }
</script>
