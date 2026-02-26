import wfc from "../../wfc/client/wfc";
import EventType from '../../wfc/client/wfcEvent.js';
import ConnectionStatus from '../../wfc/client/connectionStatus.js';
import Config from '../../config.js';
import {timeFormat} from '../../utils/time';

Page({
    data: {
        conversations: []
    },

    onLoad(options) {
        wx.setNavigationBarTitle({
            title: '选择转发对象'
        });
    },

    onUnload() {
    },

    onShow() {
        if (wfc.getConnectionStatus() === ConnectionStatus.ConnectionStatusConnected) {
            this.showConversationList();
        }
    },
    showConversationList() {
        let conversations = wfc.getConversationList([0, 1, 2], [0, 1]);
        let clUi = conversations.map(item => {
            item.ui = {
                title: item.title(),
                portrait: item.portrait() ? item.portrait() : Config.DEFAULT_USER_PORTRAIT,
                lastMsgContent: '',
                unread: item.unreadCount.unread,
                time: ''
            }
            return item;
        });
        this.setData({ conversations: clUi });
    },

    chatTo(e) {
        let item = e.currentTarget.dataset.item;
        let self = this;
        wx.showModal({
            title: '转发',
            content: `确定转发给 ${item.ui.title} 吗？`,
            success(res) {
                if (res.confirm) {
                    let message = getApp().globalData.forwardMessage;
                    if (message) {
                        wfc.sendConversationMessage(item.conversation, message.messageContent, null, () => {
                            wx.showToast({
                                title: '转发成功',
                                icon: 'success'
                            });
                            setTimeout(() => {
                                wx.navigateBack();
                            }, 1000);
                        }, null, null, (err) => {
                            wx.showToast({
                                title: '转发失败',
                                icon: 'none'
                            });
                        });
                    }
                }
            }
        });
    }
});