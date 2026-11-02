import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

import { useGroupDialogCommands } from '../useGroupDialogCommands';

vi.mock('../../../../shared/utils', () => ({
    copyToClipboard: vi.fn()
}));

function createGroupDialog(overrides = {}) {
    return ref({
        visible: true,
        id: 'grp_123',
        ref: {
            $url: 'https://vrchat.com/home/group/grp_123'
        },
        ...overrides
    });
}

function createDeps(overrides = {}) {
    return {
        t: vi.fn((key) => key),
        modalStore: {
            confirm: vi.fn().mockResolvedValue({ ok: true })
        },
        currentUser: ref({ id: 'usr_current' }),
        showGroupDialog: vi.fn(),
        leaveGroupPrompt: vi.fn(),
        setGroupVisibility: vi.fn(),
        setGroupSubscription: vi.fn(),
        showGroupMemberModerationDialog: vi.fn(),
        showInviteGroupDialog: vi.fn(),
        showGroupPostEditDialog: vi.fn(),
        groupRequest: {
            blockGroup: vi.fn().mockResolvedValue({
                params: { groupId: 'grp_123' }
            }),
            unblockGroup: vi.fn().mockResolvedValue({
                params: { groupId: 'grp_123' }
            })
        },
        ...overrides
    };
}

describe('useGroupDialogCommands', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns early when dialog is not visible', () => {
        const groupDialog = createGroupDialog({ visible: false });
        const deps = createDeps();
        const { groupDialogCommand } = useGroupDialogCommands(groupDialog, deps);

        groupDialogCommand('Refresh');
        expect(deps.showGroupDialog).not.toHaveBeenCalled();
    });

    it('Refresh calls showGroupDialog with forceRefresh', () => {
        const groupDialog = createGroupDialog();
        const deps = createDeps();
        const { groupDialogCommand } = useGroupDialogCommands(groupDialog, deps);

        groupDialogCommand('Refresh');
        expect(deps.showGroupDialog).toHaveBeenCalledWith('grp_123', {
            forceRefresh: true
        });
    });
});
