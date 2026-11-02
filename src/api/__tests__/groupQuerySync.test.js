import { beforeEach, describe, expect, test, vi } from 'vitest';

const mockRequest = vi.fn();
const mockInvalidateQueries = vi.fn().mockResolvedValue();
const mockApplyGroup = vi.fn((json) => json);

vi.mock('../../services/request', () => ({
    request: (...args) => mockRequest(...args)
}));

vi.mock('../../stores', () => ({
    useGroupStore: () => ({
        applyGroup: (...args) => mockApplyGroup(...args)
    }),
    useUserStore: () => ({
        currentUser: { id: 'usr_me' }
    })
}));

vi.mock('../../queries', () => ({
    queryClient: {
        invalidateQueries: (...args) => mockInvalidateQueries(...args)
    },
    entityQueryPolicies: {
        user: {},
        avatar: {},
        world: {},
        worldCollection: {}
    }
}));

import groupRequest from '../group';

describe('group query sync', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('group mutations invalidate scoped active group queries', async () => {
        mockRequest.mockResolvedValue({ ok: true });

        await groupRequest.deleteGroupPost({
            groupId: 'grp_1',
            postId: 'post_1'
        });

        expect(mockInvalidateQueries).toHaveBeenCalledTimes(1);
        expect(mockInvalidateQueries).toHaveBeenCalledWith({
            queryKey: ['group', 'grp_1'],
            refetchType: 'active'
        });
    });
});
