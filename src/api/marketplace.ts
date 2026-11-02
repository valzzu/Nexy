import type { Balance } from 'vrchat';
import type { Json } from '../types/vrcx';
import { request } from '../services/request';
import { useUserStore } from '../stores';

const marketplaceReq = {
    getVRChatCredits(): Promise<{ json: Json<Balance> }> {
        return request(`user/${useUserStore().currentUser.id}/economy/balance`, {
            method: 'GET'
        }).then((json) => {
            const args = {
                json
            };
            return args;
        });
    }
};

export default marketplaceReq;
