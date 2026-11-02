<template>
    <div class="flex-1 min-h-0 min-w-0 flex flex-row">
        <DialogHeader class="sr-only">
            <DialogTitle>{{ worldDialog.ref?.name }}</DialogTitle>
            <DialogDescription>
                {{ worldDialog.ref?.description }}
            </DialogDescription>
        </DialogHeader>
        <!-- Summary and info rail -->
        <div class="flex-none w-77 pr-4 overflow-y-auto">
            <div class="rounded-xl bg-(--profile-card) overflow-hidden flex flex-col">
                <div class="relative aspect-4/3">
                    <img
                        v-if="!worldDialog.loading && !imageError"
                        :src="worldDialog.ref.thumbnailImageUrl"
                        class="absolute inset-0 size-full cursor-pointer object-cover"
                        @click="showFullscreenImageDialog(worldDialog.ref.imageUrl)"
                        @error="imageError = true"
                        loading="lazy" />
                    <div
                        v-else-if="!worldDialog.loading"
                        class="absolute inset-0 flex items-center justify-center bg-muted">
                        <Image class="size-8 text-muted-foreground" />
                    </div>
                </div>
                <div class="flex flex-col p-3">
                    <div class="flex min-w-0 flex-col">
                        <div class="flex justify-between gap-2">
                            <div class="min-w-0 flex-1">
                                <div class="overflow-hidden">
                                    <span
                                        class="flex flex-wrap font-bold cursor-pointer"
                                        @click="copyWorldName"
                                        :title="worldDialog.ref.name">
                                        {{ worldDialog.ref.name }}
                                    </span>
                                </div>
                                <div class="flex flex-col gap-1">
                                    <div>
                                        <span
                                            class="flex flex-wrap cursor-pointer x-grey font-mono text-xs max-w-30"
                                            @click="showUserDialog(worldDialog.ref.authorId)"
                                            v-text="worldDialog.ref.authorName" />
                                    </div>
                                </div>
                            </div>
                            <div class="grid grid-cols-2 flex-none items-center justify-end gap-2 self-start">
                                <DropdownMenu>
                                    <DropdownMenuTrigger as-child>
                                        <Button variant="outline" size="icon" class="rounded-lg">
                                            <Ellipsis />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem @click="worldDialogCommand('Refresh')">
                                            <RefreshCw class="size-4" />
                                            {{ t('dialog.world.actions.refresh') }}
                                        </DropdownMenuItem>
                                        <DropdownMenuSub>
                                            <DropdownMenuSubTrigger>
                                                <Share2 class="size-4 mr-2" />
                                                <span>{{ t('dialog.world.actions.share') }}</span>
                                            </DropdownMenuSubTrigger>
                                            <DropdownMenuSubContent side="right" align="start" class="w-56">
                                                <DropdownMenuItem @click="worldDialogCommand('Share')">
                                                    <Copy class="size-4" />
                                                    {{ t('dialog.world.info.copy_url') }}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem @click="worldDialogCommand('Copy World Name')">
                                                    <Copy class="size-4" />
                                                    {{ t('dialog.world.info.copy_name') }}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem @click="worldDialogCommand('Copy World ID')">
                                                    <Copy class="size-4" />
                                                    {{ t('dialog.world.info.copy_id') }}
                                                </DropdownMenuItem>
                                            </DropdownMenuSubContent>
                                        </DropdownMenuSub>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem @click="worldDialogCommand('Previous Instances')">
                                            <LineChart class="size-4" />
                                            {{ t('dialog.world.actions.show_previous_instances') }}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                        <div class="flex flex-wrap items-center gap-1 mt-2">
                            <Badge v-if="worldDialog.ref.$isLabs" variant="outline">
                                {{ t('dialog.world.tags.labs') }}
                            </Badge>
                            <Badge v-else-if="worldDialog.ref.releaseStatus === 'public'" variant="outline">
                                {{ t('dialog.world.tags.public') }}
                            </Badge>
                            <Badge v-else variant="outline">
                                {{ t('dialog.world.tags.private') }}
                            </Badge>
                            <TooltipWrapper v-if="worldDialog.isPC" side="top" content="PC">
                                <Badge class="text-platform-pc border-platform-pc!" variant="outline">
                                    <Monitor class="h-4 w-4 text-platform-pc" />
                                </Badge>
                            </TooltipWrapper>

                            <TooltipWrapper v-if="worldDialog.isQuest" side="top" content="Quest">
                                <Badge class="text-platform-quest border-platform-quest!" variant="outline">
                                    <Smartphone class="h-4 w-4 text-platform-quest" />
                                </Badge>
                            </TooltipWrapper>

                            <TooltipWrapper v-if="worldDialog.isIos" side="top" content="iOS">
                                <Badge class="text-platform-ios border-platform-ios" variant="outline">
                                    <Apple class="h-4 w-4 text-platform-ios" />
                                </Badge>
                            </TooltipWrapper>

                            <Badge v-if="worldDialog.avatarScalingDisabled" variant="outline">
                                {{ t('dialog.world.tags.avatar_scaling_disabled') }}
                            </Badge>
                            <Badge v-if="worldDialog.focusViewDisabled" variant="outline">
                                {{ t('dialog.world.tags.focus_view_disabled') }}
                            </Badge>
                            <Badge v-if="worldDialog.ref.unityPackageUrl" variant="outline">
                                {{ t('dialog.world.tags.future_proofing') }}
                            </Badge>
                        </div>
                        <div class="flex flex-wrap gap-1 mt-1">
                            <template v-for="tag in worldDialog.ref.tags" :key="tag">
                                <Badge v-if="tag.startsWith('content_')" variant="outline">
                                    <span v-if="tag === 'content_horror'">
                                        {{ t('dialog.world.tags.content_horror') }}
                                    </span>
                                    <span v-else-if="tag === 'content_gore'">
                                        {{ t('dialog.world.tags.content_gore') }}
                                    </span>
                                    <span v-else-if="tag === 'content_violence'">
                                        {{ t('dialog.world.tags.content_violence') }}
                                    </span>
                                    <span v-else-if="tag === 'content_adult'">
                                        {{ t('dialog.world.tags.content_adult') }}
                                    </span>
                                    <span v-else-if="tag === 'content_sex'">
                                        {{ t('dialog.world.tags.content_sex') }}
                                    </span>
                                    <span v-else>
                                        {{ tag.replace('content_', '') }}
                                    </span>
                                </Badge>
                            </template>
                        </div>
                    </div>
                </div>
            </div>
            <WorldDialogInfo />
        </div>

        <!-- Right side tabs -->
        <div class="flex-1 min-w-0 flex flex-col min-h-0 pl-4">
            <TabsUnderline
                v-model="worldDialog.activeTab"
                :background="true"
                :items="worldDialogTabs"
                :unmount-on-hide="false"
                fill
                @update:modelValue="worldDialogTabClick">
                <template #Instances>
                    <WorldDialogInstancesTab />
                </template>
                <template #JSON>
                    <DialogJsonTab
                        class="rounded-xl bg-(--profile-card) p-2"
                        :tree-data="treeData"
                        :tree-data-key="treeData?.id"
                        :dialog-id="worldDialog.id"
                        :dialog-ref="worldDialog.ref"
                        @refresh="refreshWorldDialogTreeData()" />
                </template>
            </TabsUnderline>
        </div>
    </div>
