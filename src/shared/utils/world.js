import { parseLocation } from './location';
import { queryRequest } from '../../api';

/**
 * @param {string} location
 * @returns {Promise<string>}
 */
async function getWorldName(location) {
    let worldName = '';

    const L = parseLocation(location);
    if (L.isRealInstance && L.worldId) {
        try {
            const args = await queryRequest.fetch('world.dialog', {
                worldId: L.worldId
            });
            worldName = args.ref.name;
        } catch (e) {
            console.error('getWorldName failed location', location, e);
        }
    }

    return worldName;
}

export { getWorldName };
