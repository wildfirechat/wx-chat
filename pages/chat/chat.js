import wfc from "../../wfc/client/wfc";
import Config from "../../config";
import EventType from "../../wfc/client/wfcEvent";
import ConnectionStatus from "../../wfc/client/connectionStatus";
import ConversationType from "../../wfc/model/conversationType";
import GroupMemberType from "../../wfc/model/groupMemberType";
import QuoteInfo from "../../wfc/model/quoteInfo";
import MessageContentType from "../../wfc/messages/messageContentType";
import MessageStatus from "../../wfc/messages/messageStatus";
import TextMessageContent from "../../wfc/messages/textMessageContent";
import ImageMessageContent from "../../wfc/messages/imageMessageContent";
import VideoMessageContent from "../../wfc/messages/videoMessageContent";
import SoundMessageContent from "../../wfc/messages/soundMessageContent";
import FileMessageContent from "../../wfc/messages/fileMessageContent";
import LocationMessageContent from "../../wfc/messages/locationMessageContent";
import CardMessageContent from "../../wfc/messages/cardMessageContent";
import TypingMessageContent from "../../wfc/messages/typingMessageContent";
import NotificationMessageContent from "../../wfc/messages/notification/notificationMessageContent";
import avenginekitproxy from "../../wfc/av/engine/avenginekitproxy";
import {eq, gt, lt, numberValue} from "../../wfc/util/longUtil";
import VoiceManager from './msg-type/voice-manager';
import {bindWfcEvents, unbindWfcEvents} from "../../utils/wfcEvents";
import {parseConversation, pickUsers, toUserDetail} from "../../utils/nav";
import {messageKey, messagesToItems} from "../../utils/messageView";
import {isSavable, openMessage, saveMedia} from "../../utils/messageActions";
import {confirm, showActionMenu, toast} from "../../utils/ui";
import {getImageInfo, makeThumbnail, mediaUrl} from "../../utils/media";
import Draft from "../../utils/draft";
import AppServerApi from "../../utils/appServerApi";

const PAGE_SIZE = 20;

const EXTRA_ACTIONS = [
    {action: 'album', picName: 'choose_picture', description: '相册'},
    {action: 'camera', picName: 'take_photos', description: '拍摄'},
    {action: 'audioCall', icon: '/image/icons/ext_audio_call.svg', description: '语音通话'},
    {action: 'videoCall', icon: '/image/icons/ext_video_call.svg', description: '视频通话'},
    {action: 'file', icon: '/image/icons/ext_file.svg', description: '文件'},
    {action: 'location', icon: '/image/icons/ext_location.svg', description: '位置'},
    {action: 'card', icon: '/image/icons/ext_card.svg', description: '名片'},
];

const TYPING_TIPS = ['对方正在输入...', '对方正在讲话...', '对方正在拍摄...', '对方正在选择位置...', '对方正在选择文件...'];

/**
 * 会话页面
 *
 * this.messages 保存 sdk 的原始消息，data.chatItems 只保存渲染需要的精简数据，两者一一对应
 */
