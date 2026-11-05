import wfc from "../../wfc/client/wfc";
import EventType from '../../wfc/client/wfcEvent.js';
import {bindWfcEvents, unbindWfcEvents} from "../../utils/wfcEvents";
import {toUserDetail} from "../../utils/nav";
import {sortByName, userItem} from "../../utils/display";
import {updateTabBarBadges} from "../../utils/badge";

/**
 * 通讯录
 */
Page({
    data: {
        friends: [],
        favFriends: [],
        friendRequestCount: 0,
    },

    onLoad() {
        bindWfcEvents(this, {
            [EventType.UserInfosUpdate]: 'scheduleRefresh',
            [EventType.FriendListUpdate]: 'scheduleRefresh',
            [EventType.FriendRequestUpdate]: 'scheduleRefresh',
            [EventType.SettingUpdate]: 'scheduleRefresh',
        });
    },

    onUnload() {
        clearTimeout(this.refreshTimer);
        unbindWfcEvents(this);
    },

    onShow() {
        this.showFriendList();
    },

    scheduleRefresh() {
        clearTimeout(this.refreshTimer);
        this.refreshTimer = setTimeout(() => this.showFriendList(), 100);
    },

    showFriendList() {
        let friends = wfc.getMyFriendList(false).map(uid => userItem(uid));
        sortByName(friends);
        let favUids = new Set(wfc.getFavUsers() || []);
        let favFriends = friends.filter(f => favUids.has(f.uid));
        let friendRequestCount = wfc.getUnreadFriendRequestCount();
        this.setData({friends, favFriends, friendRequestCount});
        updateTabBarBadges();
    },

    onFriendTap(e) {
        toUserDetail(e.currentTarget.dataset.uid);
    },

    navigateTo(e) {
        wx.navigateTo({url: e.currentTarget.dataset.url});
    },
});
