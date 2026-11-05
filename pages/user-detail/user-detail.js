import wfc from "../../wfc/client/wfc";
import EventType from "../../wfc/client/wfcEvent";
import Conversation from "../../wfc/model/conversation";
import ConversationType from "../../wfc/model/conversationType";
import avenginekitproxy from "../../wfc/av/engine/avenginekitproxy";
import {bindWfcEvents, unbindWfcEvents} from "../../utils/wfcEvents";
import {backToChat} from "../../utils/nav";
import {portraitOrDefault} from "../../utils/display";
import {confirm, prompt, showActionMenu, toast} from "../../utils/ui";

const GENDERS = ['', '男', '女'];

/**
 * 用户详情
 */
Page({
    data: {
        uid: '',
        portrait: '',
        displayName: '',
        alias: '',
        groupAlias: '',
        account: '',
        mobile: '',
        email: '',
        gender: '',
        isSelf: false,
        isFriend: false,
        isBlacklisted: false,
        isFav: false,
        loaded: false,
    },

    onLoad(options) {
        this.uid = decodeURIComponent(options.userId);
        this.groupId = options.groupId ? decodeURIComponent(options.groupId) : '';
        bindWfcEvents(this, {
            [EventType.UserInfosUpdate]: 'refresh',
            [EventType.FriendListUpdate]: 'refresh',
            [EventType.SettingUpdate]: 'refresh',
        });
        this.refresh();
        // 从服务端刷新用户信息
        wfc.getUserInfoEx(this.uid, true, () => this.refresh(), () => {
        });
    },

    onUnload() {
        unbindWfcEvents(this);
    },

    refresh() {
        let userInfo = wfc.getUserInfo(this.uid, false, this.groupId);
        this.setData({
            uid: this.uid,
            portrait: portraitOrDefault(userInfo.portrait),
            displayName: userInfo.displayName || this.uid,
            alias: userInfo.friendAlias || '',
            groupAlias: this.groupId ? (userInfo.groupAlias || '') : '',
            account: userInfo.name || '',
            mobile: userInfo.mobile || '',
            email: userInfo.email || '',
            gender: GENDERS[userInfo.gender] || '',
            isSelf: this.uid === wfc.getUserId(),
            isFriend: wfc.isMyFriend(this.uid),
            isBlacklisted: wfc.isBlackListed(this.uid),
            isFav: wfc.isFavUser(this.uid),
            loaded: true,
        });
        wx.setNavigationBarTitle({title: this.data.alias || this.data.displayName});
    },

    onPreviewPortrait() {
        wx.previewImage({urls: [this.data.portrait]});
    },

    onSendMessage() {
        backToChat(new Conversation(ConversationType.Single, this.uid, 0));
    },

    onAudioCall() {
        avenginekitproxy.startCall(new Conversation(ConversationType.Single, this.uid, 0), true, [this.uid], '');
    },

    onVideoCall() {
        avenginekitproxy.startCall(new Conversation(ConversationType.Single, this.uid, 0), false, [this.uid], '');
    },

    async onAddFriend() {
        let myName = wfc.getUserDisplayName(wfc.getUserId());
        let reason = await prompt('发送好友申请', '验证信息', `我是${myName}`);
        if (reason === null) {
            return;
        }
        wfc.sendFriendRequest(this.uid, reason, '', () => {
            toast('已发送', 'success');
        }, errorCode => {
            console.log('sendFriendRequest error', errorCode);
            toast('发送失败 ' + errorCode);
        });
    },

    async onSetAlias() {
        let alias = await prompt('设置备注', '备注名', this.data.alias);
        if (alias === null || alias === this.data.alias) {
            return;
        }
        wfc.setFriendAlias(this.uid, alias, () => {
            this.refresh();
        }, errorCode => toast('设置失败 ' + errorCode));
    },

    onMore() {
        let items = [];
        if (this.data.isFriend) {
            items.push({label: '设置备注', action: () => this.onSetAlias()});
            items.push({
                label: this.data.isFav ? '取消星标朋友' : '设为星标朋友',
                action: () => {
                    let fav = !this.data.isFav;
                    wfc.setFavUser(this.uid, fav, () => this.setData({isFav: fav}), errorCode => toast('设置失败 ' + errorCode));
                }
            });
        }
        items.push({
            label: this.data.isBlacklisted ? '移出黑名单' : '加入黑名单',
            action: () => this.toggleBlacklist()
        });
        if (this.data.isFriend) {
            items.push({label: '删除好友', action: () => this.deleteFriend()});
        }
        showActionMenu(items);
    },

    async toggleBlacklist() {
        let block = !this.data.isBlacklisted;
        if (block) {
            let ok = await confirm('加入黑名单', '加入黑名单后，你将不再收到对方的消息', '确定', '#fa5151');
            if (!ok) {
                return;
            }
        }
        wfc.setBlackList(this.uid, block, () => {
            this.setData({isBlacklisted: block});
            toast(block ? '已加入黑名单' : '已移出黑名单');
        }, errorCode => toast('设置失败 ' + errorCode));
    },

    async deleteFriend() {
        let ok = await confirm('删除好友', `将联系人“${this.data.alias || this.data.displayName}”删除，同时删除与该联系人的聊天记录`, '删除', '#fa5151');
        if (!ok) {
            return;
        }
        wfc.deleteFriend(this.uid, () => {
            wfc.removeConversation(new Conversation(ConversationType.Single, this.uid, 0), true);
            toast('已删除');
            setTimeout(() => wx.switchTab({url: '/pages/friends/friends'}), 600);
        }, errorCode => toast('删除失败 ' + errorCode));
    },
});
