import wfc from "../../wfc/client/wfc";
import EventType from "../../wfc/client/wfcEvent";
import GroupMemberType from "../../wfc/model/groupMemberType";
import {bindWfcEvents, unbindWfcEvents} from "../../utils/wfcEvents";
import {toUserDetail} from "../../utils/nav";
import {userItem} from "../../utils/display";

/**
 * 群成员列表
 */
Page({
    data: {
        items: [],
        keyword: '',
    },

    onLoad(options) {
        this.groupId = decodeURIComponent(options.groupId);
        bindWfcEvents(this, {
            [EventType.GroupMembersUpdate]: 'refresh',
            [EventType.UserInfosUpdate]: 'refresh',
        });
        this.refresh();
    },

    onUnload() {
        unbindWfcEvents(this);
    },

    refresh() {
        let members = wfc.getGroupMembers(this.groupId, false).filter(m => m.type !== GroupMemberType.Removed);
        let roleOrder = {[GroupMemberType.Owner]: 0, [GroupMemberType.Manager]: 1};
        members.sort((a, b) => {
            let oa = roleOrder[a.type] !== undefined ? roleOrder[a.type] : 2;
            let ob = roleOrder[b.type] !== undefined ? roleOrder[b.type] : 2;
            return oa - ob;
        });
        this.allItems = members.map(m => {
            let item = userItem(m.memberId, this.groupId);
            item.role = m.type === GroupMemberType.Owner ? '群主' : (m.type === GroupMemberType.Manager ? '管理员' : (m.type === GroupMemberType.Muted ? '已禁言' : ''));
            return item;
        });
        wx.setNavigationBarTitle({title: `群成员(${this.allItems.length})`});
        this.filter(this.data.keyword);
    },

    filter(keyword) {
        let items = keyword ? this.allItems.filter(i => (i.name || '').toLowerCase().indexOf(keyword) >= 0) : this.allItems;
        this.setData({items, keyword});
    },

    onSearchInput(e) {
        this.filter((e.detail.value || '').trim().toLowerCase());
    },

    onMemberTap(e) {
        toUserDetail(e.currentTarget.dataset.uid, this.groupId);
    },
});
