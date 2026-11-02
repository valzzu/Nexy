<template>
    <div class="x-container flex flex-col overflow-hidden">
        <Tabs
            v-model="activeSearchTab"
            :unmount-on-hide="false"
            aria-label="Search tabs"
            class="flex flex-col min-h-0 flex-1">
            <div class="mt-0 mx-0 mb-2 flex items-center gap-5">
                <TabsList>
                    <TabsTrigger value="user">{{ t('view.search.user.header') }}</TabsTrigger>
                    <TabsTrigger value="world">{{ t('view.search.world.header') }}</TabsTrigger>
                    <TabsTrigger value="group">{{ t('view.search.group.header') }}</TabsTrigger>
                </TabsList>
                <div class="flex min-w-0 flex-1 items-center">
                    <InputGroupField
                        :model-value="searchText"
                        :placeholder="searchPlaceholder"
                        style="flex: 1"
                        clearable
                        @input="updateSearchText"
                        @keyup.enter="search" />
                    <TooltipWrapper side="bottom" :content="t('view.search.clear_results_tooltip')">
                        <Button
                            class="rounded-full ml-2"
                            size="icon"
                            variant="ghost"
                            :ariaLabel="t('view.search.clear_results_tooltip')"
                            @click="handleClearSearch">
                            <Trash2 />
                        </Button>
                    </TooltipWrapper>
                </div>
            </div>
            <TabsContent value="user" class="flex flex-col min-h-0 flex-1">
                <div class="flex flex-col min-h-0" style="flex: 9">
                    <div class="shrink-0 mb-3 flex justify-end">
                        <label class="inline-flex items-center gap-2 ml-2">
                            <Checkbox v-model="searchUserSortByLastLoggedIn" />
                            <span>{{ t('view.search.user.sort_by_last_logged_in') }}</span>
                        </label>
                    </div>
                    <div class="flex-1 overflow-y-auto min-h-0">
                        <div v-if="isSearchUserLoading" class="flex items-center justify-center h-full">
                            <Spinner class="text-2xl" />
                        </div>
                        <template v-else-if="searchUserResults.length > 0">
                            <Item
                                v-for="user in searchUserResults"
                                :key="user.id"
                                size="sm"
                                class="cursor-pointer gap-2 px-3 py-2 hover:bg-muted x-hover-list rounded-none"
                                @click="showUserDialog(user.id)">
                                <ItemMedia class="relative size-10">
                                    <Avatar class="size-full">
                                        <AvatarImage :src="userImage(user, true)" loading="lazy" />
                                        <AvatarFallback>
                                            <User class="size-5 text-muted-foreground" />
                                        </AvatarFallback>
                                    </Avatar>
                                </ItemMedia>
                                <ItemContent class="min-w-0">
                                    <ItemTitle class="flex items-center gap-1.5 max-w-full">
                                        <span class="truncate">{{ user.displayName }}</span>
                                        <span
                                            v-if="randomUserColours"
                                            class="shrink-0 text-xs font-normal"
                                            :class="user.$trustClass">
                                            {{ user.$trustLevel }}
                                        </span>
                                        <span
                                            v-else
                                            class="shrink-0 text-xs font-normal"
                                            :style="{ color: user.$userColour }">
                                            {{ user.$trustLevel }}
                                        </span>
                                        <span
                                            v-for="item in user.$languages"
                                            :key="item.key"
                                            class="flags shrink-0"
                                            :class="languageClass(item.key)"
                                            :title="item.value" />
                                    </ItemTitle>
                                    <ItemDescription v-if="user.bio" class="line-clamp-1 text-xs!">
                                        {{ replaceBioSymbols(user.bio) }}
                                    </ItemDescription>
                                </ItemContent>
                            </Item>
                        </template>
                        <DataTableEmpty v-else type="nodata" />
                    </div>
                </div>
                <SearchPagination
                    :show="paginationConfig.show"
                    :prev-disabled="paginationConfig.prevDisabled"
                    :next-disabled="paginationConfig.nextDisabled"
                    @prev="paginationConfig.onPrev"
                    @next="paginationConfig.onNext" />
            </TabsContent>
            <TabsContent value="world" class="flex flex-col min-h-0 flex-1">
                <div class="flex flex-col min-h-0" style="flex: 9">
                    <div class="inline-flex justify-end mb-4 w-full shrink-0 gap-2">
                        <label class="inline-flex items-center gap-2">
                            <Checkbox v-model="searchWorldLabs" />
                            <span>{{ t('view.search.world.community_lab') }}</span>
                        </label>
                        <Select
                            :model-value="searchWorldCategoryIndex"
                            @update:modelValue="handleSearchWorldCategorySelect"
                            style="margin-bottom: 16px">
                            <SelectTrigger size="sm">
                                <SelectValue :placeholder="t('view.search.world.category')" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem
                                        v-for="row in cachedConfig.dynamicWorldRows"
                                        :key="row.index"
                                        :value="row.index">
                                        {{ row.name }}
                                    </SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                    <div class="flex-1 overflow-y-auto min-h-0">
                        <div v-if="isSearchWorldLoading" class="flex items-center justify-center h-full">
                            <Spinner class="text-2xl" />
                        </div>
                        <template v-else-if="searchWorldResults.length > 0">
                            <ItemGroup
                                class="grid gap-3"
                                style="grid-template-columns: repeat(auto-fill, minmax(180px, 1fr))">
                                <Item
                                    v-for="world in searchWorldResults"
                                    :key="world.id"
                                    variant="outline"
                                    size="sm"
                                    class="cursor-pointer p-3"
                                    as-child>
                                    <div class="overflow-hidden" @click="showWorldDialog(world.id)">
                                        <ItemHeader>
                                            <img
                                                :src="world.thumbnailImageUrl"
                                                :alt="world.name"
                                                loading="lazy"
                                                class="aspect-[16/10] w-full rounded-lg object-cover" />
                                        </ItemHeader>
                                        <ItemContent class="min-w-0">
                                            <TooltipWrapper side="top" :content="world.name">
                                                <ItemTitle class="truncate w-auto">{{ world.name }}</ItemTitle>
                                            </TooltipWrapper>
                                            <ItemDescription v-if="world.occupants" class="line-clamp-1 text-xs">
                                                {{ world.authorName }} ({{ world.occupants }})
                                            </ItemDescription>
                                            <ItemDescription v-else class="line-clamp-1 text-xs">
                                                {{ world.authorName }}
                                            </ItemDescription>
                                        </ItemContent>
                                    </div>
                                </Item>
                            </ItemGroup>
                        </template>
                        <DataTableEmpty v-else type="nodata" />
                    </div>
                </div>
                <SearchPagination
                    :show="paginationConfig.show"
                    :prev-disabled="paginationConfig.prevDisabled"
                    :next-disabled="paginationConfig.nextDisabled"
                    @prev="paginationConfig.onPrev"
                    @next="paginationConfig.onNext" />
            </TabsContent>
            <TabsContent value="group" class="flex flex-col min-h-0 flex-1">
                <div class="flex-1 overflow-y-auto min-h-0" style="flex: 9">
                    <div v-if="isSearchGroupLoading" class="flex items-center justify-center h-full">
                        <Spinner class="text-2xl" />
                    </div>
                    <template v-else-if="searchGroupResults.length > 0">
                        <Item
                            v-for="group in searchGroupResults"
                            :key="group.id"
                            size="sm"
                            class="cursor-pointer gap-2 px-3 py-2 hover:bg-muted x-hover-list rounded-none"
                            @click="showGroupDialog(group.id)">
                            <ItemMedia variant="image">
                                <Avatar class="rounded-sm">
                                    <AvatarImage :src="getSmallThumbnailUrl(group.iconUrl)" loading="lazy" />
                                    <AvatarFallback>
                                        <Users class="size-5 text-muted-foreground" />
                                    </AvatarFallback>
                                </Avatar>
                            </ItemMedia>
                            <ItemContent class="min-w-0">
                                <ItemTitle class="truncate max-w-full">
                                    {{ group.name }}
                                    <span class="font-normal">({{ group.memberCount }})</span>
                                    <span
                                        v-if="group.shortCode"
                                        class="text-muted-foreground font-mono text-xs font-normal">
                                        {{ group.shortCode }}.{{ group.discriminator }}
                                    </span>
                                </ItemTitle>
                                <ItemDescription class="truncate text-xs!">
                                    {{ group.description }}
                                </ItemDescription>
                            </ItemContent>
                        </Item>
                    </template>
                    <DataTableEmpty v-else type="nodata" />
                </div>
                <SearchPagination
                    :show="paginationConfig.show"
                    :prev-disabled="paginationConfig.prevDisabled"
                    :next-disabled="paginationConfig.nextDisabled"
                    @prev="paginationConfig.onPrev"
                    @next="paginationConfig.onNext" />
            </TabsContent>
        </Tabs>
    </div>
