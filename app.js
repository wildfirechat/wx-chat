//app.js

import wfc from "./wfc/client/wfc";
import customMessageConfig from "./wfc_custom_message/customMessageConfig";

App({
    globalData: {
        userInfo: {},
    },
    onLaunch(options) {
        wfc.init();
        customMessageConfig.registerCustomMessages()
    },
    onHide() {
    },
    onShow(options) {
    }
});