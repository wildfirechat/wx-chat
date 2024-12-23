import wfc from "../../wfc/client/wfc";
import {numberValue} from "../../wfc/util/longUtil";

Page({
    data: {
        friendRequests: []
    },

    onLoad() {
        this.loadFriendRequests();
    },

    loadFriendRequests() {
        let requests = wfc.getIncommingFriendRequest()

        requests.sort((a, b) => numberValue(b.timestamp) - numberValue(a.timestamp))
        requests = requests.length >= 20 ? requests.slice(0, 20) : requests;
        let uids = [];
        requests.forEach(fr => {
            uids.push(fr.target);
        });
        let userInfos = wfc.getUserInfos(uids, '')
        requests.forEach(fr => {
            fr._target = userInfos.find((u => u.uid === fr.target));
        });

        this.setData({friendRequests: requests});
    },

    acceptRequest(e) {
        console.log(e.currentTarget.dataset.request.target);
        const userId = e.currentTarget.dataset.request.target;
        // Handle accept request logic
        wfc.handleFriendRequest(userId, true, '', () => {
        }, err => {
            wx.showToast({
                title: '接受好友请求失败',
                icon: 'none'
            });
        })
    },

    declineRequest(e) {
        const requestId = e.currentTarget.dataset.requestid;
        // Handle decline requet logic
        wx.showToast({
            title: `Declined request ${requestId}`,
            icon: 'none'
        });
    }
});