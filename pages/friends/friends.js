// pages/friends/friends.js
import wfc from "../../wfc-bundle/client/wfc";
import EventType from '../../wfc-bundle/client/wfcEvent.js';
import ConversationInfo from "../../wfc-bundle/model/conversationInfo";
import Conversation from "../../wfc-bundle/model/conversation";
import ConversationType from "../../wfc-bundle/model/conversationType";

/**
 * 获取好友列表
 */
Page({

    /**
     * 页面的初始数据
     */
    data: {
        friends: []
    },

    onUserInfoUpdate() {
        this.showFriendList();
    },

    onLoad(options) {
        wfc.eventEmitter.on(EventType.UserInfoUpdate, this.onUserInfoUpdate);
    },

    onUnload(options) {
        wfc.eventEmitter.removeListener(EventType.UserInfoUpdate, this.onUserInfoUpdate)
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
                friendHeadUrl: userInfo.portrait,
                friendName: userInfo.displayName
            };
        });
        this.setData({ friends: friendsUs });
    },

    createFriendItem(item) {
        return {
            friendId: item.userId,
            friendHeadUrl: item.myHeadUrl,
            friendName: item.nickName
        };
    },

    chatTo(e) {
        let item = e.currentTarget.dataset.item;
        let conversation = new Conversation(ConversationType.Single, item.friendId, 0);

        wx.navigateTo({
            url: `../chat/chat?conversation=${JSON.stringify(conversation)}`
        });
    }

});
