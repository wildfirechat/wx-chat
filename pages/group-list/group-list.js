import wfc from "../../wfc/client/wfc";
import EventType from "../../wfc/client/wfcEvent";
import Conversation from "../../wfc/model/conversation";
import ConversationType from "../../wfc/model/conversationType";
import {bindWfcEvents, unbindWfcEvents} from "../../utils/wfcEvents";
import {toChat} from "../../utils/nav";
import {groupPortraitOrDefault, sortByName} from "../../utils/display";

/**
 * 群聊列表：保存到通讯录的群
 */
Page({
    data: {
        groups: [],
    },

    onLoad() {
        bindWfcEvents(this, {
            [EventType.GroupInfosUpdate]: 'refresh',
            [EventType.SettingUpdate]: 'refresh',
        });
    },

    onShow() {
        this.refresh();
    },

    onUnload() {
        unbindWfcEvents(this);
    },

    refresh() {
        let groups = (wfc.getFavGroupList() || []).map(g => ({
            groupId: g.target,
            name: g.remark || g.name || '群聊',
            portrait: groupPortraitOrDefault(g.portrait),
            memberCount: g.memberCount || 0,
        }));
        this.setData({groups: sortByName(groups)});
    },

    onGroupTap(e) {
        toChat(new Conversation(ConversationType.Group, e.currentTarget.dataset.id, 0));
    },
});
