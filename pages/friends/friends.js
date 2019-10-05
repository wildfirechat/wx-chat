// pages/friends/friends.js
import regeneratorRuntime from '../../utils/runtime.js';
import wfc from "../../wfc-bundle/wfc/wfc";
import EventType from '../../wfc-bundle/wfc/wfcEvent.js';

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

    onLoad(options) {
        wfc.eventEmiter.on(EventType.UserInfoUpdate, userInfo => {
            this.showFriendList();
        })
    },
    /**
     * 生命周期函数--监听页面显示
     */
    async onShow() {
        // getApp().getIMHandler().setOnReceiveMessageListener({
        //     listener: (msg) => {
        //         if (msg.type === 'get-friends') {
        //             this.setData({friends: msg.friends.map(item => this.createFriendItem(item))});
        //         }
        //     }
        // });

        // try {
        //     await getApp().getIMHandler().sendMsg({
        //         content: {
        //             type: 'get-friends',
        //             userId: getApp().globalData.userInfo.userId
        //         }
        //     });
        // } catch (e) {
        //     console.log('获取好友列表失败', e);
        // }
        this.showFriendList();
    },

    showFriendList() {
        let friends = wfc.getMyFriendList(false);
        let friendsUs = friends.map(f => {
            let userInfo = wfc.getUserInfo(f, false);

            return {
                friendId: userInfo.uid,
                friendHeadUrl: userInfo.portriat,
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

});
