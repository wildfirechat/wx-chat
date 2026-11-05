import wfc from "../../wfc/client/wfc";
import EventType from "../../wfc/client/wfcEvent";
import {bindWfcEvents, unbindWfcEvents} from "../../utils/wfcEvents";
import {toUserDetail} from "../../utils/nav";
import {userItem} from "../../utils/display";
import {confirm, toast} from "../../utils/ui";

/**
 * 黑名单
 */
Page({
    data: {
        users: [],
    },

    onLoad() {
        bindWfcEvents(this, {
            [EventType.SettingUpdate]: 'refresh',
            [EventType.FriendListUpdate]: 'refresh',
            [EventType.UserInfosUpdate]: 'refresh',
        });
    },

    onShow() {
        this.refresh();
    },

    onUnload() {
        unbindWfcEvents(this);
    },

    refresh() {
        this.setData({users: (wfc.getBlackList() || []).map(uid => userItem(uid))});
    },

    onUserTap(e) {
        toUserDetail(e.currentTarget.dataset.uid);
    },

    async onRemove(e) {
        let uid = e.currentTarget.dataset.uid;
        let ok = await confirm('移出黑名单', `确定将 ${wfc.getUserDisplayName(uid)} 移出黑名单？`);
        if (!ok) {
            return;
        }
        wfc.setBlackList(uid, false, () => this.refresh(), errorCode => toast('操作失败 ' + errorCode));
    },
});
