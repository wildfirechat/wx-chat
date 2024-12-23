// pages/discover/discover.js
Page({
    data: {
        items: [
            {name: '添加好友', url: '../search-user/search-user'},
            {name: '好友请求', url: '../friend-requests/friend-requests'},
            {name: '创建群组', url: '../create-group/create-group'}
        ]
    },

    navigateTo(e) {
        const url = e.currentTarget.dataset.url;
        wx.navigateTo({url});
    }
});