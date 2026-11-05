import wfc from "../../wfc/client/wfc";
import MessageContentType from "../../wfc/messages/messageContentType";
import ConversationType from "../../wfc/model/conversationType";
import VoiceManager from "../chat/msg-type/voice-manager";
import {messageKey, messagesToItems} from "../../utils/messageView";
import {openMessage} from "../../utils/messageActions";
import {mediaUrl} from "../../utils/media";
import {toUserDetail} from "../../utils/nav";
import {showActionMenu} from "../../utils/ui";

/**
 * 合并转发的聊天记录详情
 * 消息通过 getApp().globalData.compositeMessage 传递
 */
Page({
    data: {
        chatItems: [],
        multiSelect: false,
        highlightKey: '',
    },

    onLoad() {
        let message = getApp().globalData.compositeMessage;
        getApp().globalData.compositeMessage = null;
        if (!message || !message.messageContent) {
            wx.navigateBack();
            return;
        }
        let content = message.messageContent;
        wx.setNavigationBarTitle({title: content.title || '聊天记录'});
        this.messages = content.messages || [];
        this.voiceManager = new VoiceManager(() => this.render());
        this.render();
    },

    onUnload() {
        this.voiceManager && this.voiceManager.destroy();
    },

    render() {
        let items = messagesToItems(this.messages, {
            playingKey: this.voiceManager.playingKey,
        });
        // 聊天记录中，所有消息都显示在左侧，并显示发送者名称
        items.forEach((item, index) => {
            let m = this.messages[index];
            item.isMy = false;
            item.status = '';
            item.readStatus = '';
            if (item.type !== 'notification' && item.type !== 'rich') {
                let isGroup = m.conversation && m.conversation.type === ConversationType.Group;
                item.senderName = isGroup ? wfc.getGroupMemberDisplayName(m.conversation.target, m.from) : wfc.getUserDisplayName(m.from);
            }
        });
        this.setData({chatItems: items});
    },

    _messageByKey(key) {
        return this.messages.find(m => messageKey(m) === key);
    },

    onMessageTap(e) {
        let message = this._messageByKey(e.currentTarget.dataset.key);
        if (!message) {
            return;
        }
        if (message.messageContent.type === MessageContentType.Voice) {
            this.voiceManager.toggle(messageKey(message), mediaUrl(message.messageContent));
            return;
        }
        openMessage(message, this.messages);
    },

    onMessageLongPress(e) {
        let message = this._messageByKey(e.currentTarget.dataset.key);
        if (!message) {
            return;
        }
        let content = message.messageContent;
        if (content.type === MessageContentType.Text || content.type === MessageContentType.P_Text) {
            showActionMenu([{label: '复制', action: () => wx.setClipboardData({data: content.content || ''})}]);
        }
    },

    onAvatarTap(e) {
        toUserDetail(e.currentTarget.dataset.uid);
    },

    onAvatarLongPress() {
    },

    onResendTap() {
    },

    onReeditTap() {
    },

    onMessageCheckTap() {
    },

    noop() {
    },
});
