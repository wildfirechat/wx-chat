//app.js

import wfc from "./wfc/client/wfc";

App({
    globalData: {
        userInfo: {},
    },
    onLaunch(options) {
        wfc.init();
    },
    onHide() {
    },
    onShow(options) {
    }
});