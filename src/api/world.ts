import type { LimitedWorld, SearchWorlds, World } from 'vrchat';
import type { Json } from '../types/vrcx';
import { request } from '../services/request';
import { applyWorld } from '../coordinators/worldCoordinator';

const worldReq = {
    getWorld(params: { worldId: string }): Promise<{ json: Json<World>; ref: any; params: { worldId: string } }> {
        return request(`worlds/${params.worldId}`, {
            method: 'GET'
        }).then((json) => {
            return {
                json,
                params,
                ref: applyWorld(json)
            };
        });
    },

    getWorlds(
        params: SearchWorlds['query'],
        option?: string
    ): Promise<{ json: Json<LimitedWorld[]>; params: SearchWorlds['query']; option?: string }> {
        let endpoint = 'worlds';
        if (typeof option !== 'undefined') {
            endpoint = `worlds/${option}`;
        }
        return request(endpoint, {
            method: 'GET',
            params
        }).then((json) => {
            const args = {
                json,
                params,
                option
            };
            for (const json of args.json) {
                applyWorld(json);
            }
            return args;
        });
    }
};

export default worldReq;
