<template>
    <component :is="itemComponent" v-if="showViewDetails" @click="$emit('view-details')">
        <ExternalLink class="size-4" />
        {{ t('common.actions.view_details') }}
    </component>
    <component :is="itemComponent" v-if="showShare" @click="$emit('share')">
        <Share2 class="size-4" />
        {{ t('dialog.world.actions.share') }}
    </component>
    <component :is="separatorComponent" v-if="showSecondarySeparator" />
    <component :is="itemComponent" v-if="showPreviousInstances" @click="$emit('show-previous-instances')">
        <LineChart class="size-4" />
        {{ t('dialog.world.actions.show_previous_instances') }}
    </component>
    <slot name="append" />
</template>

<script setup>
    import { computed } from 'vue';
    import { useI18n } from 'vue-i18n';
    import { ExternalLink, LineChart, Share2 } from 'lucide-vue-next';

    import { ContextMenuItem, ContextMenuSeparator } from './ui/context-menu';
    import { DropdownMenuItem, DropdownMenuSeparator } from './ui/dropdown-menu';

    const { t } = useI18n();

    const props = defineProps({
        variant: {
            type: String,
            default: 'context'
        },
        showViewDetails: {
            type: Boolean,
            default: true
        },
        showShare: {
            type: Boolean,
            default: false
        },
        showPreviousInstances: {
            type: Boolean,
            default: false
        }
    });

    defineEmits(['view-details', 'share', 'show-previous-instances']);

    const itemComponent = computed(() => (props.variant === 'dropdown' ? DropdownMenuItem : ContextMenuItem));

    const separatorComponent = computed(() =>
        props.variant === 'dropdown' ? DropdownMenuSeparator : ContextMenuSeparator
    );

    const showSecondarySeparator = computed(
        () => props.showPreviousInstances && (props.showViewDetails || props.showShare)
    );
</script>
