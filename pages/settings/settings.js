import wfc from "../../wfc/client/wfc";
import EventType from "../../wfc/client/wfcEvent";
import Config from "../../config";
import {voipBaseWebUrl} from "../voip/voip";
import {bindWfcEvents, unbindWfcEvents} from "../../utils/wfcEvents";
import {confirm, toast} from "../../utils/ui";

/**
 * 设置
 */
Page({
    data: {
        globalSilent: false,
        showNotificationDetail: true,
        receiptSupported: false,
        receiptEnabled: false,
        blacklistCount: 0,
    },

    onLoad() {
        bindWfcEvents(this, {
            [EventType.SettingUpdate]: 'refresh',
        });
    },

    onShow() {
        this.refresh();
    },

    onUnload() {
        unbindWfcEvents(this);
    },

    refresh() {
        let receiptSupported = false;
        let receiptEnabled = false;
        try {
            receiptSupported = wfc.isReceiptEnabled();
            receiptEnabled = receiptSupported && wfc.isUserReceiptEnabled();
        } catch (e) {
            // ignore
        }
        this.setData({
            globalSilent: wfc.isGlobalSlient(),
            showNotificationDetail: !wfc.isHiddenNotificationDetail(),
            receiptSupported,
            receiptEnabled,
            blacklistCount: (wfc.getBlackList() || []).length,
        });
    },

    onGlobalSilentChange(e) {
        let silent = e.detail.value;
        wfc.setGlobalSlient(silent, () => this.setData({globalSilent: silent}), errorCode => {
            this.setData({globalSilent: !silent});
            toast('设置失败 ' + errorCode);
        });
    },

    onNotificationDetailChange(e) {
        let show = e.detail.value;
        wfc.setHiddenNotificationDetail(!show, () => this.setData({showNotificationDetail: show}), errorCode => {
            this.setData({showNotificationDetail: !show});
            toast('设置失败 ' + errorCode);
        });
    },

    onReceiptChange(e) {
        let enable = e.detail.value;
        wfc.setUserEnableReceipt(enable, () => this.setData({receiptEnabled: enable}), errorCode => {
            this.setData({receiptEnabled: !enable});
            toast('设置失败 ' + errorCode);
        });
    },

    onBlacklistTap() {
        wx.navigateTo({url: '/pages/blacklist/blacklist'});
    },

    onAboutTap() {
        let content = `App-Server: ${Config.APP_SERVER}\nIM-Server: ${wfc.getHost()}\nSDK Version: ${wfc.getVersion()}\nAV: ${voipBaseWebUrl.includes('voip-multi') ? '多人版' : '高级版'}`;
        wx.showModal({
            title: '关于',
            content,
            showCancel: false,
        });
    },

    async onLogout() {
        let ok = await confirm('退出登录', '退出后不会删除任何历史数据，下次登录依然可以使用本账号', '退出', '#fa5151');
        if (!ok) {
            return;
        }
        wfc.disconnect();
        wx.clearStorageSync();
        wx.reLaunch({url: '/pages/login/login'});
    },
});
