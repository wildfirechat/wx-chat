/**
 * 自定义导航栏，用于需要在导航栏上放置按钮的页面(页面 json 中需配置 "navigationStyle": "custom")
 * 胶囊按钮区域不可用，右侧按钮放在胶囊按钮左侧
 */
Component({
    properties: {
        title: {type: String, value: ''},
        subtitle: {type: String, value: ''},
        showBack: {type: Boolean, value: true},
        showMore: {type: Boolean, value: false},
        background: {type: String, value: '#EDEDED'},
    },
    data: {
        statusBarHeight: 20,
        navHeight: 44,
        sideWidth: 96,
    },
    lifetimes: {
        attached() {
            let info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
            let statusBarHeight = info.statusBarHeight || 20;
            let navHeight = 44;
            let sideWidth = 96;
            try {
                let menu = wx.getMenuButtonBoundingClientRect();
                if (menu && menu.height && menu.top >= statusBarHeight) {
                    navHeight = (menu.top - statusBarHeight) * 2 + menu.height;
                    sideWidth = info.windowWidth - menu.left;
                }
            } catch (e) {
                console.log('getMenuButtonBoundingClientRect error', e);
            }
            this.setData({statusBarHeight, navHeight, sideWidth});
        }
    },
    methods: {
        onBack() {
            let pages = getCurrentPages();
            if (pages.length > 1) {
                wx.navigateBack();
            } else {
                wx.switchTab({url: '/pages/chat-list/chat-list'});
            }
        },
        onMore() {
            this.triggerEvent('more');
        },
        onTitleTap() {
            this.triggerEvent('titletap');
        }
    }
});
