import wfc from "../../wfc/client/wfc";
import Config from "../../config";
import ConversationType from "../../wfc/model/conversationType";

Page({
    data: {
        searchResults: []
    },

    onSearchInput(e) {
        const keyword = e.detail.value;
        if (keyword) {
            this.searchUsers(keyword);
        } else {
            this.setData({searchResults: []});
        }
    },

    searchUsers(keyword) {
        wfc.searchUser(keyword, 0, 0, (keyword, users) => {
            const searchResults = users.map(user => ({
                userId: user.uid,
                userHeadUrl: user.portrait ? user.portrait : Config.DEFAULT_PORTRAIT_URL,
                userName: user.displayName,
                isFriend: wfc.isMyFriend(user.uid)
            }));
            this.setData({searchResults});
        }, (err) => {
            console.error('Search user failed', err);
        });
    },

    addUser(e) {
        const userId = e.currentTarget.dataset.userid;
        wfc.sendFriendRequest(userId, 'Hi, let\'s be friends!', '', () => {
            wx.showToast({
                title: 'Friend request sent',
                icon: 'success'
            });
        }, (err) => {
            wx.showToast({
                title: 'Failed to send request',
                icon: 'none'
            });
            console.error('Send friend request failed', err);
        });
    },

    handleImageError(e) {
        const index = e.currentTarget.dataset.index;
        let searchResults = this.data.searchResults;
        searchResults[index].userHeadUrl = Config.DEFAULT_PORTRAIT_URL;
        this.setData({searchResults});
    },

    onUserItemTap(e) {
        const userId = e.currentTarget.dataset.userid;
        const isFriend = e.currentTarget.dataset.isfriend;
        if (isFriend) {
            const conversation = {
                type: ConversationType.Single, // Single chat
                target: userId,
                line: 0
            };
            wx.navigateTo({
                url: `/pages/chat/chat?conversation=${JSON.stringify(conversation)}`
            });
        }
    }
});