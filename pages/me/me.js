import wfc from "../../wfc/client/wfc";
import EventType from "../../wfc/client/wfcEvent";
import {bindWfcEvents, unbindWfcEvents} from "../../utils/wfcEvents";
import {portraitOrDefault} from "../../utils/display";
import {updateTabBarBadges} from "../../utils/badge";

/**
 * 我
 */
Page({
    data: {
        user: {},
    },

    onLoad() {
        bindWfcEvents(this, {
            [EventType.UserInfosUpdate]: 'loadUserInfo',
        });
    },

    onUnload() {
        unbindWfcEvents(this);
    },

    onShow() {
        this.loadUserInfo();
        updateTabBarBadges();
    },

    loadUserInfo() {
        let userInfo = wfc.getUserInfo(wfc.getUserId(), false);
        this.setData({
            user: {
                portrait: portraitOrDefault(userInfo.portrait),
                displayName: userInfo.displayName || '',
                account: userInfo.name || '',
            }
        });
    },

    navigateTo(e) {
        wx.navigateTo({url: e.currentTarget.dataset.url});
    },
});
