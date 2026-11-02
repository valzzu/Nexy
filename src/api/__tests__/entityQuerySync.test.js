import { beforeEach, describe, expect, test, vi } from 'vitest';

const mockRequest = vi.fn();
const mockPatchAndRefetchActiveQuery = vi.fn(() => Promise.resolve());

const mockApplyCurrentUser = vi.fn((json) => ({
    id: json.id || 'usr_me',
    ...json
}));
const mockApplyUser = vi.fn((json) => ({ ...json }));
const mockApplyWorld = vi.fn((json) => ({ ...json }));

vi.mock('../../services/request', () => ({
    request: (...args) => mockRequest(...args)
}));

vi.mock('../../stores', () => ({
    useUserStore: () => ({
        currentUser: { id: 'usr_me' },
        applyCurrentUser: mockApplyCurrentUser,
        applyUser: mockApplyUser
    }),
    useWorldStore: () => ({
        applyWorld: mockApplyWorld
    })
}));

vi.mock('../../coordinators/userCoordinator', () => ({
    applyCurrentUser: (...args) => mockApplyCurrentUser(...args),
    applyUser: (...args) => mockApplyUser(...args)
}));

vi.mock('../../coordinators/worldCoordinator', () => ({
    applyWorld: (...args) => mockApplyWorld(...args)
}));

vi.mock('../../queries', () => ({
    patchAndRefetchActiveQuery: (...args) => mockPatchAndRefetchActiveQuery(...args),
    queryKeys: {
        user: (userId) => ['user', userId],
        avatar: (avatarId) => ['avatar', avatarId],
        world: (worldId) => ['world', worldId]
    },
    entityQueryPolicies: {
        user: {},
        avatar: {},
        world: {},
        worldCollection: {}
    }
}));

import userRequest from '../user';

describe('entity mutation query sync', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('saveCurrentUser patches and refetches active user query', async () => {
        mockRequest.mockResolvedValue({ id: 'usr_me', status: 'active' });

        await userRequest.saveCurrentUser({ status: 'active' });

        expect(mockPatchAndRefetchActiveQuery).toHaveBeenCalledWith(
            expect.objectContaining({
                queryKey: ['user', 'usr_me']
            })
        );
    });
});
