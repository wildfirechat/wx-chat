// pages/chat-list/chat-list.js
import EventType from '../../wfc-bundle/client/wfcEvent.js';
import ConnectionStatus from '../../wfc-bundle/client/connectionStatus.js';
import MessageConfig from '../../wfc-bundle/client/messageConfig.js';
import PersistFlag from '../../wfc-bundle/messages/persistFlag.js';
import wfc from "../../wfc-bundle/client/wfc";

/**
 * 会话列表页面
 */
Page({

    /**
     * 页面的初始数据
     */
    data: {
        conversations: []
    },

    onConnnectionStatusChange(status) {
        if (status === ConnectionStatus.ConnectionStatusConnected) {
            this.showConversationList();
        }
    },

    onUserInfosUpdate(userInfos) {
        this.showConversationList();
    },

    onGroupInfosUpdate(groupInfos) {
        this.showConversationList();
    },

    onReceiveMessage(msg) {
        console.log('receive msg', msg);
        if (MessageConfig.getMessageContentPersitFlag(msg.content.type) == PersistFlag.Persist_And_Count) {
            this.showConversationList();
        }
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        wfc.eventEmiter.on(EventType.ConnectionStatusChanged, this.onConnnectionStatusChange);
        wfc.eventEmiter.on(EventType.UserInfosUpdate, this.onUserInfosUpdate);
        wfc.eventEmiter.on(EventType.GroupInfosUpdate, this.onGroupInfosUpdate);
        wfc.eventEmiter.on(EventType.ReceiveMessage, this.onReceiveMessage);
    },

    onUnload(options) {
        wfc.eventEmiter.removeListener(EventType.ConnectionStatusChanged, this.onConnnectionStatusChange);
        wfc.eventEmiter.removeListener(EventType.UserInfosUpdate, this.onUserInfosUpdate);
        wfc.eventEmiter.removeListener(EventType.GroupInfosUpdate, this.onGroupInfosUpdate);
        wfc.eventEmiter.removeListener(EventType.ReceiveMessage, this.onReceiveMessage);
    },

    chatTo(e) {
        let item = e.currentTarget.dataset.item;
        delete item.unread;
        wx.navigateTo({
            url: `../chat/chat?conversation=${JSON.stringify(item.conversation)}`
        });
    },
    /**
     * 生命周期函数--监听页面显示
     */
    async onShow() {
        if (wfc.getConnectionStatus() === ConnectionStatus.ConnectionStatusConnected) {
            this.showConversationList();
        }
    },

    showConversationList() {
        let conversations = wfc.getConversationList([0, 1, 2], [0, 1]);
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