</template>

<script setup>
    import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { Trash2, User, Users } from 'lucide-vue-next';
    import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
    import { DataTableEmpty } from '@/components/ui/data-table';
    import { Spinner } from '@/components/ui/spinner';
    import SearchPagination from './components/SearchPagination.vue';
    import {
        Item,
        ItemContent,
        ItemDescription,
        ItemGroup,
        ItemHeader,
        ItemMedia,
        ItemTitle
    } from '@/components/ui/item';

    import { computed, onUnmounted, ref } from 'vue';
    import { useMagicKeys, whenever } from '@vueuse/core';
    import { Button } from '@/components/ui/button';
    import { Checkbox } from '@/components/ui/checkbox';
    import { InputGroupField } from '@/components/ui/input-group';

    import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useAppearanceSettingsStore, useAuthStore, useSearchStore } from '../../stores';
    import { convertFileUrlToImageUrl, languageClass, replaceBioSymbols } from '../../shared/utils';
    import { useUserDisplay } from '../../composables/useUserDisplay';
    import { showGroupDialog } from '../../coordinators/groupCoordinator';
    import { showUserDialog } from '../../coordinators/userCoordinator';
    import { showWorldDialog } from '../../coordinators/worldCoordinator';
    import { useSearchWorld } from './composables/useSearchWorld';
    import { useSearchUser } from './composables/useSearchUser';
    import { useSearchGroup } from './composables/useSearchGroup';

    const { randomUserColours } = storeToRefs(useAppearanceSettingsStore());

    const { searchText, searchUserResults } = storeToRefs(useSearchStore());
    const { clearSearch } = useSearchStore();
    const { cachedConfig } = storeToRefs(useAuthStore());

    const { t } = useI18n();
    const { userImage } = useUserDisplay();

    const activeSearchTab = ref('user');

    // Keyboard shortcuts: Alt+Left (prev page) / Alt+Right (next page)
    const keys = useMagicKeys();
    const stopPrevWatch = whenever(keys['Alt+ArrowLeft'], () => {
        if (!paginationConfig.value.prevDisabled) {
            paginationConfig.value.onPrev();
        }
    });
    const stopNextWatch = whenever(keys['Alt+ArrowRight'], () => {
        if (!paginationConfig.value.nextDisabled) {
            paginationConfig.value.onNext();
        }
    });
    onUnmounted(() => {
        stopPrevWatch();
        stopNextWatch();
    });

    const searchPlaceholder = computed(() => {
        return t('view.search.search_placeholder');
    });

    const {
        searchUserParams,
        searchUserSortByLastLoggedIn,
        isSearchUserLoading,
        searchUser,
        handleMoreSearchUser,
        clearUserSearch
    } = useSearchUser();

    const {
        searchWorldLabs,
        searchWorldParams,
        searchWorldCategoryIndex,
        searchWorldResults,
        isSearchWorldLoading,
        searchWorld,
        moreSearchWorld,
        handleSearchWorldCategorySelect,
        clearWorldSearch
    } = useSearchWorld();

    const {
        searchGroupParams,
        searchGroupResults,
        isSearchGroupLoading,
        searchGroup,
        moreSearchGroup,
        clearGroupSearch
    } = useSearchGroup();

    const pageSize = 60;
    const paginationConfig = computed(() => {
        switch (activeSearchTab.value) {
            case 'user':
                return {
                    show: searchUserResults.value.length > 0 && !isSearchUserLoading.value,
                    prevDisabled: !searchUserParams.value.offset,
                    nextDisabled: searchUserResults.value.length < pageSize,
                    onPrev: () => handleMoreSearchUser(-1),
                    onNext: () => handleMoreSearchUser(1)
                };
            case 'world':
                return {
                    show: searchWorldResults.value.length > 0 && !isSearchWorldLoading.value,
                    prevDisabled: !searchWorldParams.value.offset,
                    nextDisabled: searchWorldResults.value.length < pageSize,
                    onPrev: () => moreSearchWorld(-1),
                    onNext: () => moreSearchWorld(1)
                };
            case 'group':
                return {
                    show: searchGroupResults.value.length > 0 && !isSearchGroupLoading.value,
                    prevDisabled: !searchGroupParams.value.offset,
                    nextDisabled: searchGroupResults.value.length < pageSize,
                    onPrev: () => moreSearchGroup(-1),
                    onNext: () => moreSearchGroup(1)
                };
            default:
                return { show: false, prevDisabled: true, nextDisabled: true, onPrev: () => {}, onNext: () => {} };
        }
    });

    function getSmallThumbnailUrl(url) {
        return convertFileUrlToImageUrl(url);
    }

    function handleClearSearch() {
        clearUserSearch();
        clearWorldSearch();
        clearGroupSearch();
        clearSearch();
    }

    /**
     * @param text
     */
    function updateSearchText(text) {
        searchText.value = text;
    }

    function search() {
        switch (activeSearchTab.value) {
            case 'user':
                searchUser();
                break;
            case 'world':
                searchWorld({});
                break;
            case 'group':
                searchGroup();
                break;
        }
    }
</script>
