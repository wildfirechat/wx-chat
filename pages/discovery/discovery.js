// pages/discover/discover.js
Page({
    data: {
        items: [
            {name: '搜索用户', url: '../search-user/search-user'},
            {name: '创建群组', url: '../create-group/create-group'}
        ]
    },

    navigateTo(e) {
        const url = e.currentTarget.dataset.url;
        wx.navigateTo({url});
    }
});