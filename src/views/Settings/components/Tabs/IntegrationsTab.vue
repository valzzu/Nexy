<template>
    <div class="flex flex-col gap-10 py-2">
        <!-- Translation API -->
        <SettingsGroup :title="t('view.settings.advanced.advanced.translation_api.header')">
            <SettingsItem
                :label="t('view.settings.advanced.advanced.translation_api.enable')"
                :description="t('view.settings.advanced.advanced.translation_api.enable_tooltip')"
                toggle>
                <Switch
                    :model-value="translationApi"
                    :ariaLabel="t('view.settings.advanced.advanced.translation_api.enable')"
                    @update:modelValue="changeTranslationAPI('VRCX_translationAPI')" />
            </SettingsItem>

            <SettingsItem :label="t('view.settings.advanced.advanced.translation_api.translation_api_key')">
                <Button size="sm" variant="outline" @click="showTranslationApiDialog">
                    <Languages class="h-4 w-4 mr-1.5" />
                    {{ t('view.settings.advanced.advanced.translation_api.translation_api_key') }}
                </Button>
            </SettingsItem>
        </SettingsGroup>

        <TranslationApiDialog v-model:isTranslationApiDialogVisible="isTranslationApiDialogVisible" />
    </div>
</template>

<script setup>
    import { ref } from 'vue';
    import { Languages } from 'lucide-vue-next';
    import { Button } from '@/components/ui/button';
    import { Switch } from '@/components/ui/switch';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useAdvancedSettingsStore } from '@/stores';

    import TranslationApiDialog from '../../dialogs/TranslationApiDialog.vue';
    import SettingsGroup from '../SettingsGroup.vue';
    import SettingsItem from '../SettingsItem.vue';

    const { t } = useI18n();

    const advancedSettingsStore = useAdvancedSettingsStore();
    const { translationApi } = storeToRefs(advancedSettingsStore);

    const isTranslationApiDialogVisible = ref(false);

    function showTranslationApiDialog() {
        isTranslationApiDialogVisible.value = true;
    }

    /**
     * @param configKey
     */
    async function changeTranslationAPI(configKey = '') {
        if (configKey === 'VRCX_translationAPI') {
            advancedSettingsStore.setTranslationApi();
        }
    }
</script>
