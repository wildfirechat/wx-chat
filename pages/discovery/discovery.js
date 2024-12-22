// pages/discover/discover.js
Page({
    data: {
        items: [
            { name: '搜索', url: '../search/search' },
            { name: '创建群组', url: '../create-group/create-group' }
        ]
    },

    navigateTo(e) {
        const url = e.currentTarget.dataset.url;
        wx.navigateTo({ url });
    }
});