</template>

<script setup>
    import { Apple, Copy, Ellipsis, Image, LineChart, Monitor, RefreshCw, Share2, Smartphone } from 'lucide-vue-next';
    import { computed, ref, watch } from 'vue';
    import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { Button } from '@/components/ui/button';
    import { TabsUnderline } from '@/components/ui/tabs';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import { useGalleryStore, useInstanceStore, useWorldStore } from '../../../stores';
    import { showWorldDialog } from '../../../coordinators/worldCoordinator';
    import {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuSeparator,
        DropdownMenuSub,
        DropdownMenuSubContent,
        DropdownMenuSubTrigger,
        DropdownMenuTrigger
    } from '../../ui/dropdown-menu';
    import { Badge } from '../../ui/badge';
    import { formatJsonVars } from '../../../shared/utils/base/ui';
    import { useWorldDialogCommands } from './useWorldDialogCommands';

    import DialogJsonTab from '../DialogJsonTab.vue';
    import WorldDialogInfo from './WorldDialogInfo.vue';
    import WorldDialogInstancesTab from './WorldDialogInstancesTab.vue';
    import { showUserDialog } from '../../../coordinators/userCoordinator';

    const { worldDialog } = storeToRefs(useWorldStore());
    const { showPreviousInstancesListDialog: openPreviousInstancesListDialog } = useInstanceStore();
    const { showFullscreenImageDialog } = useGalleryStore();

    const { t } = useI18n();

    const { worldDialogCommand, copyWorldName } = useWorldDialogCommands(worldDialog, {
        t,
        toast,
        showWorldDialog,
        showPreviousInstancesListDialog: openPreviousInstancesListDialog
    });

    const worldDialogTabs = computed(() => [
        { value: 'Instances', label: t('dialog.world.instances.header') },
        { value: 'JSON', label: t('dialog.world.json.header') }
    ]);

    /** @type {import('vue').Ref<any>} */
    const treeData = ref({});
    const imageError = ref(false);

    watch(
        () => worldDialog.value.id,
        () => {
            imageError.value = false;
        }
    );

    watch(
        () => worldDialog.value.loading,
        () => {
            if (worldDialog.value.visible) {
                handleDialogOpen();
                !worldDialog.value.loading && loadLastActiveTab();
            }
        }
    );

    /**
     * @param tabName
     */
    function handleWorldDialogTab(tabName) {
        worldDialog.value.lastActiveTab = tabName;
        if (tabName === 'JSON') {
            refreshWorldDialogTreeData();
        }
    }

    function loadLastActiveTab() {
        if (worldDialog.value.lastActiveTab === 'Store') {
            worldDialog.value.activeTab = 'Instances';
            worldDialog.value.lastActiveTab = 'Instances';
        }
        handleWorldDialogTab(worldDialog.value.lastActiveTab);
    }

    /**
     * @param tabName
     */
    function worldDialogTabClick(tabName) {
        if (tabName === worldDialog.value.lastActiveTab) {
            if (tabName === 'JSON') {
                refreshWorldDialogTreeData();
            }
            return;
        }
        handleWorldDialogTab(tabName);
    }

    function handleDialogOpen() {
        treeData.value = {};
    }

    function refreshWorldDialogTreeData() {
        treeData.value = formatJsonVars(worldDialog.value.ref);
    }
</script>
