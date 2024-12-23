import wfc from "../../wfc/client/wfc";
import Config from "../../config";
import {voipBaseWebUrl} from "../voip/voip";

Page({
    data: {
        user: {},
        about: ''
    },

    onLoad() {
        this.loadUserInfo();
        let desc = '';
        desc = `版本信息如下：
        App-Server: ${Config.APP_SERVER}
        IM-Server: ${wfc.getHost()}
        SDK Version: ${wfc.getVersion()}
        AV: ${voipBaseWebUrl.includes('voip-multi') ? '多人版' : '高级版'}
        `
        this.setData({about: desc});
    },

    loadUserInfo() {
        let userInfo = wfc.getUserInfo(wfc.getUserId())
        this.setData({user: userInfo});
    },

    logout() {
        wfc.disconnect()
        wx.showToast({
            title: 'Logged out',
            icon: 'none',
            duration: 2000,
            success: () => {
                wx.redirectTo({
                    url: '/pages/login/login'
                });
            }
        });
    }
});