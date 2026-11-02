<template>
    <div class="rounded-b-lg rounded-t-[15px] bg-(--profile-card) overflow-hidden flex flex-col relative">
        <div class="relative aspect-17/6">
            <div
                v-if="
                    userDialog.loading ||
                    profileImageError ||
                    userDialog.ref.bannerType === 'color' ||
                    !userDialog.ref.bannerUrl
                "
                class="absolute inset-0"
                :style="{
                    backgroundColor: userDialog.ref.bannerColor ? `#${userDialog.ref.bannerColor}` : 'hsl(var(--muted))'
                }"></div>
            <img
                v-else
                class="absolute inset-0 block h-full w-full cursor-pointer object-cover"
                :src="userDialog.ref.bannerUrl"
                @click="showFullscreenImageDialog(userDialog.ref.bannerUrl)"
                @error="profileImageError = true"
                loading="lazy" />
            <!-- NexVR's social rank card, top-right of the banner as on nexvr.net -->
            <div
                v-if="nexvrRank && !userDialog.loading"
                class="absolute top-2.5 right-2.5 z-30 flex w-14 flex-col overflow-hidden rounded-md border-2 bg-[#0a1024]/80 shadow-lg backdrop-blur-sm"
                :class="userDialog.ref.$trustClass">
                <div
                    class="nexvr-rank-badge flex h-11 items-center justify-center text-2xl font-bold"
                    :class="userDialog.ref.$trustClass">
                    {{ nexvrRank }}
                </div>
                <div
                    class="px-1 py-1 text-center text-[8px] font-bold uppercase leading-tight tracking-wider text-white/75">
                    {{ t('dialog.user.tags.trust_level') }}
                </div>
            </div>
            <div class="absolute bottom-0 pt-10 right-2.5 z-30 translate-y-1/2 flex gap-1.5">
                <TooltipWrapper
                    v-if="userDialog.isBlock"
                    :content="t('dialog.user.actions.moderation_block')"
                    side="top">
                    <XCircle class="h-6 w-6 text-red-400" />
                </TooltipWrapper>
                <TooltipWrapper v-if="userDialog.isMute" :content="t('dialog.user.actions.moderation_mute')" side="top">
                    <VolumeX class="h-6 w-6 text-red-400" />
                </TooltipWrapper>
                <TooltipWrapper
                    v-if="userDialog.isHideAvatar"
                    :content="t('dialog.user.actions.moderation_hide_avatar')"
                    side="top">
                    <User class="h-6 w-6 text-red-400" />
                </TooltipWrapper>
            </div>
            <div class="absolute bottom-0 left-3 z-20 size-24 translate-y-1/2">
                <div
                    class="w-full h-full overflow-hidden rounded-full"
                    style="
                        filter: drop-shadow(0 0 1px rgb(0 0 0 / 0.95)) drop-shadow(0 0 4px rgb(0 0 0 / 0.75))
                            drop-shadow(0 2px 8px rgb(0 0 0 / 0.55));
                    ">
                    <Image
                        v-if="userDialog.loading || userIconError"
                        class="w-full! h-full! object-cover text-muted-foreground bg-accent" />
                    <img
                        v-else-if="userDialog.publicProfileRef?.iconUrl"
                        class="w-full h-full object-cover cursor-pointer"
                        :src="userDialog.publicProfileRef.iconUrl"
                        @click.stop="showFullscreenImageDialog(userDialog.publicProfileRef.iconUrl)"
                        @error="userIconError = true"
                        loading="lazy" />
                    <!-- no picture set: their initial, as everywhere else -->
                    <img v-else class="w-full h-full object-cover" :src="defaultUserImage(userDialog.ref)" alt="" />
                </div>
            </div>
        </div>

        <div
            class="relative isolate flex flex-col gap-2 px-3 pb-3 pt-15 z-40 pointer-events-none *:pointer-events-auto">
            <div class="flex gap-1.5 items-center">
                <div class="flex-1 min-w-0">
                    <div class="flex flex-wrap items-center gap-x-1 leading-snug">
                        <template v-if="userDialog.previousDisplayNames.length > 0">
                            <TooltipWrapper side="bottom">
                                <template #content>
                                    <span>{{ t('dialog.user.previous_display_names') }}</span>
                                    <div
                                        v-for="data in userDialog.previousDisplayNames"
                                        :key="data.displayName"
                                        placement="top">
                                        <span>{{ data.displayName }}</span>
                                        <span v-if="data.updated_at">
                                            &horbar; {{ formatDateFilter(data.updated_at, 'long') }}</span
                                        >
                                    </div>
                                </template>
                                <ChevronDown class="inline-block" />
                            </TooltipWrapper>
                        </template>
                        <span
                            class="font-bold cursor-pointer flex flex-wrap"
                            v-text="userDialog.ref.displayName"
                            :title="userDialog.ref.displayName"
                            @click="copyUserDisplayName(userDialog.ref.displayName)"></span>
                        <span v-if="userDialog.ref.pronouns" class="basis-full h-0"></span>
                        <TooltipWrapper v-if="userDialog.ref.pronouns" side="top" :content="t('dialog.user.pronouns')">
                            <span
                                class="x-grey font-mono text-xs"
                                v-text="replaceBioSymbols(userDialog.ref.pronouns)"></span>
                        </TooltipWrapper>
                    </div>
                    <template v-if="userDialog.ref.id === currentUser.id">
                        <span
                            class="x-grey font-mono text-xs cursor-pointer"
                            v-text="currentUser.username"
                            @click="copyToClipboard(currentUser.username)"></span>
                    </template>
                </div>
                <UserActionDropdown class="flex-none mt-0.5" :user-dialog-command="userDialogCommand" />
            </div>

            <div
                v-if="userDialog.ref.status || userDialog.ref.statusDescription"
                class="flex items-center gap-1.5 text-xs text-muted-foreground"
                :class="{ 'cursor-pointer hover:text-foreground': userDialog.ref.id === currentUser.id }"
                @click="userDialog.ref.id === currentUser.id ? showEditProfileDialog() : undefined">
                <TooltipWrapper v-if="userDialog.ref.status" side="top">
                    <template #content>
                        <span>{{ getUserStateText(userDialog.ref) }}</span>
                    </template>
                    <i class="x-user-status mt-0.5 flex-none" :class="userStatusClass(userDialog.ref)"></i>
                </TooltipWrapper>
                <div class="min-w-0">
                    <span v-if="!userDialog.ref.statusDescription" class="block wrap-anywhere">{{
                        getUserStateText(userDialog.ref)
                    }}</span>
                    <span v-if="userDialog.ref.statusDescription" class="block wrap-anywhere">{{
                        userDialog.ref.statusDescription
                    }}</span>
                </div>
            </div>

            <div class="flex flex-wrap gap-1 text-[11px]" v-show="!userDialog.loading">
                <!-- a NexVR rank shows as the card on the banner instead -->
                <TooltipWrapper v-if="!nexvrRank" side="top" :content="t('dialog.user.tags.trust_level')">
                    <Badge
                        variant="outline"
                        class="name h-5 px-1.5 text-[11px] leading-none"
                        :class="userDialog.ref.$trustClass">
                        <Shield class="h-2.5 w-2.5" />
                        {{ userDialog.ref.$trustLevel }}
                    </Badge>
                </TooltipWrapper>
                <TooltipWrapper
                    v-if="userDialog.id === currentUser.id && currentUser.accountStanding"
                    side="top"
                    :content="t('dialog.user.tags.account_standing')">
                    <Badge
                        variant="outline"
                        class="h-5 px-1.5 text-[11px] leading-none capitalize"
                        :class="
                            currentUser.accountStanding === 'good'
                                ? 'text-green-500 border-green-500!'
                                : 'text-red-500 border-red-500!'
                        ">
                        <ShieldCheck v-if="currentUser.accountStanding === 'good'" class="h-2.5 w-2.5" />
                        <ShieldAlert v-else class="h-2.5 w-2.5" />
                        {{ currentUser.accountStanding }}
                    </Badge>
                </TooltipWrapper>
                <TooltipWrapper
                    v-for="badge in nexvrBadges"
                    :key="badge.kind + badge.label"
                    side="top"
                    :content="badge.title">
                    <Badge
                        variant="outline"
                        class="h-5 px-1.5 text-[11px] leading-none"
                        :class="[
                            nexvrBadgeToneClass[badge.tone] ?? nexvrBadgeToneClass.primary,
                            { 'font-mono': badge.mono }
                        ]">
                        <component
                            :is="nexvrBadgeIcons[badge.icon]"
                            v-if="nexvrBadgeIcons[badge.icon]"
                            class="h-2.5 w-2.5" />
                        {{ badge.label }}
                    </Badge>
                </TooltipWrapper>
                <TooltipWrapper
                    v-if="userDialog.isFriend && userDialog.friend"
                    side="top"
                    :content="t('dialog.user.tags.friend_number')">
                    <Badge
                        variant="outline"
                        class="h-5 px-1.5 text-[11px] leading-none text-amber-400 border-amber-400!">
                        <UserPlus class="h-2.5 w-2.5" />
                        {{ userDialog.ref.$friendNumber ? userDialog.ref.$friendNumber : '' }}
                    </Badge>
                </TooltipWrapper>
                <TooltipWrapper
                    v-if="userDialog.mutualFriendCount"
                    side="top"
                    :content="t('dialog.user.tags.mutual_friends')">
                    <Badge
                        variant="outline"
                        class="h-5 px-1.5 text-[11px] leading-none border-zinc-500/50! dark:border-zinc-400!">
                        <Users class="h-2.5 w-2.5" />
                        {{ userDialog.mutualFriendCount }}
                    </Badge>
                </TooltipWrapper>
                <TooltipWrapper
                    v-if="userDialog.mutualGroupCount"
                    side="top"
                    :content="t('dialog.user.tags.mutual_groups')">
                    <Badge
                        variant="outline"
                        class="h-5 px-1.5 text-[11px] leading-none border-zinc-500/50! dark:border-zinc-400!">
                        <Network class="h-2.5 w-2.5" />
                        {{ userDialog.mutualGroupCount }}
                    </Badge>
                </TooltipWrapper>
                <TooltipWrapper
                    v-if="userDialog.ref.discordId"
                    side="top"
                    :content="t('dialog.user.tags.open_in_discord')">
                    <Badge
                        variant="outline"
                        class="h-5 px-1.5 text-[11px] leading-none text-[#7289da] border-[#7289da]! cursor-pointer"
                        @click="openDiscordProfile(userDialog.ref.discordId)">
                        <i
                            class="ri-discord-line inline-flex mt-0.5 h-2.5 w-2.5 items-center justify-center text-[10px] leading-none before:block before:leading-none"></i>
                        {{ t('dialog.user.tags.discord') }}
                    </Badge>
                </TooltipWrapper>
                <Badge
                    v-if="userDialog.ref.$isTroll"
                    variant="outline"
                    class="x-tag-troll h-5 px-1.5 text-[11px] leading-none">
                    {{ t('view.settings.appearance.user_colors.trust_levels.nuisance') }}
                </Badge>
                <Badge
                    v-if="userDialog.ref.$isProbableTroll"
                    variant="outline"
                    class="x-tag-troll h-5 px-1.5 text-[11px] leading-none">
                    {{ t('view.favorite.avatars.almost_nuisance') }}
                </Badge>
                <Badge
                    v-if="userDialog.ref.$isModerator"
                    variant="outline"
                    class="x-tag-vip h-5 px-1.5 text-[11px] leading-none">
                    {{ t('dialog.user.tags.vrchat_team') }}
                </Badge>
                <TooltipWrapper v-if="userDialog.ref.$platform === 'standalonewindows'" side="top" content="PC">
                    <Badge variant="outline" class="h-5 px-1.5 text-[11px] text-platform-pc border-platform-pc!">
                        <Monitor class="h-3 w-3 text-platform-pc" />
                        PC
                    </Badge>
                </TooltipWrapper>
                <TooltipWrapper v-else-if="userDialog.ref.$platform === 'android'" side="top" content="Android">
                    <Badge variant="outline" class="h-5 px-1.5 text-[11px] text-platform-quest border-platform-quest!">
                        <Smartphone class="h-3 w-3 text-platform-quest" />
                        Android
                    </Badge>
                </TooltipWrapper>
                <TooltipWrapper v-else-if="userDialog.ref.$platform === 'ios'" side="top" content="iOS">
                    <Badge variant="outline" class="h-5 px-1.5 text-[11px] text-platform-ios border-platform-ios">
                        <Apple class="h-3 w-3 text-platform-ios" />
                        iOS
                    </Badge>
                </TooltipWrapper>
                <Badge
                    v-else-if="userDialog.ref.$platform"
                    variant="outline"
                    class="h-5 px-1.5 text-[11px] leading-none text-muted-foreground">
                    {{ userDialog.ref.$platform }}
                </Badge>
                <Badge
                    v-if="userDialog.ref.$customTag"
                    variant="outline"
                    class="name h-5 px-1.5 text-[11px] leading-none"
                    :style="{
                        color: userDialog.ref.$customTagColour,
                        'border-color': userDialog.ref.$customTagColour
                    }"
                    >{{ userDialog.ref.$customTag }}</Badge
                >
            </div>

            <div v-if="userDialog.ref.$languages && userDialog.ref.$languages.length" class="flex flex-wrap gap-1">
                <Badge
                    v-for="item in userDialog.ref.$languages"
                    :key="item.key"
                    variant="outline"
                    class="h-5 px-1.5 inline-flex items-center gap-1 text-[11px] leading-none border-muted-foreground/30">
                    <span class="flags inline-block shrink-0 self-center" :class="languageClass(item.key)"></span>
                    <span class="inline-flex items-center leading-none">{{ item.value }} ({{ item.key }})</span>
                </Badge>
            </div>
        </div>
    </div>
