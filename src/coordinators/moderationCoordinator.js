import { playerModerationRequest } from '../api';
import { useModerationStore } from '../stores/moderation';

/**
 * Refreshes all player moderations from the API.
 */
export async function runRefreshPlayerModerationsFlow() {
    const moderationStore = useModerationStore();

    if (moderationStore.playerModerationTable.loading) {
        return;
    }
    moderationStore.playerModerationTable.loading = true;
    moderationStore.expirePlayerModerations();
    playerModerationRequest
        .getPlayerModerations()
        .then((res) => {
            if (res?.json) {
                for (const json of res.json) {
                    moderationStore.applyPlayerModeration(json);
                }
            }
            moderationStore.deleteExpiredPlayerModerations();
        })
        .catch((error) => {
            console.error('Failed to load player moderations:', error);
        })
        .finally(() => {
            moderationStore.playerModerationTable.loading = false;
        });
}
