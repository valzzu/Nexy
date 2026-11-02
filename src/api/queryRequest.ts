import { entityQueryPolicies, fetchWithEntityPolicy, queryKeys } from '../queries';

import groupRequest from './group';
import marketplaceRequest from './marketplace';
import userRequest from './user';

import worldRequest from './world';

const registry = Object.freeze({
    user: {
        key: (params) => queryKeys.user(params.userId),
        policy: entityQueryPolicies.user,
        queryFn: (params) => userRequest.getUser(params)
    },
    'user.dialog': {
        key: (params) => queryKeys.user(params.userId),
        policy: Object.freeze({
            ...entityQueryPolicies.user,
            staleTime: 60_000
        }),
        queryFn: (params) => userRequest.getUser(params)
    },
    'user.force': {
        key: (params) => queryKeys.user(params.userId),
        policy: Object.freeze({
            ...entityQueryPolicies.user,
            staleTime: 0
        }),
        queryFn: (params) => userRequest.getUser(params)
    },
    publicProfile: {
        key: (params) => queryKeys.profile(params.userId),
        policy: entityQueryPolicies.profile,
        queryFn: (params) => userRequest.getPublicProfile(params)
    },
    world: {
        key: (params) => queryKeys.world(params.worldId),
        policy: entityQueryPolicies.world,
        queryFn: (params) => worldRequest.getWorld(params)
    },
    'world.dialog': {
        key: (params) => queryKeys.world(params.worldId),
        policy: Object.freeze({
            ...entityQueryPolicies.world,
            staleTime: 120_000
        }),
        queryFn: (params) => worldRequest.getWorld(params)
    },
    'world.location': {
        key: (params) => queryKeys.world(params.worldId),
        policy: Object.freeze({
            ...entityQueryPolicies.world,
            staleTime: 120_000
        }),
        queryFn: (params) => worldRequest.getWorld(params)
    },
    'world.force': {
        key: (params) => queryKeys.world(params.worldId),
        policy: Object.freeze({
            ...entityQueryPolicies.world,
            staleTime: 0
        }),
        queryFn: (params) => worldRequest.getWorld(params)
    },
    worldsByUser: {
        key: (params) => queryKeys.worldsByUser(params),
        policy: entityQueryPolicies.worldCollection,
        queryFn: (params) => worldRequest.getWorlds(params, params.option || undefined)
    },
    group: {
        key: (params) => queryKeys.group(params.groupId, params.includeRoles),
        policy: entityQueryPolicies.group,
        queryFn: (params) => groupRequest.getGroup(params)
    },
    'group.dialog': {
        key: (params) => queryKeys.group(params.groupId, params.includeRoles),
        policy: Object.freeze({
            ...entityQueryPolicies.group,
            staleTime: 120_000
        }),
        queryFn: (params) => groupRequest.getGroup(params)
    },
    'group.force': {
        key: (params) => queryKeys.group(params.groupId, params.includeRoles),
        policy: Object.freeze({
            ...entityQueryPolicies.group,
            staleTime: 0
        }),
        queryFn: (params) => groupRequest.getGroup(params)
    },
    groupMember: {
        key: (params) => queryKeys.groupMember(params),
        policy: entityQueryPolicies.groupCollection,
        queryFn: (params) => groupRequest.getGroupMember(params)
    },
    groupMembers: {
        key: (params) => queryKeys.groupMembers(params),
        policy: entityQueryPolicies.groupCollection,
        queryFn: (params) => groupRequest.getGroupMembers(params)
    },
    groupCalendar: {
        key: (params) => queryKeys.groupCalendar(params.groupId),
        policy: entityQueryPolicies.groupCollection,
        queryFn: (params) => groupRequest.getGroupCalendar(params.groupId)
    },
    groupCalendarEvent: {
        key: (params) => queryKeys.groupCalendarEvent(params),
        policy: entityQueryPolicies.groupCalendarEvent,
        queryFn: (params) => groupRequest.getGroupCalendarEvent(params)
    },
    vrchatCredits: {
        key: () => queryKeys.vrchatCredits(),
        policy: entityQueryPolicies.vrchatCredits,
        queryFn: () => marketplaceRequest.getVRChatCredits()
    }
});

const queryRequest = {
    async fetch<T>(resource: keyof typeof registry, params: any = {}): Promise<T & { cache: boolean }> {
        const entry = registry[resource];
        if (!entry) {
            throw new Error(`Unknown query resource: ${String(resource)}`);
        }

        const { data, cache } = await fetchWithEntityPolicy({
            queryKey: entry.key(params),
            policy: entry.policy,
            queryFn: () => entry.queryFn(params),
            label: resource
        });

        return {
            ...data,
            cache
        };
    }
};

export default queryRequest;