</template>

<script setup>
    import {
        Apple,
        BadgeCheck,
        ChevronDown,
        Image,
        Monitor,
        Network,
        Shield,
        ShieldAlert,
        ShieldCheck,
        Smartphone,
        UserPlus,
        Users,
        XCircle,
        VolumeX,
        Sparkles,
        User
    } from 'lucide-vue-next';
    import { computed, ref, watch } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import {
        copyToClipboard,
        defaultUserImage,
        formatDateFilter,
        languageClass,
        openDiscordProfile,
        replaceBioSymbols
    } from '../../../shared/utils';
    import { useUserDisplay } from '../../../composables/useUserDisplay';
    import { useGalleryStore, useUserStore } from '../../../stores';
    import { Badge } from '../../ui/badge';

    import UserActionDropdown from './UserActionDropdown.vue';

    const props = defineProps({
        getUserStateText: {
            type: Function,
            required: true
        },
        copyUserDisplayName: {
            type: Function,
            required: true
        },
        userDialogCommand: {
            type: Function,
            required: true
        }
    });

    const { t } = useI18n();

    const { userDialog, currentUser } = storeToRefs(useUserStore());

    const { showFullscreenImageDialog } = useGalleryStore();
    const { userStatusClass } = useUserDisplay();
    const { showEditProfileDialog } = useUserStore();

    // NexVR profile badges, as nexvr.net shows them next to the name
    const nexvrBadges = computed(() => userDialog.value.ref?.$nexvr?.badges ?? []);
    // the rank letter (E … S+) when the user has a NexVR social rank, '' otherwise
    const nexvrRank = computed(() => {
        const level = userDialog.value.ref?.$trustLevel ?? '';
        return level.startsWith('Rank ') ? level.slice(5) : '';
    });
    const nexvrBadgeIcons = {
        'shield-check': ShieldCheck,
        'badge-check': BadgeCheck,
        shield: Shield,
        sparkles: Sparkles
    };
    const nexvrBadgeToneClass = {
        success: 'text-green-500 border-green-500!',
        primary: 'text-[#3b82f6] border-[#3b82f6]!',
        info: 'text-sky-400 border-sky-400!'
    };

    const profileImageError = ref(false);
    const userIconError = ref(false);
    watch(
        () => userDialog.value.id,
        () => {
            profileImageError.value = false;
            userIconError.value = false;
        }
    );

    const getUserStateText = props.getUserStateText;
    const copyUserDisplayName = props.copyUserDisplayName;
    const userDialogCommand = props.userDialogCommand;
</script>
