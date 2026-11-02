import { defineAsyncComponent } from 'vue';

import Feed from '../../Feed/Feed.vue';
import FriendList from '../../FriendList/FriendList.vue';
import FriendLog from '../../FriendLog/FriendLog.vue';
import FriendsLocations from '../../FriendsLocations/FriendsLocations.vue';
import GameLog from '../../GameLog/GameLog.vue';
import Moderation from '../../Moderation/Moderation.vue';
import Notification from '../../Notifications/Notification.vue';
import PlayerList from '../../PlayerList/PlayerList.vue';
import Search from '../../Search/Search.vue';
import Tools from '../../Tools/Tools.vue';

export const panelComponentMap = {
    feed: Feed,
    'friends-locations': FriendsLocations,
    'game-log': GameLog,
    'player-list': PlayerList,
    search: Search,
    'friend-log': FriendLog,
    'friend-list': FriendList,
    moderation: Moderation,
    notification: Notification,
    'charts-instance': defineAsyncComponent(() => import('../../Charts/components/InstanceActivity.vue')),
    'charts-hot-worlds': defineAsyncComponent(() => import('../../Charts/components/HotWorlds.vue')),
    tools: Tools,
    'widget:feed': defineAsyncComponent(() => import('../widgets/FeedWidget.vue')),
    'widget:game-log': defineAsyncComponent(() => import('../widgets/GameLogWidget.vue')),
    'widget:instance': defineAsyncComponent(() => import('../widgets/InstanceWidget.vue'))
};
