// pages/chat-list/chat-list.js
import regeneratorRuntime from '../../utils/runtime.js';
import EventType from '../../wfc-bundle/wfc/wfcEvent.js';
import ConnectionStatus from '../../wfc-bundle/wfc/connectionStatus.js';
import MessageConfig from '../../wfc-bundle/wfc/messageConfig.js';
import PersistFlag from '../../wfc-bundle/wfc/messages/persistFlag.js';

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

    toChat(e) {
        let item = e.currentTarget.dataset.item;
        delete item.latestMsg;
        delete item.unread;
        delete item.content;
        wx.navigateTo({
            url: `../chat/chat?friend=${JSON.stringify(item)}`
        });
    },
    /**
     * 生命周期函数--监听页面显示
     */
    async onShow() {

        // getApp().getIMHandler().setOnReceiveMessageListener({
        //     listener: (msg) => {
        //         console.log('会话列表', msg);
        //         msg.type === 'get-conversations' && this.setData({conversations: msg.conversations.map(item => this.getConversationsItem(item))})
        //     }
        // });
        // try {
        //     await getApp().getIMHandler().sendMsg({
        //         content: {
        //             type: 'get-conversations',
        //             userId: getApp().globalData.userInfo.userId
        //         }
        //     });
        //     console.log('获取会话列表消息发送成功');
        // } catch (e) {
        //     console.log('获取会话列表失败', e);
        // }

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
    },

    getConversationsItem(item) {
        let { latestMsg, ...msg } = item;
        return Object.assign(msg, JSON.parse(latestMsg));
    }
});