Page({
    data: {
        title: '',
        subtitle: '',
        chatItems: [],
        scrollIntoView: '',
        showNewMessageTip: false,
        highlightKey: '',
        extraArr: EXTRA_ACTIONS,
        quote: null,
        multiSelect: false,
        selectedCount: 0,
        inputDisabled: false,
        inputDisabledTip: '',
    },

    onLoad(options) {
        this.conversation = parseConversation(options.conversation);
        this.messages = [];
        this.selectedKeys = new Set();
        // 被 @ 的用户 id，'All' 表示所有人
        this.mentions = [];
        this.quoteInfo = null;
        this.isBottom = true;
        // 定位到某条消息时，可能还有更新的消息没有加载
        this.hasNewer = false;
        this.noMoreOlder = false;
        this.loadingOlder = false;
        this.loadingNewer = false;
        this.lastTypingTime = 0;
        this.receiptEnabled = false;
        try {
            this.receiptEnabled = this.conversation.type === ConversationType.Single && wfc.isReceiptEnabled() && wfc.isUserReceiptEnabled();
        } catch (e) {
            // ignore
        }

        this.voiceManager = new VoiceManager(() => this.render());

        bindWfcEvents(this, {
            [EventType.ReceiveMessage]: 'onReceiveMessage',
            [EventType.SendMessage]: 'onSendMessage',
            [EventType.MessageStatusUpdate]: 'onMessageStatusUpdate',
            [EventType.RecallMessage]: 'onRecallMessage',
            [EventType.DeleteMessage]: 'onDeleteMessage',
            [EventType.MessageDeleted]: 'onMessageDeleted',
            [EventType.MessageRead]: 'onMessageRead',
            [EventType.UserInfosUpdate]: 'onInfosUpdate',
            [EventType.GroupInfosUpdate]: 'onInfosUpdate',
            [EventType.GroupMembersUpdate]: 'onInfosUpdate',
            [EventType.FriendListUpdate]: 'onInfosUpdate',
            [EventType.ConnectionStatusChanged]: 'onConnectionStatusChange',
        });

        this.updateTitle();
        this.updateInputState();

        let focusMessageId = Number(options.focusMessageId || 0);
        if (focusMessageId) {
            this.loadAround(focusMessageId);
        } else {
            this.loadLatest(true);
        }
        wfc.clearConversationUnreadStatus(this.conversation);
    },

    onReady() {
        this.chatInput = this.selectComponent('#chatInput');
        this.restoreDraft();
        this.measureScrollView();
    },

    measureScrollView() {
        wx.createSelectorQuery().select('.scroll-view').boundingClientRect(rect => {
            this.scrollViewHeight = rect ? rect.height : 0;
        }).exec();
    },

    onShow() {
        wfc.onForeground();
        if (this.shown) {
            // 从会话信息等页面返回，信息可能已变化
            this.updateTitle();
            this.updateInputState();
            let app = getApp();
            if (app.globalData.chatNeedsReload) {
                // 聊天记录被清空
                app.globalData.chatNeedsReload = false;
                this.messages = [];
                this.loadLatest(true, false);
            } else {
                this.render();
            }
        }
        this.shown = true;
    },

    onUnload() {
        this.saveDraft();
        this.voiceManager.destroy();
        clearTimeout(this.typingTimer);
        unbindWfcEvents(this);
        wfc.clearConversationUnreadStatus(this.conversation);
    },

    noop() {
    },

    // ==================== 标题、输入框状态 ====================

    isGroup() {
        return this.conversation.type === ConversationType.Group;
    },

    updateTitle() {
        let conversation = this.conversation;
        let title = conversation.target;
        if (conversation.type === ConversationType.Single) {
            title = wfc.getUserDisplayName(conversation.target);
        } else if (conversation.type === ConversationType.Group) {
            let groupInfo = wfc.getGroupInfo(conversation.target, false);
            title = groupInfo.remark || groupInfo.name || '群聊';
            if (groupInfo.memberCount) {
                title += `(${groupInfo.memberCount})`;
            }
        }
        if (title !== this.data.title) {
            this.setData({title});
        }
    },

    /**
     * 群禁言时，禁止输入
     */
    updateInputState() {
        let disabled = false;
        let tip = '';
        if (this.isGroup()) {
            let groupId = this.conversation.target;
            let groupInfo = wfc.getGroupInfo(groupId, false);
            let member = wfc.getGroupMember(groupId, wfc.getUserId());
            if (member) {
                if (member.type === GroupMemberType.Muted) {
                    disabled = true;
                    tip = '你已被禁言';
                } else if (groupInfo.mute === 1
                    && [GroupMemberType.Owner, GroupMemberType.Manager, GroupMemberType.Allowed].indexOf(member.type) === -1) {
                    disabled = true;
                    tip = '全员禁言中';
                }
            }
        }
        if (disabled !== this.data.inputDisabled || tip !== this.data.inputDisabledTip) {
            this.setData({inputDisabled: disabled, inputDisabledTip: tip});
        }
    },

    onNavMore() {
        if (this.data.multiSelect) {
            return;
        }
        wx.navigateTo({
            url: `/pages/conversation-info/conversation-info?conversation=${encodeURIComponent(JSON.stringify(this.conversation))}`
        });
    },

    // ==================== 消息加载 ====================

    _isDisplayMessage(message) {
        if (!message || !message.messageContent) {
            return false;
        }
        return message.messageId !== 0 || message.messageContent.type === MessageContentType.Streaming_Text_Generating;
    },

    _sortByTime(msgs) {
        return msgs.sort((a, b) => numberValue(a.timestamp) - numberValue(b.timestamp));
    },

    _dedupe(msgs) {
        let keys = new Set(this.messages.map(m => messageKey(m)));
        return msgs.filter(m => this._isDisplayMessage(m) && !keys.has(messageKey(m)));
    },

    /**
     * 加载最新的消息
     * @param scrollToBottom 是否滚动到底部
     * @param loadOlder 本地消息不足一页时，是否加载更早的消息(包括远程消息)
     */
    loadLatest(scrollToBottom, loadOlder = true) {
        wfc.getMessagesV2(this.conversation, 0, true, PAGE_SIZE, '', msgs => {
            this.messages = msgs.filter(m => this._isDisplayMessage(m));
            this.hasNewer = false;
            this.noMoreOlder = !loadOlder;
            this.render(scrollToBottom ? 'bottom' : null);
            if (loadOlder && msgs.length < PAGE_SIZE) {
                this.loadOlder();
            }
        }, err => {
            console.error('getMessagesV2 error', this.conversation, err);
        });
    },

    loadOlder() {
        if (this.loadingOlder || this.noMoreOlder) {
            return;
        }
        this.loadingOlder = true;
        let first = this.messages[0];
        let anchor = first ? 'msg-' + messageKey(first) : null;

        let prepend = (msgs) => {
            this.loadingOlder = false;
            msgs = this._dedupe(this._sortByTime(msgs || []));
            if (msgs.length === 0) {
                return false;
            }
            this.messages = msgs.concat(this.messages);
            this.render(anchor ? {anchor} : 'bottom');
            return true;
        };

        let loadRemote = (beforeUid) => {
            this.loadingOlder = true;
            wfc.loadRemoteConversationMessages(this.conversation, [], beforeUid, PAGE_SIZE, msgs => {
                msgs = msgs || [];
                if (prepend(msgs)) {
                    return;
                }
                // 远程消息里可能整页都是不需要显示的消息(比如音视频通话信令，messageId 为 0)，需要继续往前加载
                let oldest = null;
                msgs.forEach(m => {
                    if (m.messageUid && gt(m.messageUid, 0) && (!oldest || lt(m.messageUid, oldest))) {
                        oldest = m.messageUid;
                    }
                });
                if (oldest && (!beforeUid || lt(oldest, beforeUid))) {
                    loadRemote(oldest);
                } else {
                    this.noMoreOlder = true;
                }
            }, errorCode => {
                this.loadingOlder = false;
                console.log('load remote message error', errorCode);
            });
        };
        let firstUid = first && first.messageUid && gt(first.messageUid, 0) ? first.messageUid : 0;

        if (!first || !(first.messageId > 0)) {
            loadRemote(firstUid);
            return;
        }
        wfc.getMessagesV2(this.conversation, first.messageId, true, PAGE_SIZE, '', msgs => {
            if (!prepend(msgs)) {
                loadRemote(firstUid);
            }
        }, () => {
            this.loadingOlder = false;
        });
    },

    /**
     * 定位到某条消息，比如从搜索结果跳转过来
     */
    loadAround(messageId) {
        let message = wfc.getMessageById(messageId);
        if (!message) {
            this.loadLatest(true);
            return;
        }
        wfc.getMessagesV2(this.conversation, messageId, true, 10, '', before => {
            wfc.getMessagesV2(this.conversation, messageId, false, PAGE_SIZE, '', after => {
                this.messages = before.concat([message], after).filter(m => this._isDisplayMessage(m));
                this.hasNewer = after.length >= PAGE_SIZE;
                let key = messageKey(message);
                this.setData({highlightKey: key});
                this.render({anchor: 'msg-' + key});
                setTimeout(() => this.setData({highlightKey: ''}), 3000);
            }, () => this.loadLatest(true));
        }, () => this.loadLatest(true));
    },

    loadNewer() {
        if (!this.hasNewer || this.loadingNewer) {
            return;
        }
        let last = this.messages[this.messages.length - 1];
        if (!last) {
            return;
        }
        this.loadingNewer = true;
        wfc.getMessagesV2(this.conversation, last.messageId, false, PAGE_SIZE, '', msgs => {
            this.loadingNewer = false;
            this.hasNewer = msgs.length >= PAGE_SIZE;
            msgs = this._dedupe(msgs);
            if (msgs.length > 0) {
                this.messages = this.messages.concat(msgs);
                this.render();
            }
        }, () => {
            this.loadingNewer = false;
        });
    },

    // ==================== 渲染 ====================

    _readTime() {
        if (!this.receiptEnabled) {
            return undefined;
        }
        try {
            let readMap = wfc.getConversationRead(this.conversation);
            let readTime = readMap && readMap.get ? readMap.get(this.conversation.target) : 0;
            return readTime || 0;
        } catch (e) {
            return undefined;
        }
    },

    /**
     * @param scroll 'bottom' 滚动到底部；{anchor: id} 滚动到某个元素；其他不滚动
     */
    render(scroll) {
        let items = messagesToItems(this.messages, {
            readTime: this._readTime(),
            playingKey: this.voiceManager ? this.voiceManager.playingKey : null,
            selectedKeys: this.selectedKeys,
            multiSelect: this.data.multiSelect,
        });
        let data = {chatItems: items};
        if (this.data.multiSelect) {
            data.selectedCount = this.selectedKeys.size;
        }
        this.setData(data, () => {
            if (scroll === 'bottom') {
                this.scrollToBottom();
            } else if (scroll && scroll.anchor) {
                this.scrollIntoView(scroll.anchor);
            }
        });
    },

    scrollIntoView(id) {
        // scroll-into-view 的值不变时，不会触发滚动
        this.setData({scrollIntoView: ''}, () => {
            this.setData({scrollIntoView: id});
        });
    },

    scrollToBottom() {
        this.isBottom = true;
        if (this.data.showNewMessageTip) {
            this.setData({showNewMessageTip: false});
        }
        this.scrollIntoView('bottomElement');
    },

    onScroll(e) {
        const {scrollTop, scrollHeight} = e.detail;
        if (!this.scrollViewHeight) {
            this.measureScrollView();
            return;
        }
        this.isBottom = scrollHeight - scrollTop - this.scrollViewHeight < 50;
        if (this.isBottom && this.data.showNewMessageTip && !this.hasNewer) {
            this.setData({showNewMessageTip: false});
        }
    },

    onNewMessageTipClick() {
        if (this.hasNewer) {
            this.loadLatest(true);
        } else {
            this.scrollToBottom();
        }
    },

    onKeyboardHeightChange(e) {
        // 键盘弹出、收起后，消息列表高度变化
        setTimeout(() => this.measureScrollView(), 100);
        if (e.detail.height > 0 && !this.hasNewer) {
            this.scrollToBottom();
        }
    },

    resetInputStatus() {
        this.chatInput && this.chatInput.closeExtraView();
        wx.hideKeyboard();
    },

    // ==================== 消息事件 ====================

    _isCurrentConversation(message) {
        return message && message.conversation && this.conversation.equal(message.conversation);
    },

    _findIndex(message) {
        let streamId = message.messageContent && message.messageContent.streamId;
        let hasUid = message.messageUid && gt(message.messageUid, 0);
        return this.messages.findIndex(m => {
            if (message.messageId > 0 && m.messageId === message.messageId) {
                return true;
            }
            if (hasUid && m.messageUid && gt(m.messageUid, 0) && eq(m.messageUid, message.messageUid)) {
                return true;
            }
            return !!streamId && m.messageContent.type === MessageContentType.Streaming_Text_Generating
                && m.messageContent.streamId === streamId;
        });
    },

    /**
     * 新增或者更新消息
     */
    upsertMessage(message) {
        let index = this._findIndex(message);
        if (index >= 0) {
            this.messages[index] = message;
            this.render();
            return;
        }
        if (this.hasNewer) {
            // 当前不是最新的消息，不直接追加，避免消息不连续
            this.setData({showNewMessageTip: true});
            return;
        }
        this.messages.push(message);
        if (message.direction === 0 || this.isBottom) {
            this.render('bottom');
        } else {
            this.render();
            this.setData({showNewMessageTip: true});
        }
    },

    removeMessage(predicate) {
        let length = this.messages.length;
        this.messages = this.messages.filter(m => !predicate(m));
        if (this.messages.length !== length) {
            this.render();
        }
    },

    onReceiveMessage(message) {
        if (!this._isCurrentConversation(message)) {
            return;
        }
        if (message.messageContent instanceof TypingMessageContent) {
            if (message.from !== wfc.getUserId()) {
                this.showTyping(message.messageContent.typingType);
            }
            return;
        }
        if (!this._isDisplayMessage(message)) {
            return;
        }
        if (message.from !== wfc.getUserId()) {
            this.hideTyping();
        }
        wfc.clearConversationUnreadStatus(this.conversation);
        this.upsertMessage(message);
    },

    onSendMessage(message) {
        if (!this._isCurrentConversation(message) || !this._isDisplayMessage(message)) {
            return;
        }
        this.upsertMessage(message);
    },

    onMessageStatusUpdate(message) {
        if (!this._isCurrentConversation(message) || !this._isDisplayMessage(message)) {
            return;
        }
        this.upsertMessage(message);
    },

    onRecallMessage(operator, messageUid) {
        let message = wfc.getMessageByUid(messageUid);
        if (!message || !this._isCurrentConversation(message)) {
            return;
        }
        let index = this.messages.findIndex(m => m.messageUid && eq(m.messageUid, messageUid));
        if (index >= 0) {
            this.messages[index] = message;
            this.render();
        }
        if (this.quoteInfo && eq(this.quoteInfo.messageUid, messageUid)) {
            this.cancelQuote();
        }
    },

    onDeleteMessage(messageId) {
        this.removeMessage(m => m.messageId === messageId);
    },

    onMessageDeleted(messageUid) {
        this.removeMessage(m => m.messageUid && eq(m.messageUid, messageUid));
    },

    onMessageRead(readEntries) {
        if (!this.receiptEnabled) {
            return;
        }
        if ((readEntries || []).some(e => e.conversation && this.conversation.equal(e.conversation))) {
            this.render();
        }
    },

    onConnectionStatusChange(status) {
        // 小程序刚启动、还在连接中时(比如通过搜索进入会话)，本地的用户、群组信息还没有加载，SDK 加载后不会通知 UserInfosUpdate，
        // 所以开始接收消息(本地数据已加载)和连接成功时，各刷新一下
        if (status === ConnectionStatus.ConnectionStatusReceiveing || status === ConnectionStatus.ConnectionStatusConnected) {
            this.onInfosUpdate();
        }
    },

    onInfosUpdate() {
        this.updateTitle();
        this.updateInputState();
        // 头像、昵称可能变化
        clearTimeout(this.infoRenderTimer);
        this.infoRenderTimer = setTimeout(() => this.render(), 200);
    },

    // ==================== 正在输入 ====================

    showTyping(typingType) {
        if (this.conversation.type !== ConversationType.Single) {
            return;
        }
        this.setData({subtitle: TYPING_TIPS[typingType] || TYPING_TIPS[0]});
        clearTimeout(this.typingTimer);
        this.typingTimer = setTimeout(() => this.hideTyping(), 6000);
    },

    hideTyping() {
        clearTimeout(this.typingTimer);
        if (this.data.subtitle) {
            this.setData({subtitle: ''});
        }
    },

    notifyTyping(typingType) {
        if (this.conversation.type !== ConversationType.Single) {
            return;
        }
        let now = new Date().getTime();
        if (now - this.lastTypingTime > 10 * 1000) {
            this.lastTypingTime = now;
            wfc.sendConversationMessage(this.conversation, new TypingMessageContent(typingType));
        }
    },

    onTextChangeEvent(e) {
        this.draftDirty = true;
        if (e.detail.value) {
            this.notifyTyping(TypingMessageContent.TYPING_TEXT);
        } else {
            this.mentions = [];
        }
    },

    // ==================== 草稿 ====================

    restoreDraft() {
        let draft = Draft.getConversationDraft(this.conversation);
        if (draft.text && this.chatInput) {
            this.chatInput.setText(draft.text);
        }
        this.mentions = draft.mentionUserIds || [];
        if (draft.quoteInfo) {
            this.setQuote(draft.quoteInfo, false);
        }
        let conversationInfo = wfc.getConversationInfo(this.conversation);
        this.originalDraft = conversationInfo && conversationInfo.draft ? conversationInfo.draft : '';
        this.draftDirty = false;
    },

    /**
     * 离开会话时保存草稿，草稿没有变化时不保存，避免会话时间等发生变化
     */
    saveDraft() {
        if (!this.chatInput || !this.draftDirty) {
            return;
        }
        let text = this.chatInput.getText() || '';
        if (!text && !this.quoteInfo && !this.originalDraft) {
            return;
        }
        Draft.setConversationDraft(this.conversation, text, this.quoteInfo, this.mentions);
    },

    // ==================== 发送消息 ====================

    sendMessage(messageContent) {
        if (this.hasNewer) {
            this.loadLatest(true);
        }
        let messageId = 0;
        let refresh = () => {
            let message = messageId ? wfc.getMessageById(messageId) : null;
            if (message) {
                this.upsertMessage(message);
            }
        };
        wfc.sendConversationMessage(this.conversation, messageContent, [],
            (id) => {
                messageId = id;
                refresh();
            },
            null,
            () => refresh(),
            (errorCode) => {
                console.log('send message error', errorCode);
                refresh();
            });
    },

    onSendMessageEvent(e) {
        let text = e.detail.value;
        let content = new TextMessageContent(text);
        if (this.isGroup() && this.mentions.length > 0) {
            let groupId = this.conversation.target;
            if (this.mentions.indexOf('All') >= 0 && text.indexOf('@所有人') >= 0) {
                content.mentionedType = 2;
            } else {
                let targets = [];
                this.mentions.forEach(uid => {
                    if (uid !== 'All' && targets.indexOf(uid) === -1
                        && text.indexOf('@' + wfc.getGroupMemberDisplayName(groupId, uid)) >= 0) {
                        targets.push(uid);
                    }
                });
                if (targets.length > 0) {
                    content.mentionedType = 1;
                    content.mentionedTargets = targets;
                }
            }
        }
        if (this.quoteInfo) {
            content.setQuoteInfo(this.quoteInfo);
        }
        this.mentions = [];
        this.cancelQuote();
        this.sendMessage(content);
    },

    async onMentionEvent() {
        if (!this.isGroup()) {
            return;
        }
        let groupId = this.conversation.target;
        let uids = await pickUsers({
            title: '选择提醒的人',
            source: 'group',
            groupId,
            multi: false,
            mentionAll: true,
            excludes: [wfc.getUserId()],
        });
        if (uids.length === 0) {
            return;
        }
        let uid = uids[0];
        this.mentions.push(uid);
        this.draftDirty = true;
        let name = uid === 'All' ? '所有人' : wfc.getGroupMemberDisplayName(groupId, uid);
        // 输入框中已经有 @
        this.chatInput.appendText(name + ' ');
    },

    onVoiceRecordEvent(e) {
        const {recordStatus, duration, tempFilePath} = e.detail;
        if (recordStatus === 1) {
            this.voiceManager.stop();
            this.notifyTyping(TypingMessageContent.TYPING_VOICE);
        } else if (recordStatus === 2) {
            let seconds = Math.max(1, Math.floor(duration / 1000));
            this.sendMessage(new SoundMessageContent(tempFilePath, null, seconds));
        }
    },

    onExtraClickEvent() {
    },

    onExtraItemClickEvent(e) {
        let action = e.detail.action;
        if (!action) {
            let item = this.data.extraArr[parseInt(e.detail.index)];
            action = item && item.action;
        }
        this.chatInput && this.chatInput.closeExtraView();
        switch (action) {
            case 'album':
                this.chooseMedia(['album']);
                break;
            case 'camera':
                this.chooseMedia(['camera']);
                break;
            case 'audioCall':
                this.startVoip(true);
                break;
            case 'videoCall':
                this.startVoip(false);
                break;
            case 'file':
                this.chooseFile();
                break;
            case 'location':
                this.chooseLocation();
                break;
            case 'card':
                this.chooseCard();
                break;
            default:
                break;
        }
    },

    chooseMedia(sourceType) {
        this.notifyTyping(TypingMessageContent.TYPING_CAMERA);
        wx.chooseMedia({
            count: 9,
            mediaType: ['image', 'video'],
            sourceType,
            sizeType: ['compressed'],
            maxDuration: 60,
            success: async res => {
                for (const file of res.tempFiles) {
                    if (file.fileType === 'video') {
                        await this.sendVideo(file);
                    } else {
                        await this.sendImage(file.tempFilePath);
                    }
                }
            }
        });
    },

    async sendImage(path) {
        let info = await getImageInfo(path);
        let width = info ? info.width : 0;
        let height = info ? info.height : 0;
        let thumbnail = await makeThumbnail(path, width, height, this);
        let content = new ImageMessageContent(path, null, thumbnail);
        content.imageWidth = width;
        content.imageHeight = height;
        this.sendMessage(content);
    },

    async sendVideo(file) {
        let thumbnail = '';
        if (file.thumbTempFilePath) {
            let info = await getImageInfo(file.thumbTempFilePath);
            thumbnail = await makeThumbnail(file.thumbTempFilePath, info ? info.width : file.width, info ? info.height : file.height, this);
        }
        // 时长单位为毫秒，和 android/ios 保持一致
        let content = new VideoMessageContent(file.tempFilePath, null, thumbnail, Math.round((file.duration || 0) * 1000));
        this.sendMessage(content);
    },

    chooseFile() {
        this.notifyTyping(TypingMessageContent.TYPING_FILE);
        wx.chooseMessageFile({
            count: 9,
            type: 'all',
            success: res => {
                res.tempFiles.forEach(file => {
                    let content = new FileMessageContent(file.path, null, file.name, file.size);
                    content.name = file.name;
                    content.size = file.size;
                    this.sendMessage(content);
                });
            }
        });
    },

    chooseLocation() {
        this.notifyTyping(TypingMessageContent.TYPING_LOCATION);
        wx.chooseLocation({
            success: res => {
                let content = new LocationMessageContent(MessageContentType.Location);
                content.type = MessageContentType.Location;
                content.title = res.name || res.address || '位置';
                content.lat = res.latitude;
                content.long = res.longitude;
                content.thumbnail = '';
                this.sendMessage(content);
            },
            fail: err => {
                console.log('chooseLocation fail', err);
                if (err && err.errMsg && err.errMsg.indexOf('cancel') === -1) {
                    toast('无法获取位置，请检查授权');
                }
            }
        });
    },

    async chooseCard() {
        let uids = await pickUsers({title: '选择名片', multi: false});
        if (uids.length === 0) {
            return;
        }
        let userInfo = wfc.getUserInfo(uids[0], false);
        let name = wfc.getUserDisplayName(uids[0]);
        let confirmed = await confirm('发送名片', `确定发送 ${name} 的名片？`);
        if (!confirmed) {
            return;
        }
        let content = new CardMessageContent(0, userInfo.uid, userInfo.displayName, userInfo.portrait, wfc.getUserId());
        content.name = userInfo.name;
        this.sendMessage(content);
    },

    async startVoip(audioOnly) {
        if (this.conversation.type === ConversationType.Single) {
            avenginekitproxy.startCall(this.conversation, audioOnly, [this.conversation.target], '');
        } else if (this.isGroup()) {
            let uids = await pickUsers({
                title: '选择通话成员',
                source: 'group',
                groupId: this.conversation.target,
                multi: true,
                excludes: [wfc.getUserId()],
            });
            if (uids.length > 0) {
                avenginekitproxy.startCall(this.conversation, audioOnly, uids, '');
            }
        } else {
            toast('该会话不支持音视频通话');
        }
    },

    // ==================== 消息操作 ====================

    _messageByKey(key) {
        return this.messages.find(m => messageKey(m) === key);
    },

    onMessageTap(e) {
        if (this.data.multiSelect) {
            return;
        }
        let message = this._messageByKey(e.currentTarget.dataset.key);
        if (!message) {
            return;
        }
        let content = message.messageContent;
        if (content.type === MessageContentType.Voice) {
            this.voiceManager.toggle(messageKey(message), mediaUrl(content));
            if (message.messageId > 0 && message.direction === 1) {
                wfc.setMediaMessagePlayed(message.messageId);
            }
            return;
        }
        if (content.type === MessageContentType.VOIP_CONTENT_TYPE_START) {
            if (this.conversation.type === ConversationType.Single) {
                this.startVoip(!!content.audioOnly);
            }
            return;
        }
        openMessage(message, this.messages);
    },

    onAvatarTap(e) {
        if (this.data.multiSelect) {
            return;
        }
        let uid = e.currentTarget.dataset.uid;
        toUserDetail(uid, this.isGroup() ? this.conversation.target : '');
    },

    /**
     * 群里长按头像，@ 对方
     */
    onAvatarLongPress(e) {
        let uid = e.currentTarget.dataset.uid;
        if (!this.isGroup() || this.data.multiSelect || this.data.inputDisabled || uid === wfc.getUserId()) {
            return;
        }
        this.mentions.push(uid);
        this.draftDirty = true;
        this.chatInput.appendText('@' + wfc.getGroupMemberDisplayName(this.conversation.target, uid) + ' ');
    },

    onResendTap(e) {
        let message = this._messageByKey(e.currentTarget.dataset.key);
        if (!message) {
            return;
        }
        showActionMenu([{
            label: '重新发送',
            action: () => {
                wfc.deleteMessage(message.messageId);
                this.removeMessage(m => m === message);
                this.sendMessage(message.messageContent);
            }
        }]);
    },

    /**
     * 撤回的消息，重新编辑
     */
    onReeditTap(e) {
        let message = this._messageByKey(e.currentTarget.dataset.key);
        if (!message || !message.messageContent.originalSearchableContent) {
            return;
        }
        this.chatInput.setText(message.messageContent.originalSearchableContent);
        this.chatInput.focusInput();
        this.draftDirty = true;
    },

    _isRecallable(message) {
        if (!message || !(message.messageUid && gt(message.messageUid, 0)) || message.messageContent instanceof NotificationMessageContent) {
            return false;
        }
        let selfUid = wfc.getUserId();
        if (this.isGroup()) {
            let groupId = this.conversation.target;
            let groupInfo = wfc.getGroupInfo(groupId, false);
            if (groupInfo && groupInfo.owner === selfUid) {
                return true;
            }
            let fromMember = wfc.getGroupMember(groupId, message.from);
            let selfMember = wfc.getGroupMember(groupId, selfUid);
            if (fromMember && selfMember && selfMember.type === GroupMemberType.Manager
                && [GroupMemberType.Manager, GroupMemberType.Owner].indexOf(fromMember.type) === -1) {
                return true;
            }
        }
        let delta = wfc.getServerDeltaTime();
        let now = new Date().getTime();
        return message.direction === 0 && now - (numberValue(message.timestamp) - delta) < 60 * 1000;
    },

    _isForwardable(message) {
        let type = message.messageContent.type;
        return [MessageContentType.Voice, MessageContentType.VOIP_CONTENT_TYPE_START].indexOf(type) === -1
            && !(message.messageContent instanceof NotificationMessageContent)
            && message.status !== MessageStatus.Sending && message.status !== MessageStatus.SendFailure;
    },

    _isQuotable(message) {
        return [MessageContentType.VOIP_CONTENT_TYPE_START,
            MessageContentType.Voice,
            MessageContentType.Video,
            MessageContentType.Composite_Message,
            MessageContentType.Articles,
            MessageContentType.CONFERENCE_CONTENT_TYPE_INVITE].indexOf(message.messageContent.type) === -1
            && message.messageUid && gt(message.messageUid, 0);
    },

    _isFavable(message) {
        return [MessageContentType.VOIP_CONTENT_TYPE_START, MessageContentType.CONFERENCE_CONTENT_TYPE_INVITE]
                .indexOf(message.messageContent.type) === -1
            && message.messageUid && gt(message.messageUid, 0);
    },

    onMessageLongPress(e) {
        if (this.data.multiSelect) {
            return;
        }
        let message = this._messageByKey(e.currentTarget.dataset.key);
        if (!message) {
            return;
        }
        let content = message.messageContent;
        let items = [];
        if (content.type === MessageContentType.Text || content.type === MessageContentType.P_Text
            || content.type === MessageContentType.Streaming_Text_Generated) {
            items.push({label: '复制', action: () => this.copyMessage(message)});
        } else if (content.type === MessageContentType.Link) {
            items.push({label: '复制链接', action: () => wx.setClipboardData({data: content.url || ''})});
        }
        if (this._isForwardable(message)) {
            items.push({label: '转发', action: () => this.forwardMessages([message], 'normal')});
        }
        if (this._isFavable(message)) {
            items.push({label: '收藏', action: () => this.favMessage(message)});
        }
        if (this._isRecallable(message)) {
            items.push({label: '撤回', action: () => this.recallMessage(message)});
        }
        if (this._isQuotable(message) && !this.data.inputDisabled) {
            items.push({label: '引用', action: () => this.setQuote(QuoteInfo.initWithMessage(message))});
        }
        if (isSavable(message)) {
            items.push({label: '保存到相册', action: () => saveMedia(message)});
        }
        if (message.status === MessageStatus.Sending && content.localPath) {
            items.push({label: '取消发送', action: () => wfc.cancelSendingMessage(message.messageId)});
        }
        items.push({label: '多选', action: () => this.enterMultiSelect(message)});
        items.push({label: '删除', action: () => this.deleteMessage(message)});
        showActionMenu(items);
    },

    copyMessage(message) {
        let content = message.messageContent;
        wx.setClipboardData({data: content.content || content.text || ''});
    },

    favMessage(message) {
        AppServerApi.favMessage(message)
            .then(() => toast('已收藏', 'success'))
            .catch(e => {
                console.log('fav message error', e);
                toast('收藏失败');
            });
    },

    recallMessage(message) {
        wfc.recallMessage(message.messageUid, () => {
            let updated = wfc.getMessageByUid(message.messageUid);
            if (updated) {
                this.upsertMessage(updated);
            }
        }, errorCode => {
            console.log('recall message failed', errorCode);
            toast('撤回失败');
        });
    },

    deleteMessage(message) {
        if (message.messageId > 0) {
            wfc.deleteMessage(message.messageId);
        }
        this.removeMessage(m => m === message);
    },

    forwardMessages(messages, forwardType) {
        getApp().globalData.forwardMessages = messages;
        getApp().globalData.forwardType = forwardType;
        wx.navigateTo({url: '/pages/forward-chat-list/forward-chat-list'});
    },

    // ==================== 引用 ====================

    setQuote(quoteInfo, focus = true) {
        if (!quoteInfo) {
            return;
        }
        this.quoteInfo = quoteInfo;
        this.draftDirty = true;
        this.setData({
            quote: {
                name: quoteInfo.userDisplayName || '',
                digest: quoteInfo.messageDigest || '',
            }
        });
        if (focus && this.chatInput) {
            this.chatInput.focusInput();
        }
    },

    cancelQuote() {
        if (this.quoteInfo) {
            this.draftDirty = true;
        }
        this.quoteInfo = null;
        if (this.data.quote) {
            this.setData({quote: null});
        }
    },

    // ==================== 多选 ====================

    enterMultiSelect(message) {
        this.selectedKeys = new Set();
        if (message) {
            this.selectedKeys.add(messageKey(message));
        }
        this.resetInputStatus();
        this.setData({multiSelect: true}, () => this.render());
    },

    exitMultiSelect() {
        this.selectedKeys = new Set();
        this.setData({multiSelect: false, selectedCount: 0}, () => this.render());
    },

    onMessageCheckTap(e) {
        let key = e.currentTarget.dataset.key;
        let item = this.data.chatItems.find(i => i.key === key);
        if (!item || !item.selectable) {
            return;
        }
        if (this.selectedKeys.has(key)) {
            this.selectedKeys.delete(key);
        } else {
            if (this.selectedKeys.size >= 100) {
                toast('最多选择100条消息');
                return;
            }
            this.selectedKeys.add(key);
        }
        this.render();
    },

    _selectedMessages() {
        return this.messages.filter(m => this.selectedKeys.has(messageKey(m)));
    },

    onMultiForwardOneByOne() {
        let messages = this._selectedMessages().filter(m => this._isForwardable(m));
        if (messages.length === 0) {
            toast('请选择要转发的消息');
            return;
        }
        this.forwardMessages(messages, 'oneByOne');
        this.exitMultiSelect();
    },

    onMultiForwardComposite() {
        let messages = this._selectedMessages().filter(m => this._isForwardable(m));
        if (messages.length === 0) {
            toast('请选择要转发的消息');
            return;
        }
        this.forwardMessages(messages, 'composite');
        this.exitMultiSelect();
    },

    async onMultiDelete() {
        let messages = this._selectedMessages();
        if (messages.length === 0) {
            return;
        }
        let ok = await confirm('删除消息', `确定删除选中的${messages.length}条消息？`, '删除', '#fa5151');
        if (!ok) {
            return;
        }
        messages.forEach(m => {
            if (m.messageId > 0) {
                wfc.deleteMessage(m.messageId);
            }
        });
        let keys = new Set(messages.map(m => messageKey(m)));
        this.messages = this.messages.filter(m => !keys.has(messageKey(m)));
        this.exitMultiSelect();
    },
});
