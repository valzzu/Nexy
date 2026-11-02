import { friendRequest, notificationRequest, queryRequest } from '../../../api';
import { copyToClipboard, parseLocation } from '../../../shared/utils';
import { database } from '../../../services/database';
import { recordRecentAction } from '../../../composables/useRecentActions';

/**
 * Composable for UserDialog command dispatch.
 * Uses a command map pattern instead of if-else/switch-case chains.
 *
 * @param {import('vue').Ref} userDialog - Reactive ref to the user dialog state
 * @param {object} deps - External dependencies
 * @param deps.t
 * @param deps.toast
 * @param deps.modalStore
 * @param deps.cachedUsers
 * @param deps.friendLogTable
 * @param deps.lastLocation
 * @param deps.lastLocationDestination
 * @param deps.showUserDialog
 * @param deps.getFriendRequest
 * @param deps.handleFriendDelete
 * @param deps.instanceStore
 * @param deps.useNotificationStore
 * @param deps.showEditProfileDialog
 * @returns {object} Command composable API
 */
export function useUserDialogCommands(
    userDialog,
    {
        t,
        toast,
        modalStore,
        cachedUsers,
        friendLogTable,
        lastLocation,
        lastLocationDestination,
        showUserDialog,
        getFriendRequest,
        handleFriendDelete,
        instanceStore,
        useNotificationStore,
        showEditProfileDialog
    }
) {
    // --- Internal helpers ---

    /**
     * @param {object} args
     */
    function handleSendFriendRequest(args) {
        const ref = cachedUsers.get(args.params.userId);
        if (typeof ref === 'undefined') {
            return;
        }
        const friendLogHistory = {
            created_at: new Date().toJSON(),
            type: 'FriendRequest',
            userId: ref.id,
            displayName: ref.displayName
        };
        friendLogTable.value.data.push(friendLogHistory);
        database.addFriendLogHistory(friendLogHistory);

        const D = userDialog.value;
        if (D.visible === false || D.id !== args.params.userId) {
            return;
        }
        if (args.json.success) {
            D.isFriend = true;
        } else {
            D.outgoingRequest = true;
        }
    }

    /**
     * @param {object} args
     */
    function handleCancelFriendRequest(args) {
        const ref = cachedUsers.get(args.params.userId);
        if (typeof ref === 'undefined') {
            return;
        }
        const friendLogHistory = {
            created_at: new Date().toJSON(),
            type: 'CancelFriendRequest',
            userId: ref.id,
            displayName: ref.displayName
        };
        friendLogTable.value.data.push(friendLogHistory);
        database.addFriendLogHistory(friendLogHistory);
        const D = userDialog.value;
        if (D.visible === false || D.id !== args.params.userId) {
            return;
        }
        D.outgoingRequest = false;
    }

    // --- Command map ---
    // Direct commands: function
    // Confirmed commands: { confirm: () => ({title, description, ...}), handler: fn }

    function buildCommandMap() {
        const D = () => userDialog.value;

        return {
            // --- Direct commands ---
            Refresh: () => {
                const userId = D().id;
                D().id = '';
                showUserDialog(userId);
            },
            'Copy DisplayName': () => {
                copyToClipboard(D().ref.displayName, t('message.user.display_name_copied'));
            },
            'Copy UserId': () => {
                copyToClipboard(D().id, t('message.user.id_copied'));
            },
            'Edit Profile': () => {
                showEditProfileDialog();
            },
            'Request Invite': () => {
                notificationRequest
                    .sendRequestInvite(
                        {
                            platform: 'standalonewindows'
                        },
                        D().id
                    )
                    .then((args) => {
                        toast(t('message.user.request_invite_sent'));
                        recordRecentAction(D().id, 'Request Invite');
                        return args;
                    });
            },
            Invite: () => {
                let currentLocation = lastLocation.value.location;
                if (lastLocation.value.location === 'traveling') {
                    currentLocation = lastLocationDestination.value;
                }
                const L = parseLocation(currentLocation);
                queryRequest
                    .fetch('world', {
                        worldId: L.worldId
                    })
                    .then((args) => {
                        notificationRequest
                            .sendInvite(
                                {
                                    instanceId: L.tag,
                                    worldId: L.tag,
                                    worldName: args.ref.name
                                },
                                D().id
                            )
                            .then((_args) => {
                                toast(t('message.invite.sent'));
                                recordRecentAction(D().id, 'Invite');
                                return _args;
                            });
                    });
            },
            'Previous Instances': () => {
                instanceStore.showPreviousInstancesListDialog('user', D().ref);
            },
            'Edit Note Memo': 'showEditNoteAndMemoDialog',

            // --- Confirmed commands ---
            'Accept Friend Request': {
                confirm: () => ({
                    title: t('confirm.title'),
                    description: t('confirm.command_question', {
                        command: t('dialog.user.actions.accept_friend_request')
                    })
                }),
                handler: async (userId) => {
                    const key = getFriendRequest(userId);
                    if (key === '') {
                        const args = await friendRequest.sendFriendRequest({
                            userId
                        });
                        handleSendFriendRequest(args);
                    } else {
                        notificationRequest
                            .acceptFriendRequestNotification({
                                notificationId: key
                            })
                            .then((args) => {
                                useNotificationStore().handleNotificationAccept(args);
                            })
                            .catch((err) => {
                                if (err && err.message && err.message.includes('404')) {
                                    useNotificationStore().handleNotificationHide(key);
                                }
                            });
                    }
                }
            },
            'Decline Friend Request': {
                confirm: () => ({
                    title: t('confirm.title'),
                    description: t('confirm.command_question', {
                        command: t('dialog.user.actions.decline_friend_request')
                    })
                }),
                handler: async (userId) => {
                    const key = getFriendRequest(userId);
                    if (key === '') {
                        const args = await friendRequest.cancelFriendRequest({
                            userId
                        });
                        handleCancelFriendRequest(args);
                    } else {
                        notificationRequest
                            .hideNotification({
                                notificationId: key
                            })
                            .then(() => {
                                useNotificationStore().handleNotificationHide(key);
                            });
                    }
                }
            },
            'Cancel Friend Request': {
                confirm: () => ({
                    title: t('confirm.title'),
                    description: t('confirm.command_question', {
                        command: t('dialog.user.actions.cancel_friend_request')
                    })
                }),
                handler: async (userId) => {
                    const args = await friendRequest.cancelFriendRequest({
                        userId
                    });
                    handleCancelFriendRequest(args);
                }
            },
            'Send Friend Request': {
                confirm: () => ({
                    title: t('confirm.title'),
                    description: t('confirm.command_question', {
                        command: t('dialog.user.actions.send_friend_request')
                    })
                }),
                handler: async (userId) => {
                    const args = await friendRequest.sendFriendRequest({
                        userId
                    });
                    handleSendFriendRequest(args);
                    recordRecentAction(userId, 'Send Friend Request');
                }
            },
            Unfriend: {
                confirm: () => ({
                    title: t('confirm.title'),
                    description: t('confirm.command_question', {
                        command: t('dialog.user.actions.unfriend')
                    }),
                    destructive: true
                }),
                handler: async (userId) => {
                    const args = await friendRequest.deleteFriend(
                        {
                            userId
                        },
                        t('dialog.user.actions.unfriend_success_msg')
                    );
                    handleFriendDelete(args);
                }
            }
        };
    }

    const commandMap = buildCommandMap();

    // Callbacks for string-type commands (delegated to component)
    let componentCallbacks = {};

    /**
     * Register component-level callbacks for string-type commands.
     * These are simple dialog openers that stay in the component.
     *
     * @param {object} callbacks
     */
    function registerCallbacks(callbacks) {
        componentCallbacks = callbacks;
    }

    /**
     * Dispatch a user dialog command.
     *
     * @param {string} command
     */
    function userDialogCommand(command) {
        const D = userDialog.value;
        if (D.visible === false) {
            return;
        }

        const entry = commandMap[command];

        if (!entry) {
            return;
        }

        // String entry => delegate to component callback
        if (typeof entry === 'string') {
            const cb = componentCallbacks[entry];
            if (cb) {
                cb();
            }
            return;
        }

        // Direct function
        if (typeof entry === 'function') {
            entry();
            return;
        }

        // Confirmed command
        if (entry.confirm) {
            modalStore
                .confirm(entry.confirm())
                .then(({ ok }) => {
                    if (ok) {
                        entry.handler(D.id);
                    }
                })
                .catch(() => {});
        }
    }

    return {
        userDialogCommand,
        registerCallbacks
    };
}
