/**
 * Composable for WorldDialog commands.
 *
 * @param {import('vue').Ref} worldDialog - Reactive ref to the world dialog state
 * @param {object} deps - External dependencies
 * @param {Function} deps.t - I18n translation function
 * @param {{ success: Function; error: Function }} deps.toast - Toast notification API
 * @param {Function} deps.showWorldDialog - Function to show world dialog
 * @param {Function} deps.showPreviousInstancesListDialog - Function to show previous instances
 * @returns {object} Commands composable API
 */
export function useWorldDialogCommands(
    worldDialog,
    { t, toast, showWorldDialog, showPreviousInstancesListDialog: openPreviousInstancesListDialog }
) {
    function copyWorldUrl() {
        navigator.clipboard
            .writeText(`https://nexvr.net/worlds/${worldDialog.value.id}`)
            .then(() => {
                toast.success(t('message.world.url_copied'));
            })
            .catch((err) => {
                console.error('copy failed:', err);
                toast.error(t('message.copy_failed'));
            });
    }

    function copyWorldName() {
        navigator.clipboard
            .writeText(worldDialog.value.ref.name)
            .then(() => {
                toast.success(t('message.world.name_copied'));
            })
            .catch((err) => {
                console.error('copy failed:', err);
                toast.error(t('message.copy_failed'));
            });
    }

    function copyWorldId() {
        navigator.clipboard
            .writeText(worldDialog.value.id)
            .then(() => {
                toast.success(t('message.world.id_copied'));
            })
            .catch((err) => {
                console.error('copy failed:', err);
                toast.error(t('message.copy_failed'));
            });
    }

    /**
     * @param worldRef
     */
    function showPreviousInstancesListDialog(worldRef) {
        openPreviousInstancesListDialog('world', worldRef);
    }

    function buildCommandMap() {
        const D = () => worldDialog.value;

        return {
            Refresh: () => {
                const { tag, shortName } = D().$location;
                showWorldDialog(tag, shortName, { forceRefresh: true });
            },
            Share: () => {
                copyWorldUrl();
            },
            'Copy World Name': () => {
                copyWorldName();
            },
            'Copy World ID': () => {
                copyWorldId();
            },
            'Previous Instances': () => {
                showPreviousInstancesListDialog(D().ref);
            }
        };
    }

    const commandMap = buildCommandMap();

    /**
     * Dispatch a world dialog command.
     *
     * @param {string} command
     */
    function worldDialogCommand(command) {
        const D = worldDialog.value;
        if (D.visible === false) {
            return;
        }

        const entry = commandMap[command];
        if (entry) {
            entry();
        }
    }

    return {
        worldDialogCommand,
        copyWorldUrl,
        copyWorldName,
        copyWorldId,
        showPreviousInstancesListDialog
    };
}
