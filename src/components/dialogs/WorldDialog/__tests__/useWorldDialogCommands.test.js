import { describe, expect, test, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useWorldDialogCommands } from '../useWorldDialogCommands';

function createWorldDialog(overrides = {}) {
    return ref({
        id: 'wrld_123',
        visible: true,
        loading: false,
        isFavorite: false,
        $location: {
            tag: 'wrld_123:12345~region(us)',
            shortName: 'Test World'
        },
        ref: {
            name: 'Test World',
            authorId: 'usr_author'
        },
        ...overrides
    });
}

function createDeps(overrides = {}) {
    return {
        t: vi.fn((key) => key),
        toast: {
            success: vi.fn(),
            error: vi.fn()
        },
        showWorldDialog: vi.fn(),
        showPreviousInstancesListDialog: vi.fn(),
        ...overrides
    };
}

describe('useWorldDialogCommands', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        Object.defineProperty(navigator, 'clipboard', {
            value: { writeText: vi.fn().mockResolvedValue(undefined) },
            writable: true,
            configurable: true
        });
    });

    describe('worldDialogCommand', () => {
        test('returns early when dialog is not visible', () => {
            const worldDialog = createWorldDialog({ visible: false });
            const deps = createDeps();
            const { worldDialogCommand } = useWorldDialogCommands(worldDialog, deps);

            worldDialogCommand('Refresh');
            expect(deps.showWorldDialog).not.toHaveBeenCalled();
        });

        test('Refresh command calls showWorldDialog with forceRefresh', () => {
            const worldDialog = createWorldDialog();
            const deps = createDeps();
            const { worldDialogCommand } = useWorldDialogCommands(worldDialog, deps);

            worldDialogCommand('Refresh');
            expect(deps.showWorldDialog).toHaveBeenCalledWith(
                worldDialog.value.$location.tag,
                worldDialog.value.$location.shortName,
                { forceRefresh: true }
            );
        });

        test('Previous Instances calls showPreviousInstancesListDialog', () => {
            const worldDialog = createWorldDialog();
            const deps = createDeps();
            const { worldDialogCommand } = useWorldDialogCommands(worldDialog, deps);

            worldDialogCommand('Previous Instances');
            expect(deps.showPreviousInstancesListDialog).toHaveBeenCalledWith('world', worldDialog.value.ref);
        });

        test('Share copies world URL', () => {
            const worldDialog = createWorldDialog();
            const { worldDialogCommand } = useWorldDialogCommands(worldDialog, createDeps());

            worldDialogCommand('Share');
            expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://nexvr.net/worlds/wrld_123');
        });

        test('unknown commands do nothing', () => {
            const worldDialog = createWorldDialog();
            const deps = createDeps();
            const { worldDialogCommand } = useWorldDialogCommands(worldDialog, deps);

            worldDialogCommand('Publish');
            expect(deps.showWorldDialog).not.toHaveBeenCalled();
            expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
        });
    });

    describe('clipboard operations', () => {
        test('copyWorldName writes world name', async () => {
            const { copyWorldName } = useWorldDialogCommands(createWorldDialog(), createDeps());

            copyWorldName();
            await vi.waitFor(() => {
                expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Test World');
            });
        });

        test('copyWorldId writes world id', async () => {
            const { copyWorldId } = useWorldDialogCommands(createWorldDialog(), createDeps());

            copyWorldId();
            await vi.waitFor(() => {
                expect(navigator.clipboard.writeText).toHaveBeenCalledWith('wrld_123');
            });
        });
    });
});
