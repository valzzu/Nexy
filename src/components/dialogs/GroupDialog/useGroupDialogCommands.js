import { copyToClipboard } from '../../../shared/utils';

/**
 * Composable for GroupDialog command dispatch.
 *
 * @param {import('vue').Ref} groupDialog - Reactive ref to the group dialog state
 * @param {object} deps - External dependencies
 * @param deps.showGroupDialog
 * @param deps.leaveGroupPrompt
 * @param deps.showPreviousInstancesListDialog
 * @param deps.showGroupPostEditDialog
 * @returns {object} Command composable API
 */
export function useGroupDialogCommands(
    groupDialog,
    { showGroupDialog, leaveGroupPrompt, showPreviousInstancesListDialog, showGroupPostEditDialog }
) {
    function buildCommandMap() {
        const D = () => groupDialog.value;

        return {
            'Copy Group Name': () => {
                copyToClipboard(D().ref.name);
            },
            'Copy Group ID': () => {
                copyToClipboard(D().id);
            },
            'Create Post': () => {
                showGroupPostEditDialog(D().id, null);
            },
            Refresh: () => {
                showGroupDialog(D().id, { forceRefresh: true });
            },
            'Previous Instances': () => {
                showPreviousInstancesListDialog(D().ref);
            },
            'Leave Group': () => {
                leaveGroupPrompt(D().id);
            }
        };
    }

    const commandMap = buildCommandMap();

    /**
     * Dispatch a group dialog command.
     *
     * @param {string} command
     */
    function groupDialogCommand(command) {
        if (groupDialog.value.visible === false) {
            return;
        }
        commandMap[command]?.();
    }

    return {
        groupDialogCommand
    };
}
