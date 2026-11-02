import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useUserDialogCommands } from '../useUserDialogCommands';

// Mock external modules
vi.mock('../../../../api', () => ({
    friendRequest: {
        sendFriendRequest: vi.fn(),
        cancelFriendRequest: vi.fn(),
        deleteFriend: vi.fn()
    },
    notificationRequest: {
        sendRequestInvite: vi.fn(() => Promise.resolve({})),
        sendInvite: vi.fn(() => Promise.resolve({})),
        acceptFriendRequestNotification: vi.fn(() => Promise.resolve({})),
        hideNotification: vi.fn(() => Promise.resolve({}))
    },
    worldRequest: {}
}));

vi.mock('../../../../shared/utils', () => ({
    copyToClipboard: vi.fn(),
    parseLocation: vi.fn(() => ({ worldId: 'wrld_test', tag: 'wrld_test~123' }))
}));

vi.mock('../../../../services/database', () => ({
    database: {
        addFriendLogHistory: vi.fn()
    }
}));

vi.mock('../../../../composables/useRecentActions', () => ({
    recordRecentAction: vi.fn(),
    useRecentActions: () => ({
        isRecentAction: vi.fn(() => false)
    })
}));

// Import mocks after vi.mock
const { friendRequest } = await import('../../../../api');
const { database } = await import('../../../../services/database');

function createMockUserDialog() {
    return ref({
        visible: true,
        id: 'usr_test123',
        ref: {
            displayName: 'TestUser',
            currentAvatarImageUrl: 'https://example.com/avatar.png',
            fallbackAvatar: 'avtr_fallback',
            location: 'wrld_test~123'
        },
        $avatarInfo: { ownerId: 'usr_owner' },
        isFriend: true,
        isBlock: false,
        isMute: false,
        isInteractOff: false,
        isMuteChat: false,
        isShowAvatar: false,
        isHideAvatar: false,
        outgoingRequest: false,
        incomingRequest: false
    });
}

function createMockDeps(overrides = {}) {
    return {
        t: vi.fn((key) => key),
        toast: Object.assign(vi.fn(), {
            success: vi.fn(),
            error: vi.fn()
        }),
        modalStore: {
            confirm: vi.fn(() => Promise.resolve({ ok: true }))
        },
        cachedUsers: new Map([['usr_test123', { id: 'usr_test123', displayName: 'TestUser' }]]),
        friendLogTable: ref({ data: [] }),
        lastLocation: ref({ location: 'wrld_test~123' }),
        lastLocationDestination: ref('wrld_dest~456'),
        showUserDialog: vi.fn(),
        getFriendRequest: vi.fn(() => ''),
        handleFriendDelete: vi.fn(),
        instanceStore: {
            showPreviousInstancesListDialog: vi.fn()
        },
        useNotificationStore: vi.fn(() => ({
            handleNotificationAccept: vi.fn(),
            handleNotificationHide: vi.fn()
        })),
        ...overrides
    };
}

