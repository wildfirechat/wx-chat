import wfc from "../../wfc/client/wfc";
import Config from "../../config";
import GroupType from "../../wfc/model/groupType";
import ConversationType from "../../wfc/model/conversationType";

Page({
    data: {
        friends: [],
        selectedFriends: []
    },

    onLoad() {
        this.showFriendList();
    },

    showFriendList() {
        let friends = wfc.getMyFriendList(false);
        let friendsUs = friends.map(f => {
            let userInfo = wfc.getUserInfo(f, false);
            return {
                friendId: userInfo.uid,
                friendHeadUrl: userInfo.portrait ? userInfo.portrait : Config.DEFAULT_USER_PORTRAIT,
                friendName: userInfo.displayName,
                checked: false
            };
        });
        this.setData({friends: friendsUs});
    },

    toggleSelect(e) {
        const index = e.currentTarget.dataset.index;
        let friends = this.data.friends;
        friends[index].checked = !friends[index].checked;
        this.setData({friends});

        let selectedFriends = friends.filter(f => f.checked);
        this.setData({selectedFriends});
    },

    removeSelectedFriend(e) {
        const friendId = e.currentTarget.dataset.friendid;
        let friends = this.data.friends.map(f => {
            if (f.friendId === friendId) {
                f.checked = false;
            }
            return f;
        });
        this.setData({friends});

        let selectedFriends = friends.filter(f => f.checked);
        this.setData({selectedFriends});
    },

    confirmSelection() {
        if (this.data.selectedFriends.length === 1) {
            // Switch to the conversation with the selected friend
            const friendId = this.data.selectedFriends[0].friendId;
            const conversation = {
                type: ConversationType.Single,
                target: friendId,
                line: 0
            };
            wx.redirectTo({
                url: `/pages/chat/chat?conversation=${JSON.stringify(conversation)}`
            });
        } else if (this.data.selectedFriends.length > 1) {
            // Create a group with the selected friends
            const friendIds = this.data.selectedFriends.map(friend => friend.friendId);
            const groupName = this.data.selectedFriends.slice(1, 5).map(friend => friend.friendName).join('、');
            wfc.createGroup('', GroupType.Normal, groupName, '', '', friendIds, '', [0], null,
                (groupId) => {
                    if (groupId) {
                        const conversation = {
                            type: ConversationType.Group, // Group chat
                            target: groupId,
                            line: 0
                        };
                        wx.redirectTo({
                            url: `/pages/chat/chat?conversation=${JSON.stringify(conversation)}`
                        });
                    } else {
                        wx.showToast({
                            title: 'Failed to create group',
                            icon: 'none'
                        });
                    }
                });
        }
    },

    handleImageError(e) {
        const index = e.currentTarget.dataset.index;
        let friends = this.data.friends;
        friends[index].friendHeadUrl = Config.DEFAULT_PORTRAIT_URL; // 设置默认头像路径
        this.setData({friends});
    }
});