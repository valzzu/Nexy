import { toolNavDefinitions } from './tools';

const navDefinitions = [
    {
        key: 'feed',
        icon: 'ri-rss-line',
        tooltip: 'nav_tooltip.feed',
        labelKey: 'nav_tooltip.feed',
        routeName: 'feed'
    },
    {
        key: 'friends-locations',
        icon: 'ri-user-location-line',
        tooltip: 'nav_tooltip.friends_locations',
        labelKey: 'nav_tooltip.friends_locations',
        routeName: 'friends-locations'
    },
    {
        key: 'game-log',
        icon: 'ri-history-line',
        tooltip: 'nav_tooltip.game_log',
        labelKey: 'nav_tooltip.game_log',
        routeName: 'game-log'
    },
    {
        key: 'player-list',
        icon: 'ri-group-3-line',
        tooltip: 'nav_tooltip.player_list',
        labelKey: 'nav_tooltip.player_list',
        routeName: 'player-list'
    },
    {
        key: 'search',
        icon: 'ri-search-line',
        tooltip: 'nav_tooltip.search',
        labelKey: 'nav_tooltip.search',
        routeName: 'search'
    },
    {
        key: 'friend-log',
        icon: 'ri-contacts-line',
        tooltip: 'nav_tooltip.friend_log',
        labelKey: 'nav_tooltip.friend_log',
        routeName: 'friend-log'
    },
    {
        key: 'friend-list',
        icon: 'ri-booklet-line',
        tooltip: 'nav_tooltip.friend_list',
        labelKey: 'nav_tooltip.friend_list',
        routeName: 'friend-list'
    },
    {
        key: 'moderation',
        icon: 'ri-shield-user-line',
        tooltip: 'nav_tooltip.moderation',
        labelKey: 'nav_tooltip.moderation',
        routeName: 'moderation'
    },
    {
        key: 'notification',
        icon: 'ri-notification-2-line',
        tooltip: 'nav_tooltip.notification',
        labelKey: 'nav_tooltip.notification',
        routeName: 'notification'
    },
    {
        key: 'charts-instance',
        icon: 'ri-bar-chart-horizontal-line',
        tooltip: 'view.charts.instance_activity.header',
        labelKey: 'view.charts.instance_activity.header',
        routeName: 'charts-instance'
    },
    {
        key: 'charts-hot-worlds',
        icon: 'ri-fire-line',
        tooltip: 'view.charts.hot_worlds.tab_label',
        labelKey: 'view.charts.hot_worlds.tab_label',
        routeName: 'charts-hot-worlds'
    },
    {
        key: 'tools',
        icon: 'ri-tools-line',
        tooltip: 'nav_tooltip.tools',
        labelKey: 'nav_tooltip.tools',
        routeName: 'tools'
    },
    ...toolNavDefinitions
];

export { navDefinitions };