describe('useUserDialogCommands', () => {
    let userDialog;
    let deps;

    beforeEach(() => {
        vi.clearAllMocks();
        userDialog = createMockUserDialog();
        deps = createMockDeps();
    });

    describe('userDialogCommand — direct commands', () => {
        it('should not execute when dialog is not visible', () => {
            userDialog.value.visible = false;
            const { userDialogCommand } = useUserDialogCommands(userDialog, deps);
            userDialogCommand('Refresh');
            expect(deps.showUserDialog).not.toHaveBeenCalled();
        });

        it('Refresh: should reset id and reopen dialog', () => {
            const { userDialogCommand } = useUserDialogCommands(userDialog, deps);
            userDialogCommand('Refresh');
            expect(userDialog.value.id).toBe('');
            expect(deps.showUserDialog).toHaveBeenCalledWith('usr_test123');
        });

        it('Previous Instances: should call instanceStore', () => {
            const { userDialogCommand } = useUserDialogCommands(userDialog, deps);
            userDialogCommand('Previous Instances');
            expect(deps.instanceStore.showPreviousInstancesListDialog).toHaveBeenCalledWith(
                'user',
                userDialog.value.ref
            );
        });
    });

    describe('userDialogCommand — string callback commands', () => {
        it('should not throw when callback is not registered', () => {
            const { userDialogCommand } = useUserDialogCommands(userDialog, deps);
            expect(() => userDialogCommand('Edit Bio')).not.toThrow();
        });
    });

    describe('userDialogCommand — confirmed commands', () => {
        it('confirmed command should not execute when user cancels', async () => {
            deps.modalStore.confirm = vi.fn(() => Promise.resolve({ ok: false }));
            const { userDialogCommand } = useUserDialogCommands(userDialog, deps);
            userDialogCommand('Unfriend');
            await vi.waitFor(() => {
                expect(deps.modalStore.confirm).toHaveBeenCalled();
            });
            expect(friendRequest.deleteFriend).not.toHaveBeenCalled();
        });

        it('Send Friend Request: should confirm then send', async () => {
            friendRequest.sendFriendRequest.mockResolvedValue({
                params: { userId: 'usr_test123' },
                json: { success: true }
            });
            const { userDialogCommand } = useUserDialogCommands(userDialog, deps);
            userDialogCommand('Send Friend Request');
            await vi.waitFor(() => {
                expect(friendRequest.sendFriendRequest).toHaveBeenCalledWith({
                    userId: 'usr_test123'
                });
            });
        });

        it('Cancel Friend Request: should confirm then cancel', async () => {
            friendRequest.cancelFriendRequest.mockResolvedValue({
                params: { userId: 'usr_test123' },
                json: {}
            });
            const { userDialogCommand } = useUserDialogCommands(userDialog, deps);
            userDialogCommand('Cancel Friend Request');
            await vi.waitFor(() => {
                expect(friendRequest.cancelFriendRequest).toHaveBeenCalledWith({
                    userId: 'usr_test123'
                });
            });
        });

        it('Unfriend: should confirm then delete friend', async () => {
            friendRequest.deleteFriend.mockResolvedValue({});
            const { userDialogCommand } = useUserDialogCommands(userDialog, deps);
            userDialogCommand('Unfriend');
            await vi.waitFor(() => {
                expect(friendRequest.deleteFriend).toHaveBeenCalledWith(
                    { userId: 'usr_test123' },
                    'dialog.user.actions.unfriend_success_msg'
                );
            });
        });
    });

    describe('handleSendFriendRequest (internal)', () => {
        it('should add friend log and update dialog state on success', async () => {
            friendRequest.sendFriendRequest.mockResolvedValue({
                params: { userId: 'usr_test123' },
                json: { success: true }
            });
            const { userDialogCommand } = useUserDialogCommands(userDialog, deps);
            userDialogCommand('Send Friend Request');
            await vi.waitFor(() => {
                expect(database.addFriendLogHistory).toHaveBeenCalled();
            });
            expect(userDialog.value.isFriend).toBe(true);
        });

        it('should set outgoingRequest when not success', async () => {
            friendRequest.sendFriendRequest.mockResolvedValue({
                params: { userId: 'usr_test123' },
                json: { success: false }
            });
            const { userDialogCommand } = useUserDialogCommands(userDialog, deps);
            userDialogCommand('Send Friend Request');
            await vi.waitFor(() => {
                expect(database.addFriendLogHistory).toHaveBeenCalled();
            });
            expect(userDialog.value.outgoingRequest).toBe(true);
        });
    });

    describe('unknown command', () => {
        it('should do nothing for unknown commands', () => {
            const { userDialogCommand } = useUserDialogCommands(userDialog, deps);
            expect(() => userDialogCommand('NonExistentCommand')).not.toThrow();
            expect(deps.modalStore.confirm).not.toHaveBeenCalled();
        });
    });
});
