import type {
    CurrentUser,
    GetMutualFriends,
    LimitedUserSearch,
    MutualFriend,
    PublicProfile,
    SearchUsers,
    UpdateUserRequest,
    User
} from 'vrchat';
import type { Json, VrcxCurrentUser, VrcxUser } from '../types/vrcx';
import { patchAndRefetchActiveQuery, queryKeys } from '../queries';
import { request } from '../services/request';
import { useUserStore } from '../stores';
import { applyUser, applyCurrentUser, applyPublicProfile } from '../coordinators/userCoordinator';

function getCurrentUserId(): string {
    return useUserStore().currentUser.id;
}

const userReq = {
    getUser(params: { userId: string }): Promise<{ json: Json<User>; ref: VrcxUser; params: { userId: string } }> {
        return request(`users/${params.userId}`, {
            method: 'GET'
        }).then((json) => {
            if (!json) {
                throw new Error(`getUser missing user data for: ${params.userId}`);
            }
            json.$lastFetch = Date.now(); // todo: make this not suck
            const args = {
                json,
                params,
                ref: applyUser(json)
            };
            return args;
        });
    },

    getUsers(params: SearchUsers['query']): Promise<{ json: Json<LimitedUserSearch[]>; params: SearchUsers['query'] }> {
        return request('users', {
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

    saveCurrentUser(
        params: UpdateUserRequest
    ): Promise<{ json: Json<CurrentUser>; ref: VrcxCurrentUser; params: UpdateUserRequest }> {
        return request(`users/${getCurrentUserId()}`, {
            method: 'PUT',
            params
        }).then((json) => {
            const args = {
                json,
                params,
                ref: applyCurrentUser(json)
            };
            patchAndRefetchActiveQuery({
                queryKey: queryKeys.user(args.ref.id),
                nextData: args
            }).catch((err) => {
                console.error('Failed to refresh user query after mutation:', err);
            });
            return args;
        });
    },

    getMutualFriends(
        params: GetMutualFriends['path'] & GetMutualFriends['query']
    ): Promise<{ json: Json<MutualFriend[]>; params: GetMutualFriends['path'] & GetMutualFriends['query'] }> {
        return request(`users/${params.userId}/mutuals/friends`, {
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

    getPublicProfile(params: { userId: string }): Promise<{
        json: Json<PublicProfile>;
        params: { userId: string };
        ref: Json<PublicProfile> & { $lastFetch?: number };
    }> {
        return request(`profile/${params.userId}`, {
            method: 'GET'
        }).then((json) => {
            json.$lastFetch = Date.now();
            const args = {
                json,
                params,
                ref: applyPublicProfile(json)
            };
            return args;
        });
    },

    getSelfProfile(): Promise<{ json: Json<PublicProfile>; params: {} }> {
        return request(`profile/${getCurrentUserId()}`, {
            method: 'GET',
            params: {
                asSelf: true
            }
        }).then((json) => {
            const args = {
                json,
                params: {}
            };
            return args;
        });
    }
};

export default userReq;
