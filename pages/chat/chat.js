// pages/list/list.js
import IMOperator from "./im-operator";
import UI from "./ui";
import MsgManager from "./msg-manager";
import wfc from "../../wfc-bundle/client/wfc";
import ConversationInfo from "../../wfc-bundle/model/conversationInfo";
import TextMessageContent from "../../wfc-bundle/messages/textMessageContent";
import EventType from "../../wfc-bundle/client/wfcEvent";
import Conversation from "../../wfc-bundle/model/conversation";
import ImageMessageContent from "../../wfc-bundle/messages/imageMessageContent";
import SoundMessageContent from "../../wfc-bundle/messages/soundMessageContent";
import MessageStatus from "../../wfc-bundle/messages/messageStatus";
import VoiceManager from "./msg-type/voice-manager";
import NotificationMessageContent from "../../wfc-bundle/messages/notification/notificationMessageContent";

/**
 * 聊天页面
 */
Page({

    conversation: {},
    /**
     * 页面的初始数据
     */
    data: {
        textMessage: '',
        chatItems: [],
        latestPlayVoicePath: '',
        chatStatue: 'open',
        extraArr: [{
            picName: 'choose_picture',
            description: '照片'
        }, {
            picName: 'take_photos',
            description: '拍摄'
        }, {
            picName: 'close_chat',
            description: '自定义功能'
        }],
    },

    onReceiveMessage(msg) {
        if (!msg.conversation.equal(this.conversation)) {
            return;
        }
        this.showMessageList();
    },

    onSendMessage(msg) {
        if (!msg.conversation.equal(this.conversation)) {
            return;
        }
        this.showMessageList();
    },

    onMessageStatusUpdate(msg) {
        if (!msg.conversation.equal(this.conversation)) {
            return;
        }
        this.showMessageList();
    },

    onRecallMessage(operator, messageUid) {
        let msg = wfc.getMessageByUid(messageUid);
        if (!msg.conversation.equal(this.conversation)) {
            return;
        }
        this.showMessageList();
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {

        const conversationJson = JSON.parse(options.conversation);
        this.setData({
            pageHeight: wx.getSystemInfoSync().windowHeight,
        });
        this.conversation = Object.assign(new Conversation(), conversationJson);
        const conversationInfo = new ConversationInfo();
        conversationInfo.conversation = this.conversation;

        wx.setNavigationBarTitle({
            title: conversationInfo.title() || ''
        });
        this.UI = new UI(this);
        this.voiceManager = new VoiceManager(this);

        this.UI.updateChatStatus('正在聊天中...');

        wfc.eventEmiter.on(EventType.ReceiveMessage, this.onReceiveMessage);
        wfc.eventEmiter.on(EventType.SendMessage, this.onSendMessage);
        wfc.eventEmiter.on(EventType.MessageStatusUpdate, this.onMessageStatusUpdate);
        wfc.eventEmiter.on(EventType.RecallMessage, this.onRecallMessage)
    },

    onUnload() {
        wfc.eventEmiter.removeListener(EventType.ReceiveMessage, this.onReceiveMessage);
        wfc.eventEmiter.removeListener(EventType.SendMessage, this.onSendMessage);
        wfc.eventEmiter.removeListener(EventType.MessageStatusUpdate, this.onMessageStatusUpdate);
        wfc.eventEmiter.removeListener(EventType.RecallMessage, this.onRecallMessage);
    },


    onShow() {
        this.showMessageList();
    },
    onReady() {
        this.chatInput = this.selectComponent('#chatInput');
    },

    onMessageLongTap(e) {
        let msg = e.currentTarget.dataset.item;
        let menuItems = ['删除', '复制'];
        // TODO 还需时间判断是否可以撤回
        if (msg.direction === 0) {
            menuItems = ['撤回'].concat(menuItems);
        }

        let self = this;
        wx.showActionSheet({
            itemList: menuItems,
            success(res) {
                console.log(res.tapIndex)
                let item = menuItems[res.tapIndex];
                switch (item) {
                    case '删除':
                        self.deleteMessage(msg);
                        break;
                    case '复制':
                        self.copyMessage(msg);
                        break;
                    case '撤回':
                        self.recallMessage(msg);
                        break;
                    default:
                        break;
                }
            },
            fail(res) {
                console.log(res.errMsg)
            }
        });
    },

    deleteMessage(msg) {
        wfc.deleteMessage(msg.messageId)
        this.showMessageList();
    },

    copyMessage(msg) {

    },

    recallMessage(msg) {
        wfc.recallMessage(msg.messageUid, () => {
            this.showMessageList();
            console.log('recall message success');
        }, (errorCode) => {
            console.log('recall message failed');
        })

    },

    onSendMessageEvent(e) {
        let content = e.detail.value;
        let textMsgContent = new TextMessageContent(content);
        this.sendMessage(textMsgContent);
    },

    onVoiceRecordEvent(e) {
        const { detail: { recordStatus, duration, tempFilePath, fileSize, } } = e;
        if (recordStatus === 2) {
            let voiceMsgContent = new SoundMessageContent(tempFilePath, null, Math.floor(duration / 1000))
            this.sendMessage(voiceMsgContent);
        }
        this.voiceManager.stopAllVoicePlay(true);
    },
    /**
     * 点击extra中的item时触发
     * @param e
     */
    onExtraItemClickEvent(e) {
        console.warn(e);
        let chooseIndex = parseInt(e.detail.index);
        if (chooseIndex === 2) {
            this.myFun();
            return;
        }
        wx.chooseImage({
            count: 1, // 默认9
            sizeType: ['compressed'],
            sourceType: chooseIndex === 0 ? ['album'] : ['camera'],
            success: (res) => {
                let imageMessageContent = new ImageMessageContent(res.tempFilePaths[0], null, null);
                this.sendMessage(imageMessageContent);
                // this.msgManager.sendMsg({ type: IMOperator.ImageType, content: res.tempFilePaths[0] })
            }
        });
    },
    /**
     * 点击extra按钮时触发
     * @param e
     */
    onExtraClickEvent(e) {
        console.log(e);
    },
    //模拟上传文件，注意这里的cbOk回调函数传入的参数应该是上传文件成功时返回的文件url，这里因为模拟，我直接用的savedFilePath
    simulateUploadFile({ savedFilePath, duration, itemIndex }) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                let urlFromServerWhenUploadSuccess = savedFilePath;
                resolve({ url: urlFromServerWhenUploadSuccess });
            }, 1000);
        });
    },

    chatVoiceItemClickEvent(e) {
        let dataset = e.currentTarget.dataset;
        console.log('点击的语音Item包含的信息', dataset);
        this.voiceManager._playVoice({ dataset })
    },

    /**
     * 自定义事件
     */
    myFun() {
        wx.showModal({
            title: '小贴士',
            content: '演示更新会话状态',
            confirmText: '确认',
            showCancel: true,
            success: (res) => {
                if (res.confirm) {
                    this.msgManager.sendMsg({ type: IMOperator.CustomType })
                }
            }
        })
    },

    resetInputStatus() {
        this.chatInput.closeExtraView();
    },

    onUnload() {
        this.voiceManager.stopAllVoicePlay(true);
    },

    async sendMsg({ content, itemIndex }) {
        try {
            const { msg } = await this.imOperator.onSimulateSendMsg({ content })
            this.UI.updateViewWhenSendSuccess(msg, itemIndex);
            return { msg };
        } catch (e) {
            console.error(e);
            this.UI.updateViewWhenSendFailed(itemIndex);
        }
    },
    /**
     * 重发消息
     * @param e
     */
    resendMsgEvent(e) {
        const itemIndex = parseInt(e.currentTarget.dataset.resendIndex);
        const item = this.data.chatItems[itemIndex];
        this.UI.updateDataWhenStartSending(item, false, false);
        this.msgManager.resend({ ...item, itemIndex });
    },

    sendMessage(messageContent) {
        wfc.sendConversationMessage(this.conversation, messageContent, null,
            () => {
                this.showMessageList();
            },
            () => {
                this.showMessageList();
            },
            () => {
                this.showMessageList();
            },
            () => {
                this.showMessageList();
            });
    },

    showMessageList() {
        let messages = wfc.getMessages(this.conversation);
        let uiMsgs = messages.map(m => {
            // time:item.time,
            // length:length,
            // index:index,
            // headUrl:item.headUrl,
            // item.isMy,
            // showTime:item.showTime,
            // time:item.time,
            // content:item.content,
            // type:item.type, text, voice, image
            // voiceDuration:item.voiceDuration,
            // isPlaying:item.isPlaying,
            // sendStatus:item.sendStatus sending, success, failed

            // TODO item.ui.xx
            let item = {
                showTime: false,
                time: 'to do time',
                headUrl: wfc.getUserInfo(m.from).portrait,
                isMy: m.direction === 0,
                isPlaying: false,
            };

            switch (m.status) {
                case MessageStatus.Sending:
                    item.sendStatus = 'sending';
                    break;
                case MessageStatus.Sent:
                    item.sendStatus = 'success';
                    break;
                case MessageStatus.SendFailure:
                    item.sendStatus = 'failed';
                    break;
                default:
                    break;
            }

            if (m.messageContent instanceof TextMessageContent) {
                item.content = m.messageContent.content;
                item.type = 'text';
            } else if (m.messageContent instanceof ImageMessageContent) {
                item.content = m.messageContent.localPath || m.messageContent.remotePath;
                item.type = 'image';
            } else if (m.messageContent instanceof SoundMessageContent) {
                item.content = m.messageContent.localPath || m.messageContent.remotePath;
                item.voiceDuration = m.messageContent.duration;
                item.type = 'voice';
            } else if (m.messageContent instanceof NotificationMessageContent) {
                item.type = 'notification';
                item.notification = m.messageContent.formatNotification();
            } else {
                // TODO more message content type

            }

            m.ui = item;
            return m;
        });

        this.setData({
            chatItems: uiMsgs
        });
    }
});
