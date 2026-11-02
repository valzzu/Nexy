import type {
    CalendarEvent,
    CreateCalendarEventRequest,
    CreateGroupPostRequest,
    CreateGroupRequest,
    DeleteGroup,
    FollowCalendarEventRequest,
    GetGroupCalendarEvents,
    GetGroup,
    GetGroupMemberResponse,
    GetGroupMembers,
    GetGroupPosts,
    GetGroupPostsResponse,
    GetGroupRoleTemplatesResponse,
    GetUserGroupInstancesForGroupResponse,
    Group,
    GroupMember,
    GroupPost,
    LimitedGroup,
    LimitedUserGroups,
    PaginatedCalendarEventList,
    SearchGroupMembers,
    SearchGroupMembersResponse,
    SearchGroups,
    Success,
    UpdateCalendarEventRequest,
    UpdateGroupRequest,
    UserAllGroupPermissions
} from 'vrchat';
import type { Json, VrcxGroup } from '../types/vrcx';
import { useUserStore } from '../stores';
import { applyGroup } from '../coordinators/groupCoordinator';
import { queryClient } from '../queries';
import { request } from '../services/request';

function getCurrentUserId() {
    return useUserStore().currentUser.id;
}

function refetchActiveGroupScope(groupId) {
    if (!groupId) {
        return;
    }
    queryClient
        .invalidateQueries({
            queryKey: ['group', groupId],
            refetchType: 'active'
        })
        .catch((err) => {
            console.error('Failed to refresh scoped group queries:', err);
        });
}
const groupReq = {
    deleteGroupPost(params: { groupId: string; postId: string }): Promise<{ json: Json<Success>; params }> {
        return request(`groups/${params.groupId}/posts/${params.postId}`, {
            method: 'DELETE'
        }).then((json) => {
            const args = {
                json,
                params
            };
            refetchActiveGroupScope(params.groupId);
            return args;
        });
    },
    getGroup(
        params: { groupId: string } & GetGroup['query']
    ): Promise<{ json: Json<Group>; params: { groupId: string } & GetGroup['query']; ref: VrcxGroup }> {
        return request(`groups/${params.groupId}`, {
            method: 'GET',
            params: {
                includeRoles: params.includeRoles || false
            }
        }).then((json) => {
            const args = {
                json,
                params,
                ref: applyGroup(json)
            };
            return args;
        });
    },
    getGroups(params: { userId: string }): Promise<{ json: Json<LimitedUserGroups[]>; params }> {
        return request(`users/${params.userId}/groups`, {
            method: 'GET'
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    deleteGroup(
        params: { groupId: string } & DeleteGroup['query']
    ): Promise<{ json: Json<Success>; params: { groupId: string } & DeleteGroup['query'] }> {
        return request(`groups/${params.groupId}`, {
            method: 'DELETE',
            params: {
                hardDelete: params.hardDelete ?? false
            }
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    joinGroup(params: { groupId: string }): Promise<{ json: Json<GroupMember>; params }> {
        return request(`groups/${params.groupId}/join`, {
            method: 'POST'
        }).then((json) => {
            const args = {
                json,
                params
            };
            refetchActiveGroupScope(params.groupId);
            return args;
        });
    },
    leaveGroup(params: { groupId: string }): Promise<{ json: unknown; params }> {
        return request(`groups/${params.groupId}/leave`, {
            method: 'POST'
        }).then((json) => {
            const args = {
                json,
                params
            };
            refetchActiveGroupScope(params.groupId);
            return args;
        });
    },
    getGroupPermissions(params: {
        userId: string;
    }): Promise<{ json: Json<UserAllGroupPermissions>; params: { userId: string } }> {
        return request(`users/${params.userId}/groups/permissions`, {
            method: 'GET'
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },
    getGroupPosts(
        params: { groupId: string } & GetGroupPosts['query']
    ): Promise<{ json: Json<GetGroupPostsResponse>; params: { groupId: string } & GetGroupPosts['query'] }> {
        return request(`groups/${params.groupId}/posts`, {
            method: 'GET',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },
    createGroupPost(
        params: { groupId: string } & CreateGroupPostRequest
    ): Promise<{ json: Json<GroupPost>; params: { groupId: string } & CreateGroupPostRequest }> {
        return request(`groups/${params.groupId}/posts`, {
            method: 'POST',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            refetchActiveGroupScope(params.groupId);
            return args;
        });
    },
    getGroupMember(params: {
        groupId: string;
        userId: string;
    }): Promise<{ json: Json<GetGroupMemberResponse>; params; ref?: any }> {
        return request(`groups/${params.groupId}/members/${params.userId}`, {
            method: 'GET'
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },
    getGroupMembers(
        params: { groupId: string } & GetGroupMembers['query']
    ): Promise<{ json: Json<GroupMember[]>; params: { groupId: string } & GetGroupMembers['query'] }> {
        return request(`groups/${params.groupId}/members`, {
            method: 'GET',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },
    getGroupMembersSearch(
        params: { groupId: string } & SearchGroupMembers['query']
    ): Promise<{ json: Json<SearchGroupMembersResponse>; params: { groupId: string } & SearchGroupMembers['query'] }> {
        return request(`groups/${params.groupId}/members/search`, {
            method: 'GET',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    getGroupInstances(params: {
        groupId: string;
    }): Promise<{ json: Json<GetUserGroupInstancesForGroupResponse>; params }> {
        return request(`users/${getCurrentUserId()}/instances/groups/${params.groupId}`, {
            method: 'GET'
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },
    groupSearch(params: SearchGroups['query']): Promise<{ json: Json<LimitedGroup[]>; params: SearchGroups['query'] }> {
        return request(`groups`, {
            method: 'GET',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },
    getGroupCalendar(
        groupId: string,
        query?: Json<GetGroupCalendarEvents['query']>
    ): Promise<{ json: Json<PaginatedCalendarEventList>; params: { groupId: string } }> {
        return request(`calendar/${groupId}`, {
            method: 'GET',
            params: query
        }).then((json) => {
            const args = {
                json,
                params: {
                    groupId
                }
            };
            return args;
        });
    },

    getGroupCalendarEvent(params: {
        groupId: string;
        eventId: string;
    }): Promise<{ json: Json<CalendarEvent>; params }> {
        return request(`calendar/${params.groupId}/${params.eventId}`, {
            method: 'GET'
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },
    followGroupEvent(params: { groupId: string; eventId: string } & FollowCalendarEventRequest): Promise<{
        json: Json<CalendarEvent>;
        params: { groupId: string; eventId: string } & FollowCalendarEventRequest;
    }> {
        return request(`calendar/${params.groupId}/${params.eventId}/follow`, {
            method: 'POST',
            params: {
                isFollowing: params.isFollowing
            }
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    deleteGroupEvent(params: {
        groupId: string;
        eventId: string;
    }): Promise<{ json: Json<Success>; params: { groupId: string; eventId: string } }> {
        return request(`calendar/${params.groupId}/${params.eventId}`, {
            method: 'DELETE'
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    createGroupEvent(
        params: { groupId: string } & Json<CreateCalendarEventRequest>
    ): Promise<{ json: Json<CalendarEvent>; params: { groupId: string } & Json<CreateCalendarEventRequest> }> {
        return request(`calendar/${params.groupId}/event`, {
            method: 'POST',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    editGroupEvent(
        params: { groupId: string; eventId: string } & Json<UpdateCalendarEventRequest> & {
                accessType?: CreateCalendarEventRequest['accessType'];
            }
    ): Promise<{
        json: Json<CalendarEvent>;
        params: { groupId: string; eventId: string } & Json<UpdateCalendarEventRequest> & {
                accessType?: CreateCalendarEventRequest['accessType'];
            };
    }> {
        return request(`calendar/${params.groupId}/${params.eventId}/event`, {
            method: 'PUT',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    createGroup(params: CreateGroupRequest): Promise<{ json: Json<Group>; params: CreateGroupRequest }> {
        return request('groups', {
            method: 'POST',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    editGroup(params: { id: string } & UpdateGroupRequest & { allowGroupJoinPrompt?: boolean }): Promise<{
        json: Json<Group>;
        params: { id: string } & UpdateGroupRequest & { allowGroupJoinPrompt?: boolean };
    }> {
        return request(`groups/${params.id}`, {
            method: 'PUT',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    getRoleTemplates(): Promise<{ json: Json<GetGroupRoleTemplatesResponse> }> {
        return request('groups/roleTemplates', {
            method: 'GET'
        }).then((json) => {
            const args = {
                json
            };
            return args;
        });
    }

    // getRequestedGroups() {
    //     return request(
    //         `users/${API.currentUser.id}/groups/requested`,
    //         {
    //             method: 'GET'
    //         }
    //     ).then((json) => {
    //         const args = {
    //             json
    //         };
    //         API.$emit('GROUP:REQUESTED', args);
    //         return args;
    //     });
    // }

    // /**
    // * @param {{ groupId: string }} params
    // * @return { Promise<{json: any, params}> }
    // */
    // API.getGroupAnnouncement = function (params) {
    //     return request(`groups/${params.groupId}/announcement`, {
    //         method: 'GET'
    //     }).then((json) => {
    //         var args = {
    //             json,
    //             params
    //         };
    //         this.$emit('GROUP:ANNOUNCEMENT', args);
    //         return args;
    //     });
    // };
};

export default groupReq;
