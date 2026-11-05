import wfc from "../../wfc/client/wfc";
import EventType from "../../wfc/client/wfcEvent";
import ConversationType from "../../wfc/model/conversationType";
import GroupMemberType from "../../wfc/model/groupMemberType";
import ModifyGroupInfoType from "../../wfc/model/modifyGroupInfoType";
import MessageContentMediaType from "../../wfc/messages/messageContentMediaType";
import {bindWfcEvents, unbindWfcEvents} from "../../utils/wfcEvents";
import {parseConversation, pickUsers, toUserDetail} from "../../utils/nav";
import {groupPortraitOrDefault, userItem} from "../../utils/display";
import {confirm, hideLoading, prompt, showActionMenu, showLoading, toast} from "../../utils/ui";
import {uploadFile} from "../../utils/media";
import * as perm from "../../utils/groupPermission";
import AppServerApi from "../../utils/appServerApi";
import {createGroupAndChat} from "../../utils/group";

// 群成员宫格最多显示的成员数
const MAX_GRID_MEMBERS = 18;

/**
 * 会话信息页面，单聊和群聊
 */
Page({
    data: {
        isGroup: false,
        isMember: true,
        members: [],
        memberCount: 0,
        hasMoreMembers: false,
        canAdd: false,
        canRemove: false,
        canModify: false,
        canModifyAnnouncement: false,
        isManager: false,
        canDismiss: false,
        canQuit: false,
        groupName: '',
        groupPortrait: '',
        groupRemark: '',
        announcement: '',
        myAlias: '',
        isSilent: false,
        isTop: false,
        isFav: false,
    },

    onLoad(options) {
        this.conversation = parseConversation(options.conversation);
        let isGroup = this.conversation.type === ConversationType.Group;
        this.setData({isGroup});
        wx.setNavigationBarTitle({title: isGroup ? '群聊信息' : '聊天信息'});

        bindWfcEvents(this, {
            [EventType.GroupInfosUpdate]: 'scheduleRefresh',
            [EventType.GroupMembersUpdate]: 'scheduleRefresh',
            [EventType.UserInfosUpdate]: 'scheduleRefresh',
            [EventType.ConversationInfoUpdate]: 'scheduleRefresh',
            [EventType.SettingUpdate]: 'scheduleRefresh',
        });
        this.refresh();
        if (isGroup) {
            // 刷新群信息和群成员，有更新时会通过事件通知
            wfc.getGroupInfo(this.conversation.target, true);
            wfc.getGroupMembers(this.conversation.target, true);
            this.loadAnnouncement();
        }
    },

    onUnload() {
        clearTimeout(this.refreshTimer);
        unbindWfcEvents(this);
    },

    scheduleRefresh() {
        clearTimeout(this.refreshTimer);
        this.refreshTimer = setTimeout(() => this.refresh(), 100);
    },

    refresh() {
        let conversationInfo = wfc.getConversationInfo(this.conversation);
        let data = {
            isSilent: !!(conversationInfo && conversationInfo.isSilent),
            isTop: !!(conversationInfo && conversationInfo.top),
        };
        if (this.data.isGroup) {
            Object.assign(data, this._groupData());
        } else {
            data.members = [userItem(this.conversation.target)];
        }
        this.setData(data);
    },

    _groupData() {
        let groupId = this.conversation.target;
        let groupInfo = wfc.getGroupInfo(groupId, false);
        this.groupInfo = groupInfo;
        let members = wfc.getGroupMembers(groupId, false).filter(m => m.type !== GroupMemberType.Removed);
        // 群主、管理员排在前面
        let order = {[GroupMemberType.Owner]: 0, [GroupMemberType.Manager]: 1};
        members.sort((a, b) => {
            let oa = order[a.type] !== undefined ? order[a.type] : 2;
            let ob = order[b.type] !== undefined ? order[b.type] : 2;
            return oa - ob;
        });
        this.memberIds = members.map(m => m.memberId);
        let selfMember = members.find(m => m.memberId === wfc.getUserId());
        // 群成员还没有加载时，先按群成员处理，避免误显示“删除聊天”
        let isMember = members.length === 0 || !!selfMember;
        let canAdd = isMember && perm.canAddMember(groupInfo);
        let canRemove = isMember && perm.canRemoveMember(groupInfo);
        let gridCount = MAX_GRID_MEMBERS - (canAdd ? 1 : 0) - (canRemove ? 1 : 0);
        return {
            isMember,
            members: members.slice(0, gridCount).map(m => userItem(m.memberId, groupId)),
            memberCount: members.length,
            hasMoreMembers: members.length > gridCount,
            canAdd,
            canRemove,
            canModify: isMember && perm.canModifyGroupInfo(groupInfo),
            canModifyAnnouncement: isMember && perm.canModifyAnnouncement(groupInfo),
            isManager: isMember && perm.isManagerOrOwner(groupInfo),
            canDismiss: isMember && perm.canDismiss(groupInfo),
            canQuit: isMember && perm.canQuit(groupInfo),
            groupName: groupInfo.name || '',
            groupPortrait: groupPortraitOrDefault(groupInfo.portrait),
            groupRemark: groupInfo.remark || '',
            myAlias: selfMember && selfMember.alias ? selfMember.alias : '',
            isFav: wfc.isFavGroup(groupId),
        };
    },

    loadAnnouncement() {
        AppServerApi.getGroupAnnouncement(this.conversation.target)
            .then(result => {
                this.setData({announcement: result && result.text ? result.text : ''});
            })
            .catch(e => {
                console.log('getGroupAnnouncement error', e);
            });
    },

    // ==================== 成员 ====================

    onMemberTap(e) {
        let uid = e.currentTarget.dataset.uid;
        toUserDetail(uid, this.data.isGroup ? this.conversation.target : '');
    },

    onViewAllMembers() {
        wx.navigateTo({url: `/pages/group-members/group-members?groupId=${encodeURIComponent(this.conversation.target)}`});
    },

    async onAddMember() {
        let selfUid = wfc.getUserId();
        if (!this.data.isGroup) {
            // 单聊中添加成员，创建群聊
            let peer = this.conversation.target;
            let uids = await pickUsers({title: '发起群聊', excludes: [peer, selfUid]});
            if (uids.length > 0) {
                createGroupAndChat([peer].concat(uids), true);
            }
            return;
        }

        let groupId = this.conversation.target;
        let uids = await pickUsers({
            title: '添加群成员',
            disabled: this.memberIds || [],
        });
        if (uids.length === 0) {
            return;
        }
        showLoading();
        wfc.addGroupMembers(groupId, uids, '', [0], null, () => {
            hideLoading();
            toast('已添加', 'success');
            wfc.getGroupMembers(groupId, true);
        }, errorCode => {
            hideLoading();
            toast('添加失败 ' + errorCode);
        });
    },

    async onRemoveMember() {
        let groupId = this.conversation.target;
        let groupInfo = this.groupInfo;
        let excludes = [wfc.getUserId(), groupInfo.owner];
        if (!perm.isOwner(groupInfo)) {
            // 管理员不能移除其他管理员
            wfc.getGroupMembersByType(groupId, GroupMemberType.Manager).forEach(m => excludes.push(m.memberId));
        }
        let uids = await pickUsers({
            title: '移除群成员',
            source: 'group',
            groupId,
            excludes,
            confirmText: '移除',
        });
        if (uids.length === 0) {
            return;
        }
        let ok = await confirm('移除群成员', `确定移除选中的${uids.length}位成员？`, '移除', '#fa5151');
        if (!ok) {
            return;
        }
        showLoading();
        wfc.kickoffGroupMembers(groupId, uids, [0], null, () => {
            hideLoading();
            toast('已移除', 'success');
        }, errorCode => {
            hideLoading();
            toast('移除失败 ' + errorCode);
        });
    },

    // ==================== 群信息 ====================

    async onEditGroupName() {
        if (!this.data.canModify) {
            return;
        }
        let name = await prompt('修改群聊名称', '群聊名称', this.data.groupName);
        if (name === null || name === this.data.groupName) {
            return;
        }
        if (!name) {
            toast('群名称不能为空');
            return;
        }
        wfc.modifyGroupInfo(this.conversation.target, ModifyGroupInfoType.Modify_Group_Name, name, [0], null, () => {
            this.setData({groupName: name});
        }, errorCode => toast('修改失败 ' + errorCode));
    },

    onChangeGroupPortrait() {
        if (!this.data.canModify) {
            wx.previewImage({urls: [this.data.groupPortrait]});
            return;
        }
        showActionMenu([
            {label: '查看群头像', action: () => wx.previewImage({urls: [this.data.groupPortrait]})},
            {label: '更换群头像', action: () => this._pickGroupPortrait()},
        ]);
    },

    _pickGroupPortrait() {
        wx.chooseMedia({
            count: 1,
            mediaType: ['image'],
            sizeType: ['compressed'],
            success: res => {
                let path = res.tempFiles[0].tempFilePath;
                wx.cropImage ? wx.cropImage({
                    src: path,
                    cropScale: '1:1',
                    success: r => this._uploadGroupPortrait(r.tempFilePath),
                    fail: () => this._uploadGroupPortrait(path),
                }) : this._uploadGroupPortrait(path);
            }
        });
    },

    async _uploadGroupPortrait(path) {
        showLoading('正在上传');
        try {
            let ext = path.substring(path.lastIndexOf('.'));
            let url = await uploadFile(`group-portrait-${new Date().getTime()}${ext}`, path, MessageContentMediaType.Portrait);
            wfc.modifyGroupInfo(this.conversation.target, ModifyGroupInfoType.Modify_Group_Portrait, url, [0], null, () => {
                hideLoading();
                this.setData({groupPortrait: url});
            }, errorCode => {
                hideLoading();
                toast('修改失败 ' + errorCode);
            });
        } catch (e) {
            hideLoading();
            console.log('upload group portrait error', e);
            toast('上传失败');
        }
    },

    async onEditAnnouncement() {
        if (!this.data.canModifyAnnouncement) {
            if (this.data.announcement) {
                wx.showModal({title: '群公告', content: this.data.announcement, showCancel: false});
            } else {
                toast('只有群主和管理员可以编辑群公告');
            }
            return;
        }
        let text = await prompt('群公告', '请输入群公告', this.data.announcement);
        if (text === null || text === this.data.announcement) {
            return;
        }
        AppServerApi.updateGroupAnnouncement(this.conversation.target, text)
            .then(() => {
                this.setData({announcement: text});
                toast('已更新', 'success');
            })
            .catch(e => {
                console.log('updateGroupAnnouncement error', e);
                toast('更新失败');
            });
    },

    async onEditRemark() {
        let remark = await prompt('群聊备注', '群聊的备注仅自己可见', this.data.groupRemark);
        if (remark === null || remark === this.data.groupRemark) {
            return;
        }
        wfc.setGroupRemark(this.conversation.target, remark, () => {
            this.setData({groupRemark: remark});
        }, errorCode => toast('修改失败 ' + errorCode));
    },

    async onEditMyAlias() {
        let alias = await prompt('我在群里的昵称', '昵称', this.data.myAlias);
        if (alias === null || alias === this.data.myAlias) {
            return;
        }
        wfc.modifyGroupAlias(this.conversation.target, alias, [0], null, () => {
            this.setData({myAlias: alias});
        }, errorCode => toast('修改失败 ' + errorCode));
    },

    onGroupManage() {
        wx.navigateTo({url: `/pages/group-manage/group-manage?groupId=${encodeURIComponent(this.conversation.target)}`});
    },

    onSearchMessages() {
        wx.navigateTo({
            url: `/pages/message-search/message-search?conversation=${encodeURIComponent(JSON.stringify(this.conversation))}`
        });
    },

    // ==================== 设置 ====================

    onSilentChange(e) {
        let silent = e.detail.value;
        wfc.setConversationSlient(this.conversation, silent, () => {
            this.setData({isSilent: silent});
        }, errorCode => {
            this.setData({isSilent: !silent});
            toast('设置失败 ' + errorCode);
        });
    },

    onTopChange(e) {
        let top = e.detail.value;
        wfc.setConversationTop(this.conversation, top ? 1 : 0, () => {
            this.setData({isTop: top});
        }, errorCode => {
            this.setData({isTop: !top});
            toast('设置失败 ' + errorCode);
        });
    },

    onFavChange(e) {
        let fav = e.detail.value;
        wfc.setFavGroup(this.conversation.target, fav, () => {
            this.setData({isFav: fav});
        }, errorCode => {
            this.setData({isFav: !fav});
            toast('设置失败 ' + errorCode);
        });
    },

    // ==================== 其他操作 ====================

    onClearMessages() {
        let clearLocal = () => {
            wfc.clearMessages(this.conversation);
            getApp().globalData.chatNeedsReload = true;
            toast('已清空', 'success');
        };
        showActionMenu([
            {
                label: '清空本地聊天记录',
                action: async () => {
                    if (await confirm('清空聊天记录', '确定清空本地聊天记录？', '清空', '#fa5151')) {
                        clearLocal();
                    }
                }
            },
            {
                label: '清空本地和远程聊天记录',
                action: async () => {
                    if (!(await confirm('清空聊天记录', '远程聊天记录清空后无法恢复，确定清空？', '清空', '#fa5151'))) {
                        return;
                    }
                    wfc.clearRemoteConversationMessages(this.conversation, () => clearLocal(), errorCode => {
                        toast('清空远程聊天记录失败 ' + errorCode);
                    });
                }
            }
        ]);
    },

    async onQuitGroup() {
        let ok = await confirm('退出群聊', '退出后将不再接收此群聊消息', '退出', '#fa5151');
        if (!ok) {
            return;
        }
        showLoading();
        wfc.quitGroup(this.conversation.target, [0], null, () => {
            hideLoading();
            wfc.removeConversation(this.conversation, true);
            wx.switchTab({url: '/pages/chat-list/chat-list'});
        }, errorCode => {
            hideLoading();
            toast('退出失败 ' + errorCode);
        });
    },

    async onDismissGroup() {
        let ok = await confirm('解散群聊', '解散后所有成员将被移出群聊，且不可恢复', '解散', '#fa5151');
        if (!ok) {
            return;
        }
        showLoading();
        wfc.dismissGroup(this.conversation.target, [0], null, () => {
            hideLoading();
            wfc.removeConversation(this.conversation, true);
            wx.switchTab({url: '/pages/chat-list/chat-list'});
        }, errorCode => {
            hideLoading();
            toast('解散失败 ' + errorCode);
        });
    },

    async onDeleteConversation() {
        let ok = await confirm('删除聊天', '删除后将清空该聊天的本地消息记录', '删除', '#fa5151');
        if (ok) {
            wfc.removeConversation(this.conversation, true);
            wx.switchTab({url: '/pages/chat-list/chat-list'});
        }
    },
});
