import wfc from "../../wfc/client/wfc";
import EventType from "../../wfc/client/wfcEvent";
import GroupMemberType from "../../wfc/model/groupMemberType";
import ModifyGroupInfoType from "../../wfc/model/modifyGroupInfoType";
import {bindWfcEvents, unbindWfcEvents} from "../../utils/wfcEvents";
import {pickUsers} from "../../utils/nav";
import {userItem} from "../../utils/display";
import {confirm, hideLoading, showActionMenu, showLoading, toast} from "../../utils/ui";
import * as perm from "../../utils/groupPermission";

/**
 * 群管理：全员禁言、禁言成员、管理员、转让群主
 */
Page({
    data: {
        isOwner: false,
        muteAll: false,
        managers: [],
        mutedMembers: [],
    },

    onLoad(options) {
        this.groupId = decodeURIComponent(options.groupId);
        bindWfcEvents(this, {
            [EventType.GroupInfosUpdate]: 'refresh',
            [EventType.GroupMembersUpdate]: 'refresh',
            [EventType.UserInfosUpdate]: 'refresh',
        });
        this.refresh();
    },

    onUnload() {
        unbindWfcEvents(this);
    },

    refresh() {
        let groupInfo = wfc.getGroupInfo(this.groupId, false);
        this.groupInfo = groupInfo;
        if (!perm.isManagerOrOwner(groupInfo)) {
            // 可能已经被取消管理员或者转让了群主
            this.leave();
            return;
        }
        this.setData({
            isOwner: perm.isOwner(groupInfo),
            muteAll: groupInfo.mute === 1,
            managers: wfc.getGroupMembersByType(this.groupId, GroupMemberType.Manager).map(m => userItem(m.memberId, this.groupId)),
            mutedMembers: wfc.getGroupMembersByType(this.groupId, GroupMemberType.Muted).map(m => userItem(m.memberId, this.groupId)),
        });
    },

    leave() {
        let pages = getCurrentPages();
        if (!this.leaving && pages[pages.length - 1] === this) {
            this.leaving = true;
            wx.navigateBack();
        }
    },

    _excludesForManagerOps() {
        let excludes = [wfc.getUserId(), this.groupInfo.owner];
        wfc.getGroupMembersByType(this.groupId, GroupMemberType.Manager).forEach(m => excludes.push(m.memberId));
        return excludes;
    },

    onMuteAllChange(e) {
        let mute = e.detail.value;
        wfc.modifyGroupInfo(this.groupId, ModifyGroupInfoType.Modify_Group_Mute, mute ? '1' : '0', [0], null, () => {
            this.setData({muteAll: mute});
        }, errorCode => {
            this.setData({muteAll: !mute});
            toast('设置失败 ' + errorCode);
        });
    },

    async onAddManager() {
        let uids = await pickUsers({
            title: '添加管理员',
            source: 'group',
            groupId: this.groupId,
            excludes: this._excludesForManagerOps(),
        });
        if (uids.length === 0) {
            return;
        }
        showLoading();
        wfc.setGroupManager(this.groupId, true, uids, [0], null, () => {
            hideLoading();
            this.refresh();
        }, errorCode => {
            hideLoading();
            toast('设置失败 ' + errorCode);
        });
    },

    onManagerTap(e) {
        if (!this.data.isOwner) {
            return;
        }
        let uid = e.currentTarget.dataset.uid;
        showActionMenu([{
            label: '取消管理员',
            action: () => {
                wfc.setGroupManager(this.groupId, false, [uid], [0], null, () => this.refresh(), errorCode => toast('设置失败 ' + errorCode));
            }
        }]);
    },

    async onAddMuted() {
        let uids = await pickUsers({
            title: '选择禁言成员',
            source: 'group',
            groupId: this.groupId,
            excludes: this._excludesForManagerOps(),
            disabled: this.data.mutedMembers.map(m => m.uid),
        });
        if (uids.length === 0) {
            return;
        }
        wfc.muteGroupMembers(this.groupId, true, uids, [0], null, () => this.refresh(), errorCode => toast('禁言失败 ' + errorCode));
    },

    onMutedTap(e) {
        let uid = e.currentTarget.dataset.uid;
        showActionMenu([{
            label: '解除禁言',
            action: () => {
                wfc.muteGroupMembers(this.groupId, false, [uid], [0], null, () => this.refresh(), errorCode => toast('操作失败 ' + errorCode));
            }
        }]);
    },

    async onTransferOwner() {
        let uids = await pickUsers({
            title: '选择新群主',
            source: 'group',
            groupId: this.groupId,
            multi: false,
            excludes: [wfc.getUserId()],
        });
        if (uids.length === 0) {
            return;
        }
        let name = wfc.getGroupMemberDisplayName(this.groupId, uids[0]);
        let ok = await confirm('转让群主', `确定将群主转让给 ${name}？转让后你将成为普通成员`, '转让', '#fa5151');
        if (!ok) {
            return;
        }
        showLoading();
        wfc.transferGroup(this.groupId, uids[0], [0], null, () => {
            hideLoading();
            toast('已转让', 'success');
            setTimeout(() => this.leave(), 800);
        }, errorCode => {
            hideLoading();
            toast('转让失败 ' + errorCode);
        });
    },
});
