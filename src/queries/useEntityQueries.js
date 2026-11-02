import { useQuery } from '@tanstack/vue-query';

import { groupRequest, userRequest, worldRequest } from '../api';
import { entityQueryPolicies, toQueryOptions } from './policies';
import { queryKeys } from './keys';

/**
 * @param userId
 * @param options
 */
export function useUserQuery(userId, options = {}) {
    return useQuery({
        ...options,
        queryKey: queryKeys.user(userId),
        queryFn: () => userRequest.getUser({ userId }),
        enabled: Boolean(userId),
        ...toQueryOptions(entityQueryPolicies.user)
    });
}

/**
 * @param worldId
 * @param options
 */
export function useWorldQuery(worldId, options = {}) {
    return useQuery({
        ...options,
        queryKey: queryKeys.world(worldId),
        queryFn: () => worldRequest.getWorld({ worldId }),
        enabled: Boolean(worldId),
        ...toQueryOptions(entityQueryPolicies.world)
    });
}

/**
 * @param groupId
 * @param includeRoles
 * @param options
 */
export function useGroupQuery(groupId, includeRoles = false, options = {}) {
    return useQuery({
        ...options,
        queryKey: queryKeys.group(groupId, includeRoles),
        queryFn: () => groupRequest.getGroup({ groupId, includeRoles }),
        enabled: Boolean(groupId),
        ...toQueryOptions(entityQueryPolicies.group)
    });
}
