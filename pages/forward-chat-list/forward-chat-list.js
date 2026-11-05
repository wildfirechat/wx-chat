import wfc from "../../wfc/client/wfc";
import ConversationType from "../../wfc/model/conversationType";
import Conversation from "../../wfc/model/conversation";
import TextMessageContent from "../../wfc/messages/textMessageContent";
import CompositeMessageContent from "../../wfc/messages/compositeMessageContent";
import ArticlesMessageContent from "../../wfc/messages/articlesMessageContent";
import {conversationPortrait, conversationTitle} from "../../utils/display";
import {pickUsers} from "../../utils/nav";
import {hideLoading, showLoading, toast} from "../../utils/ui";

/**
 * 转发
 * 转发的消息和转发方式通过 globalData 传递：
 * forwardMessages: [Message]
 * forwardType: 'normal' | 'oneByOne' | 'composite'
 */
Page({
    data: {
        conversations: [],
        title: '',
    },

    onLoad() {
        let app = getApp();
        let messages = app.globalData.forwardMessages || (app.globalData.forwardMessage ? [app.globalData.forwardMessage] : []);
        this.messages = messages;
        this.forwardType = app.globalData.forwardType || 'normal';
        app.globalData.forwardMessages = null;
        app.globalData.forwardMessage = null;
        app.globalData.forwardType = null;

        let title = '选择转发对象';
        if (this.forwardType === 'composite') {
            title = '合并转发';
        } else if (messages.length > 1) {
            title = '逐条转发';
        }
        wx.setNavigationBarTitle({title});
        this.showConversationList();
    },

    showConversationList() {
        let conversations = wfc.getConversationList([ConversationType.Single, ConversationType.Group], [0]);
        let items = conversations.map(info => ({
            key: `${info.conversation.type}-${info.conversation.target}-${info.conversation.line}`,
            conversation: {type: info.conversation.type, target: info.conversation.target, line: info.conversation.line},
            title: conversationTitle(info.conversation),
            portrait: conversationPortrait(info.conversation),
        }));
        this.setData({conversations: items});
    },

    async onPickFriend() {
        let uids = await pickUsers({title: '选择好友', multi: false});
        if (uids.length === 0) {
            return;
        }
        let conversation = new Conversation(ConversationType.Single, uids[0], 0);
        this.confirmForward(conversation, conversationTitle(conversation));
    },

    onConversationTap(e) {
        let item = e.currentTarget.dataset.item;
        let conversation = new Conversation(item.conversation.type, item.conversation.target, item.conversation.line);
        this.confirmForward(conversation, item.title);
    },

    confirmForward(conversation, name) {
        if (!this.messages || this.messages.length === 0) {
            toast('没有需要转发的消息');
            return;
        }
        wx.showModal({
            title: `发送给 ${name}`,
            editable: true,
            placeholderText: '给朋友留言(选填)',
            confirmText: '发送',
            success: res => {
                if (res.confirm) {
                    this.forward(conversation, (res.content || '').trim());
                }
            }
        });
    },

    _compositeTitle() {
        let conversation = this.messages[0].conversation;
        if (conversation.type === ConversationType.Single) {
            let me = wfc.getUserDisplayName(wfc.getUserId());
            let other = wfc.getUserDisplayName(conversation.target);
            return me === other ? `${me}的聊天记录` : `${me}和${other}的聊天记录`;
        }
        return '群聊的聊天记录';
    },

    _send(conversation, content) {
        return new Promise(resolve => {
            wfc.sendConversationMessage(conversation, content, [], null, null,
                () => resolve(true),
                (errorCode) => {
                    console.log('forward message error', errorCode);
                    resolve(false);
                });
        });
    },

    async forward(conversation, extraText) {
        showLoading('正在发送');
        let success = true;
        try {
            if (this.forwardType === 'composite') {
                let content = new CompositeMessageContent();
                content.title = this._compositeTitle();
                content.setMessages(this.messages.slice());
                try {
                    // 小程序不支持超大的合并消息(需要上传文件)，提前检查
                    content.encode();
                } catch (e) {
                    console.log('encode composite message error', e);
                    hideLoading();
                    toast('选择的消息过多，请减少后重试');
                    return;
                }
                success = await this._send(conversation, content);
            } else {
                for (const message of this.messages) {
                    if (message.messageContent instanceof ArticlesMessageContent) {
                        for (const link of message.messageContent.toLinkMessageContent()) {
                            success = (await this._send(conversation, link)) && success;
                        }
                    } else {
                        success = (await this._send(conversation, message.messageContent)) && success;
                    }
                }
            }
            if (extraText) {
                await this._send(conversation, new TextMessageContent(extraText));
            }
        } finally {
            hideLoading();
        }
        if (success) {
            wx.showToast({title: '已发送', icon: 'success'});
            setTimeout(() => wx.navigateBack(), 800);
        } else {
            toast('部分消息发送失败');
        }
    },
});
