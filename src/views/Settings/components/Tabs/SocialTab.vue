<template>
    <div class="flex flex-col gap-10 py-2">
        <SettingsGroup :title="t('view.settings.social.interaction.header')">
            <SettingsItem
                :label="t('view.settings.appearance.user_dialog.recent_action_cooldown')"
                :description="t('view.settings.appearance.user_dialog.recent_action_cooldown_description')"
                toggle>
                <Switch
                    :model-value="recentActionCooldownEnabled"
                    :ariaLabel="t('view.settings.appearance.user_dialog.recent_action_cooldown')"
                    @update:modelValue="setRecentActionCooldownEnabled" />
            </SettingsItem>

            <SettingsItem
                v-if="recentActionCooldownEnabled"
                :label="t('view.settings.appearance.user_dialog.recent_action_cooldown_minutes')">
                <NumberField
                    :model-value="recentActionCooldownMinutes"
                    :min="1"
                    :max="1440"
                    :step="1"
                    :format-options="{ maximumFractionDigits: 0 }"
                    class="w-32"
                    @update:modelValue="setRecentActionCooldownMinutes">
                    <NumberFieldContent>
                        <NumberFieldDecrement />
                        <NumberFieldInput />
                        <NumberFieldIncrement />
                    </NumberFieldContent>
                </NumberField>
            </SettingsItem>
        </SettingsGroup>

        <SettingsGroup :title="t('view.settings.social.friend_requests.header')">
            <SettingsItem
                :label="t('view.settings.general.friend_requests.header')"
                :description="t('view.settings.general.friend_requests.header_tooltip')"
                toggle>
                <Switch
                    :model-value="autoDeclineFriendRequests"
                    :ariaLabel="t('view.settings.general.friend_requests.header')"
                    @update:modelValue="setAutoDeclineFriendRequests" />
            </SettingsItem>
        </SettingsGroup>
    </div>
</template>

<script setup>
    import { Switch } from '@/components/ui/switch';

    import {
        NumberField,
        NumberFieldContent,
        NumberFieldDecrement,
        NumberFieldIncrement,
        NumberFieldInput
    } from '@/components/ui/number-field';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useGeneralSettingsStore } from '@/stores';

    import SettingsGroup from '../SettingsGroup.vue';
    import SettingsItem from '../SettingsItem.vue';

    const { t } = useI18n();

    const generalSettingsStore = useGeneralSettingsStore();

    const { recentActionCooldownEnabled, recentActionCooldownMinutes, autoDeclineFriendRequests } =
        storeToRefs(generalSettingsStore);

    const { setRecentActionCooldownEnabled, setRecentActionCooldownMinutes, setAutoDeclineFriendRequests } =
        generalSettingsStore;
</script>
