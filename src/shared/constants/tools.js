const toolCategories = [
    { key: 'shortcuts', labelKey: 'view.tools.shortcuts.header' },
    { key: 'system', labelKey: 'view.tools.system_tools.header' },
    { key: 'user', labelKey: 'view.tools.export.header' }
];

const toolDefinitions = [
    {
        key: 'vrcx-data',
        category: 'shortcuts',
        iconKey: 'folder-cog',
        navIcon: 'ri-folder-settings-line',
        titleKey: 'view.tools.shortcuts.vrcx_data',
        descriptionKey: 'view.tools.shortcuts.vrcx_data_description',
        navEligible: true,
        action: {
            type: 'app-api',
            method: 'OpenVrcxAppDataFolder',
            successMessageKey: 'message.file.folder_opened',
            errorMessageKey: 'message.file.folder_missing'
        }
    },
    {
        key: 'auto-change-status',
        category: 'system',
        iconKey: 'bot',
        navIcon: 'ri-user-settings-line',
        titleKey: 'view.settings.general.automation.auto_change_status',
        descriptionKey: 'view.settings.general.automation.auto_state_change_tooltip',
        navEligible: true,
        action: { type: 'dialog', dialogKey: 'auto-change-status' }
    },
    {
        key: 'discord-names',
        category: 'user',
        iconKey: 'users',
        navIcon: 'ri-discord-line',
        titleKey: 'view.tools.export.discord_names',
        descriptionKey: 'view.tools.user.discord_names_description',
        navEligible: true,
        action: { type: 'dialog', dialogKey: 'export-discord-names' }
    },
    {
        key: 'export-friend-list',
        category: 'user',
        iconKey: 'users',
        navIcon: 'ri-file-list-3-line',
        titleKey: 'view.tools.export.export_friend_list',
        descriptionKey: 'view.tools.user.export_friend_list_description',
        navEligible: true,
        action: { type: 'dialog', dialogKey: 'export-friends-list' }
    }
];

const toolDefinitionMap = new Map(toolDefinitions.map((tool) => [tool.key, tool]));

const toolNavDefinitions = toolDefinitions
    .filter((tool) => tool.navEligible)
    .map((tool) => ({
        key: `tool-${tool.key}`,
        icon: tool.navIcon,
        tooltip: tool.titleKey,
        labelKey: tool.titleKey,
        routeName: tool.action.type === 'route' ? tool.action.routeName : null,
        action:
            tool.action.type === 'route'
                ? null
                : {
                      type: 'tool',
                      toolKey: tool.key
                  },
        defaultHidden: true
    }));

const defaultHiddenToolNavKeys = toolNavDefinitions.map((tool) => tool.key);
const isToolNavKey = (key) => typeof key === 'string' && key.startsWith('tool-');

function getToolsByCategory(categoryKey) {
    return toolDefinitions.filter((tool) => tool.category === categoryKey);
}

export {
    defaultHiddenToolNavKeys,
    isToolNavKey,
    toolCategories,
    toolDefinitions,
    toolDefinitionMap,
    toolNavDefinitions,
    getToolsByCategory
};
