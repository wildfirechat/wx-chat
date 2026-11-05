//app.js

import wfc from "./wfc/client/wfc";
import customMessageConfig from "./wfc_custom_message/customMessageConfig";

App({
    globalData: {
        userInfo: {},
        // 转发的消息，参考 pages/forward-chat-list
        forwardMessages: null,
        forwardType: null,
        // 查看的聊天记录消息，参考 pages/composite-message
        compositeMessage: null,
        // 会话消息被清空，会话页面需要重新加载
        chatNeedsReload: false,
    },
    onLaunch(options) {
        // 多个页面会同时监听 wfc 事件
        wfc.eventEmitter.setMaxListeners(50);
        wfc.init();
        customMessageConfig.registerCustomMessages()
    },
    onHide() {
    },
    onShow(options) {
    }
});
