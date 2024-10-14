// pages/list/list.js
import UI from "./ui";
import VoiceManager from './msg-type/voice-manager';
import wfc from "../../wfc/client/wfc";
import ConversationInfo from "../../wfc/model/conversationInfo";
import TextMessageContent from "../../wfc/messages/textMessageContent";
import EventType from "../../wfc/client/wfcEvent";
import Conversation from "../../wfc/model/conversation";
import ImageMessageContent from "../../wfc/messages/imageMessageContent";
import SoundMessageContent from "../../wfc/messages/soundMessageContent";
import MessageStatus from "../../wfc/messages/messageStatus";
import NotificationMessageContent from "../../wfc/messages/notification/notificationMessageContent";
import {eq, gt, numberValue} from "../../wfc/util/longUtil";
import {timeFormat} from '../../utils/time'
import avenginekitproxy from "../../wfc/av/engine/avenginekitproxy";
import ConversationType from "../../wfc/model/conversationType";
import Toast from "../../utils/toast";
import CallStartMessageContent from "../../wfc/av/messages/callStartMessageContent";
import ConferenceInviteMessageContent from "../../wfc/av/messages/conferenceInviteMessageContent";
import StreamingTextGeneratingMessageContent from "../../wfc/messages/streamingTextGeneratingMessageContent";
import StreamingTextGeneratedMessageContent from "../../wfc/messages/streamingTextGeneratedMessageContent";
import MessageContentType from "../../wfc/messages/messageContentType";

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
            picName: 'take_photos',
            description: '音频通话'
        }, {
            picName: 'take_photos',
            description: '视频通话'
        }],
    },

    onReceiveMessage(msg) {
        if (!msg.conversation.equal(this.conversation) || !this._isDisplayMessage(msg)) {
            return;
        }
        wfc.clearConversationUnreadStatus(this.conversation);

        let msgIndex = this.data.chatItems.findIndex(m => {
            return m.messageId === msg.messageId
                || (gt(m.messageUid, 0) && eq(m.messageUid, msg.messageUid))
                || (m.messageContent.type === MessageContentType.Streaming_Text_Generating
                    && (msg.messageContent.type === MessageContentType.Streaming_Text_Generating || msg.messageContent.type === MessageContentType.Streaming_Text_Generated)
                    && m.messageContent.streamId === msg.messageContent.streamId
                )
        });

        let newUIMsg = this.messagesToUiMessages([msg])[0];
        if (msgIndex >= 0) {
            this.data.chatItems[msgIndex] = newUIMsg;
        } else {
            this.data.chatItems = this.data.chatItems.concat(newUIMsg);
        }

        this.setData({
            chatItems: this.data.chatItems,
            scrollTopVal: this.data.chatItems.length * 999
        });
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

        console.log('------------chat onLoad----------');

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

        // this.UI.updateChatStatus('正在聊天中...');

        wfc.eventEmitter.on(EventType.ReceiveMessage, this.onReceiveMessage);
        wfc.eventEmitter.on(EventType.SendMessage, this.onSendMessage);
        wfc.eventEmitter.on(EventType.MessageStatusUpdate, this.onMessageStatusUpdate);
        wfc.eventEmitter.on(EventType.RecallMessage, this.onRecallMessage)
    },

    onUnload() {
        console.log('----------chat onUnload--------------')
        this.voiceManager.stopAllVoicePlay(true);

        wfc.eventEmitter.removeListener(EventType.ReceiveMessage, this.onReceiveMessage);
        wfc.eventEmitter.removeListener(EventType.SendMessage, this.onSendMessage);
        wfc.eventEmitter.removeListener(EventType.MessageStatusUpdate, this.onMessageStatusUpdate);
        wfc.eventEmitter.removeListener(EventType.RecallMessage, this.onRecallMessage);
    },


    onShow() {
        wfc.onForeground();
        this.showMessageList();
    },
    onReady() {
        this.chatInput = this.selectComponent('#chatInput');
    },

    loadOldMessages() {
        let messages = this.data.chatItems;
        let beforeUid = messages.length > 0 ? messages[0].messageUid : 0;
        let beforeId = messages.length > 0 ? messages[0].messageId : 0;
        wfc.getMessagesV2(this.conversation, beforeId, true, 20, '', msgs => {
            if (msgs.length > 0) {
                let uiMsgs = this.messagesToUiMessages(msgs);
                uiMsgs = uiMsgs.concat(messages);
                this.setData({
                    chatItems: uiMsgs
                });
            } else {
                wfc.loadRemoteConversationMessages(this.conversation, [], beforeUid, 50, (msgs) => {
                    if (msgs.length > 0) {
                        let uiMsgs = this.messagesToUiMessages(msgs);
                        uiMsgs = uiMsgs.concat(messages);
                        this.setData({
                            chatItems: uiMsgs
                        });
                    }

                }, (errorCode) => {
                    console.log('load remote message error', errorCode);
                });
            }
        }, err => {

        })
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
        console.log('onVoiceRecordEvent', e);
        const {
            detail: {
                recordStatus,
                duration,
                tempFilePath,
                fileSize,
            }
        } = e;
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
        let chooseIndex = parseInt(e.detail.index);
        switch (chooseIndex) {
            case 0:
            case 1:
                wx.chooseImage({
                    count: 1, // 默认9
                    sizeType: ['compressed'],
                    sourceType: chooseIndex === 0 ? ['album'] : ['camera'],
                    success: (res) => {
                        let orgImagePath = res.tempFilePaths[0];
                        //-----返回选定照片的本地文件路径列表，获取照片信息-----------
                        wx.getImageInfo({
                            src: res.tempFilePaths[0],
                            success: (res) => {
                                //---------利用canvas压缩图片--------------
                                let ratio = 2;
                                let imageWidth = res.width;
                                let imageHeight = res.height;
                                let canvasWidth = res.width //图片原始长宽
                                let canvasHeight = res.height
                                while (canvasWidth > 200 || canvasHeight > 200) {// 保证宽高在200以内
                                    canvasWidth = Math.trunc(res.width / ratio)
                                    canvasHeight = Math.trunc(res.height / ratio)
                                    ratio++;
                                }

                                //----------绘制图形并取出图片路径--------------
                                let ctx = wx.createCanvasContext('canvas')
                                ctx.drawImage(res.path, 0, 0, canvasWidth, canvasHeight)
                                ctx.draw(false, setTimeout(() => {
                                    wx.canvasToTempFilePath({
                                        canvasId: 'canvas',
                                        width: canvasWidth,
                                        height: canvasHeight,
                                        fileType: 'jpg',
                                        quality: 0.5,
                                        success: (res) => {
                                            let tempFilePath = res.tempFilePath;
                                            const fs = wx.getFileSystemManager()
                                            // 读取文件， base64 格式
                                            let base64Str = fs.readFileSync(tempFilePath, 'base64')
                                            let imageMessageContent = new ImageMessageContent(orgImagePath, null, base64Str);
                                            imageMessageContent.imageWidth = imageWidth;
                                            imageMessageContent.imageHeight = imageHeight;
                                            this.sendMessage(imageMessageContent);

                                        },
                                        fail: (res) => {
                                            console.log('canvasToTempFilePath error', res.errMsg)
                                        }
                                    })
                                }, 100))    //留一定的时间绘制canvas
                            },
                            fail: (res) => {
                                console.log('getImageInfo error', res.errMsg)
                            }
                        })

                    }
                });
                break;
            case 2:
            case 3:
                this.voipCall(chooseIndex === 2);
                break;
            default:
                break;

        }
    },
    /**
     * 点击extra按钮时触发
     * @param e
     */
    onExtraClickEvent(e) {
        console.log(e);
    },

    imageClickEvent(e) {
        let dataset = e.currentTarget.dataset;
        wx.previewImage({
            current: dataset.url, // 当前显示图片的http链接
            urls: [dataset.url] // 需要预览的图片http链接列表
        })
    },

    chatTextItemClickEvent(e) {
    },

    chatVoiceItemClickEvent(e) {
        let dataset = e.currentTarget.dataset;
        console.log('点击的语音Item包含的信息', dataset);
        this.voiceManager._playVoice({
            dataset
        })
    },

    chatConferenceInviteItemClickEvent(e) {
        let cmc = e.currentTarget.dataset.message.messageContent;
        console.log('点击会议邀请消息', cmc);
        avenginekitproxy.joinConference(cmc.callId, cmc.audioOnly, cmc.pin, cmc.host, cmc.title, cmc.desc, cmc.audience, cmc.advanced, false, false)
    },

    /**
     * 自定义事件
     */
    voipCall(audioOnly) {
        console.log('startcall');
        if (this.conversation.type !== ConversationType.Single) {
            Toast.show('warn', '暂只支持单人')
            console.warn('暂时只支持发起单人音视频通话，多人通话，涉及到选通话参与者，尚未实现');
            return;
        }
        avenginekitproxy.startCall(this.conversation, audioOnly, [this.conversation.target], '');
    },

    resetInputStatus() {
        this.chatInput.closeExtraView();
    },


    sendMessage(messageContent) {
        wfc.sendConversationMessage(this.conversation, messageContent, null,
            (messageId, timestamp,) => {
                this.showMessageList();
            },
            (progress, total) => {
                console.log('upload progress', progress, total)
                this.showMessageList();
            },
            (messageUid, timestamp) => {
                this.showMessageList();
            },
            (error) => {
                this.showMessageList();
            });
    },

    showMessageList() {
        wfc.getMessagesV2(this.conversation, 0, true, 20, '', messages => {
            if (messages.length < 20) {
                this.loadOldMessages();
                if (messages.length === 0) {
                    return;
                }
            }

            let uiMsgs = this.messagesToUiMessages(messages);
            this.setData({
                chatItems: uiMsgs,
                scrollTopVal: uiMsgs.length * 999
            });
        }, err => {
            console.error('getMessagesV2 error', this.conversation, err);

        });
    },

    messagesToUiMessages(messages) {
        let lastTimestamp = 0;
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
                showTime: numberValue(m.timestamp) - lastTimestamp > 2 * 60 * 1000,
                time: timeFormat(m.timestamp),
                headUrl: wfc.getUserInfo(m.from).portrait,
                isMy: m.direction === 0,
                isPlaying: false,
            };
            lastTimestamp = numberValue(m.timestamp);

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
            } else if (m.messageContent instanceof StreamingTextGeneratingMessageContent || m.messageContent instanceof StreamingTextGeneratedMessageContent) {
                item.content = m.messageContent.text;
                if (m.messageContent instanceof StreamingTextGeneratingMessageContent) {
                    item.type = 'streaming-text-generating';
                } else {
                    item.type = 'streaming-text-generated';
                }
            } else if (m.messageContent instanceof ImageMessageContent) {
                item.content = m.messageContent.localPath || m.messageContent.remotePath;
                item.type = 'image';
            } else if (m.messageContent instanceof SoundMessageContent) {
                item.content = m.messageContent.localPath || m.messageContent.remotePath;
                item.voiceDuration = m.messageContent.duration;
                item.type = 'voice';
            } else if (m.messageContent instanceof NotificationMessageContent) {
                item.type = 'notification';
                item.notification = m.messageContent.formatNotification(m);
            } else if (m.messageContent instanceof CallStartMessageContent) {
                item.type = 'callStart';
                item.content = m.messageContent.digest();
            } else if (m.messageContent instanceof ConferenceInviteMessageContent) {
                item.type = 'conferenceInvite';
                item.content = m.messageContent.digest();
            } else {
                // TODO 更多消息类型处理
                item.type = 'text';
                item.content = '未知消息，请手机端查看';
            }

            m.ui = item;
            return m;
        });

        return uiMsgs;
    },

    _isDisplayMessage(message) {
        // return [PersistFlag.Persist, PersistFlag.Persist_And_Count].indexOf(MessageConfig.getMessageContentPersitFlag(message.messageContent.type)) > -1;
        return message.messageId !== 0 || message.messageContent.type === MessageContentType.Streaming_Text_Generating;
    },

});