// pages/chat-list/chat-list.js
import EventType from '../../wfc-bundle/client/wfcEvent.js';
import ConnectionStatus from '../../wfc-bundle/client/connectionStatus.js';
import MessageConfig from '../../wfc-bundle/client/messageConfig.js';
import PersistFlag from '../../wfc-bundle/messages/persistFlag.js';

/**
 * 会话列表页面
 */
Page({

    wfc: {},

    /**
     * 页面的初始数据
     */
    data: {
        conversations: []
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        this.wfc = getApp().getIMHandler();

        this.wfc.eventEmiter.on(EventType.ConnectionStatusChanged, (status) => {
            if (status === ConnectionStatus.ConnectionStatusConnected) {
                this.showConversationList();
            }
        });

        this.wfc.eventEmiter.on(EventType.UserInfoUpdate, (userInfo) => {
            console.log('userInfo update', userInfo);
            this.showConversationList();
        });

        this.wfc.eventEmiter.on(EventType.GroupInfoUpdate, (groupInfo) => {
            console.log('grouInfo update', groupInfo);
            this.showConversationList();
        });

        this.wfc.eventEmiter.on(EventType.ReceiveMessage, (msg) => {
            console.log('receive msg', msg);
            if (MessageConfig.getMessageContentPersitFlag(msg.content.type) == PersistFlag.Persist_And_Count) {
                this.showConversationList();
            }
        });
    },

    chatTo(e) {
        let item = e.currentTarget.dataset.item;
        delete item.unread;
        wx.navigateTo({
            url: `../chat/chat?conversationInfo=${JSON.stringify(item)}`
        });
    },
    /**
     * 生命周期函数--监听页面显示
     */
    async onShow() {
        if (this.wfc.getConnectionStatus() === ConnectionStatus.ConnectionStatusConnected) {
            this.showConversationList();
        }
    },

    showConversationList() {
        let conversations = this.wfc.getConversationList([0, 1, 2], [0, 1]);
        let clUi = conversations.map(item => {
            item.ui = {
                title: item.title(),
                portrait: item.portrait(),
                lastMsgContent: '',
                unread: item.unreadCount.unread,
                time: ''
            }
            if (item.lastMessage && item.lastMessage.messageContent) {
                item.ui.lastMsgContent = item.lastMessage.messageContent.digest();
                item.ui.time = 'todo msg time';
            }
            return item;
        });
        console.log('cl', clUi);
        this.setData({
            conversations: clUi
        });
    }
});
