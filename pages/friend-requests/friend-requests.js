import wfc from "../../wfc/client/wfc";
import EventType from "../../wfc/client/wfcEvent";
import {numberValue} from "../../wfc/util/longUtil";
import {bindWfcEvents, unbindWfcEvents} from "../../utils/wfcEvents";
import {toUserDetail} from "../../utils/nav";
import {portraitOrDefault} from "../../utils/display";
import {timeFormat} from "../../utils/time";
import {hideLoading, showLoading, toast} from "../../utils/ui";

const MAX_COUNT = 50;

/**
 * 新的朋友(收到的好友请求)
 * status: 0 待处理；1 已接受；3 已拒绝
 */
Page({
    data: {
        friendRequests: []
    },

    onLoad() {
        bindWfcEvents(this, {
            [EventType.FriendRequestUpdate]: 'loadFriendRequests',
            [EventType.FriendListUpdate]: 'loadFriendRequests',
            [EventType.UserInfosUpdate]: 'loadFriendRequests',
        });
        wfc.loadFriendRequestFromRemote();
        this.loadFriendRequests();
    },

    onShow() {
        wfc.clearUnreadFriendRequestStatus();
    },

    onUnload() {
        unbindWfcEvents(this);
        wfc.clearUnreadFriendRequestStatus();
    },

    loadFriendRequests() {
        let requests = wfc.getIncommingFriendRequest() || [];
        requests.sort((a, b) => numberValue(b.timestamp) - numberValue(a.timestamp));
        requests = requests.slice(0, MAX_COUNT);
        let userInfos = wfc.getUserInfos(requests.map(r => r.target), '');
        let items = requests.map(r => {
            let userInfo = userInfos.find(u => u.uid === r.target) || {};
            return {
                uid: r.target,
                name: userInfo.displayName || r.target,
                portrait: portraitOrDefault(userInfo.portrait),
                reason: r.reason || '',
                status: r.status,
                time: timeFormat(r.timestamp),
            };
        });
        this.setData({friendRequests: items});
    },

    onItemTap(e) {
        toUserDetail(e.currentTarget.dataset.uid);
    },

    acceptRequest(e) {
        this.handleRequest(e.currentTarget.dataset.uid, true);
    },

    declineRequest(e) {
        this.handleRequest(e.currentTarget.dataset.uid, false);
    },

    handleRequest(uid, accept) {
        showLoading();
        wfc.handleFriendRequest(uid, accept, '', () => {
            hideLoading();
            toast(accept ? '已添加' : '已拒绝');
            this.loadFriendRequests();
        }, errorCode => {
            hideLoading();
            toast((accept ? '接受' : '拒绝') + '好友请求失败 ' + errorCode);
        });
    },
});
