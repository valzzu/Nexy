import { reactive, ref, watch } from 'vue';
import { defineStore } from 'pinia';

import { replaceBioSymbols } from '../shared/utils';
import { groupRequest } from '../api';
import { initUserGroups } from '../coordinators/groupCoordinator';
import { watchState } from '../services/watchState';

export const useGroupStore = defineStore('Group', () => {
    let cachedGroups = new Map();

    const groupDialog = ref({
        visible: false,
        loading: false,
        activeTab: 'Info',
        lastActiveTab: 'Info',
        isGetGroupDialogGroupLoading: false,
        id: '',
        inGroup: false,
        ownerDisplayName: '',
        ref: {},
        announcement: {},
        posts: [],
        postsFiltered: [],
        calendar: [],
        members: [],
        memberSearch: '',
        memberSearchResults: [],
        instances: [],
        memberRoles: [],
        lastVisit: '',
        joinCount: 0,
        memberFilter: {
            name: 'dialog.group.members.filters.everyone',
            id: null
        },
        memberSortOrder: {
            name: 'dialog.group.members.sorting.joined_at_desc',
            value: 'joinedAt:desc'
        },
        postsSearch: '',
        galleries: {},
        listings: []
    });

    const groupEditDialog = ref({
        visible: false,
        loading: false,
        roleTemplatesLoading: false,
        mode: 'create',
        groupId: '',
        name: '',
        shortCode: '',
        description: '',
        joinState: 'open',
        privacy: 'default',
        roleTemplate: 'default',
        roleTemplates: [],
        languages: [],
        rules: '',
        links: [],
        bannerId: '',
        bannerUrl: '',
        iconId: '',
        iconUrl: '',
        allowGroupJoinPrompt: false
    });

    const groupEventEditDialog = ref({
        visible: false,
        loading: false,
        mode: 'create',
        groupId: '',
        eventId: '',
        groupRef: {},
        startsAt: '',
        endsAt: '',
        title: '',
        accessType: 'group',
        description: '',
        category: 'other',
        tags: [],
        imageId: '',
        imageUrl: '',
        roleIds: [],
        parentId: null,
        platforms: [],
        languages: [],
        sendCreationNotification: false,
        hostEarlyJoinMinutes: 60,
        guestEarlyJoinMinutes: 5,
        closeInstanceAfterEndMinutes: 5,
        seriesId: null,
        recurrence: null
    });
    const groupEventRevision = ref(0);

    const currentUserGroups = reactive(new Map());

    const groupInstances = ref([]);

    const currentUserGroupsInit = ref(false);

    watch(
        () => watchState.isLoggedIn,
        (isLoggedIn) => {
            groupDialog.value.visible = false;
            groupEditDialog.value.visible = false;
            groupEventEditDialog.value.visible = false;
            currentUserGroupsInit.value = false;
            cachedGroups.clear();
            currentUserGroups.clear();
            groupInstances.value = [];
            groupDialog.value.instances = [];
            if (isLoggedIn) {
                initUserGroups();
            }
        },
        { flush: 'sync' }
    );

    /**
     * @param {{ groupId: string }} params
     * @returns {Promise<{ posts: any; params }>}
     */
    async function getAllGroupPosts(params) {
        const n = 100;
        const posts = [];
        let offset = 0;
        let total = Infinity;
        let pages = 0;
        do {
            const args = await groupRequest.getGroupPosts({
                groupId: params.groupId,
                n,
                offset
            });
            const pagePosts = args.json?.posts ?? [];
            total = Number(args.json?.total ?? pagePosts.length);
            posts.push(...pagePosts);
            offset += n;
            pages += 1;
            if (pagePosts.length === 0) {
                break;
            }
        } while (offset < total && pages < 50);
        const returnArgs = {
            posts,
            params
        };
        const D = groupDialog.value;
        if (D.id === params.groupId) {
            for (const post of posts) {
                post.title = replaceBioSymbols(post.title);
                post.text = replaceBioSymbols(post.text);
            }
            D.announcement = posts[0] ?? {};
            D.posts = posts;
            updateGroupPostSearch();
        }

        return returnArgs;
    }

    /**
     * @param event
     */
    function applyGroupEvent(event) {
        return {
            userInterest: {
                createdAt: null,
                isFollowing: false,
                updatedAt: null
            },
            ...event,
            title: replaceBioSymbols(event.title),
            description: replaceBioSymbols(event.description)
        };
    }

    function updateGroupPostSearch() {
        const D = groupDialog.value;
        const search = D.postsSearch.toLowerCase();
        D.postsFiltered = D.posts.filter((post) => {
            if (search === '') {
                return true;
            }
            if (post.title.toLowerCase().includes(search)) {
                return true;
            }
            if (post.text.toLowerCase().includes(search)) {
                return true;
            }
            return false;
        });
    }

    /**
     * @param {object} args
     */
    function handleGroupPost(args) {
        const D = groupDialog.value;
        if (D.id !== args.params.groupId) {
            return;
        }

        const newPost = args.json;
        newPost.title = replaceBioSymbols(newPost.title);
        newPost.text = replaceBioSymbols(newPost.text);
        let hasPost = false;
        // update existing post
        for (const post of D.posts) {
            if (post.id === newPost.id) {
                Object.assign(post, newPost);
                hasPost = true;
                break;
            }
        }
        // set or update announcement; a new post is the newest, so it becomes the announcement
        if (!hasPost || newPost.id === D.announcement.id || !D.announcement.id) {
            D.announcement = newPost;
        }
        // add new post
        if (!hasPost) {
            D.posts.unshift(newPost);
        }
        updateGroupPostSearch();
    }

    function clearGroupInstances() {
        groupInstances.value = [];
    }

    /**
     * @param {boolean} value
     */
    function setGroupDialogVisible(value) {
        groupDialog.value.visible = value;
    }

    /**
     * @param {boolean} value
     */
    function setCurrentUserGroupsInit(value) {
        currentUserGroupsInit.value = value;
    }

    /**
     * @param {Array} value
     */
    function setGroupInstances(value) {
        groupInstances.value = value;
    }

    function resetGroupEditDialog() {
        groupEditDialog.value = {
            visible: false,
            loading: false,
            roleTemplatesLoading: false,
            mode: 'create',
            groupId: '',
            name: '',
            shortCode: '',
            description: '',
            joinState: 'open',
            privacy: 'default',
            roleTemplate: 'default',
            roleTemplates: [],
            languages: [],
            rules: '',
            links: [],
            bannerId: '',
            bannerUrl: '',
            iconId: '',
            iconUrl: '',
            allowGroupJoinPrompt: false
        };
    }

    async function showCreateGroupDialog() {
        resetGroupEditDialog();
        const D = groupEditDialog.value;
        D.visible = true;
        D.roleTemplatesLoading = true;
        try {
            const args = await groupRequest.getRoleTemplates();
            D.roleTemplates = Array.isArray(args.json)
                ? args.json
                : Object.entries(args.json ?? {}).map(([value, template]) => ({
                      value,
                      ...(typeof template === 'object' && template !== null ? template : {})
                  }));
        } finally {
            D.roleTemplatesLoading = false;
        }
    }

    /**
     * @param {object} group
     */
    function showEditGroupDialog(group) {
        resetGroupEditDialog();
        groupEditDialog.value = {
            visible: true,
            loading: false,
            roleTemplatesLoading: false,
            mode: 'edit',
            groupId: group.id,
            name: group.name,
            shortCode: group.shortCode,
            description: group.description,
            joinState: group.joinState ?? 'open',
            privacy: group.privacy ?? 'default',
            roleTemplate: group.roleTemplate ?? 'default',
            roleTemplates: Array.isArray(group.roleTemplates) ? [...group.roleTemplates] : [],
            languages: Array.isArray(group.languages) ? [...group.languages] : [],
            rules: group.rules,
            links: Array.isArray(group.links) ? [...group.links] : [],
            bannerId: group.bannerId,
            bannerUrl: group.bannerUrl,
            iconId: group.iconId,
            iconUrl: group.iconUrl,
            allowGroupJoinPrompt: !!group.allowGroupJoinPrompt
        };
    }

    function resetGroupEventEditDialog() {
        const startsAt = new Date();
        startsAt.setMinutes(0, 0, 0);
        startsAt.setHours(startsAt.getHours() + 1);
        const endsAt = new Date(startsAt);
        endsAt.setHours(endsAt.getHours() + 2);
        groupEventEditDialog.value = {
            visible: false,
            loading: false,
            mode: 'create',
            groupId: '',
            eventId: '',
            groupRef: {},
            startsAt: startsAt.toISOString(),
            endsAt: endsAt.toISOString(),
            title: '',
            accessType: 'group',
            description: '',
            category: 'other',
            tags: [],
            imageId: '',
            imageUrl: '',
            roleIds: [],
            parentId: null,
            platforms: [],
            languages: [],
            sendCreationNotification: false,
            hostEarlyJoinMinutes: 60,
            guestEarlyJoinMinutes: 5,
            closeInstanceAfterEndMinutes: 5,
            seriesId: null,
            recurrence: null
        };
    }

    /**
     * @param {object} group
     */
    function showCreateGroupEventDialog(group) {
        resetGroupEventEditDialog();
        groupEventEditDialog.value = {
            ...groupEventEditDialog.value,
            visible: true,
            groupId: group.id,
            groupRef: group
        };
    }

    /**
     * @param {object} event
     * @param {object} group
     */
    function showEditGroupEventDialog(event, group) {
        resetGroupEventEditDialog();
        groupEventEditDialog.value = {
            visible: true,
            loading: false,
            mode: 'edit',
            groupId: event.ownerId,
            eventId: event.id,
            groupRef: group,
            startsAt: event.startsAt,
            endsAt: event.endsAt,
            title: event.title ?? '',
            accessType: event.accessType ?? 'group',
            description: event.description ?? '',
            category: event.category ?? 'other',
            tags: Array.isArray(event.tags) ? [...event.tags] : [],
            imageId: event.imageId ?? '',
            imageUrl: event.imageUrl ?? '',
            roleIds: Array.isArray(event.roleIds) ? [...event.roleIds] : [],
            parentId: null,
            platforms: Array.isArray(event.platforms) ? [...event.platforms] : [],
            languages: Array.isArray(event.languages) ? [...event.languages] : [],
            sendCreationNotification: false,
            hostEarlyJoinMinutes: event.hostEarlyJoinMinutes ?? 60,
            guestEarlyJoinMinutes: event.guestEarlyJoinMinutes ?? 5,
            closeInstanceAfterEndMinutes: event.closeInstanceAfterEndMinutes ?? 5,
            seriesId: event.seriesId,
            recurrence: event.recurrence
        };
    }

    function markGroupEventMutation() {
        groupEventRevision.value++;
    }

    return {
        groupDialog,
        groupEditDialog,
        groupEventEditDialog,
        groupEventRevision,
        currentUserGroups,
        cachedGroups,
        groupInstances,
        currentUserGroupsInit,
        getAllGroupPosts,
        applyGroupEvent,
        updateGroupPostSearch,
        handleGroupPost,
        clearGroupInstances,
        setGroupDialogVisible,
        setCurrentUserGroupsInit,
        setGroupInstances,
        showCreateGroupDialog,
        showEditGroupDialog,
        showCreateGroupEventDialog,
        showEditGroupEventDialog,
        markGroupEventMutation
    };
});
