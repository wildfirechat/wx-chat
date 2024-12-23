// pages/friends/friends.js
import wfc from "../../wfc/client/wfc";
import EventType from '../../wfc/client/wfcEvent.js';
import ConversationInfo from "../../wfc/model/conversationInfo";
import Conversation from "../../wfc/model/conversation";
import ConversationType from "../../wfc/model/conversationType";
import Config from "../../config";

/**
 * 获取好友列表
 */
Page({

    /**
     * 页面的初始数据
     */
    data: {
        friends: [],
        navItems: [
            {name: '添加好友', url: '../search-user/search-user'},
            {name: '好友请求', url: '../friend-requests/friend-requests'},
            {name: '创建群组', url: '../create-group/create-group'}
        ]
    },

    onUserInfoUpdate() {
        this.showFriendList();
    },

    onLoad(options) {
        wfc.eventEmitter.on(EventType.UserInfosUpdate, this.onUserInfoUpdate);
    },

    onUnload(options) {
        wfc.eventEmitter.removeListener(EventType.UserInfosUpdate, this.onUserInfoUpdate)
    },
    /**
     * 生命周期函数--监听页面显示
     */
    async onShow() {
        this.showFriendList();
    },

    showFriendList() {
        let friends = wfc.getMyFriendList(false);
        let friendsUs = friends.map(f => {
            let userInfo = wfc.getUserInfo(f, false);

            return {
                friendId: userInfo.uid,
                friendHeadUrl: userInfo.portrait ? userInfo.portrait : Config.DEFAULT_USER_PORTRAIT,
                friendName: userInfo.displayName
            };
        });
        this.setData({friends: friendsUs});
    },

    createFriendItem(item) {
        return {
            friendId: item.userId,
            friendHeadUrl: item.myHeadUrl,
            friendName: item.nickName
        };
    },

    loadPortraitError(e) {
        if (e.type === 'error') {
            let friendInfos = this.data.friends;
            let index = friendInfos.findIndex(f => f.friendId === e.target.dataset.uid);
            if (index >= 0) {
                friendInfos[index].friendHeadUrl = Config.DEFAULT_PORTRAIT_URL;
                this.setData({friends: friendInfos});
            }
        }
    },

    chatTo(e) {
        let item = e.currentTarget.dataset.item;
        let conversation = new Conversation(ConversationType.Single, item.friendId, 0);

        wx.navigateTo({
            url: `../chat/chat?conversation=${JSON.stringify(conversation)}`
        });
    },

    navigateTo(e) {
        const url = e.currentTarget.dataset.url;
        wx.navigateTo({url});
    }

});
