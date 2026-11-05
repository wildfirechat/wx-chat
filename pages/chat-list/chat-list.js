import EventType from '../../wfc/client/wfcEvent.js';
import ConnectionStatus from '../../wfc/client/connectionStatus.js';
import MessageStatus from "../../wfc/messages/messageStatus";
import ConversationType from "../../wfc/model/conversationType";
import Conversation from "../../wfc/model/conversation";
import wfc from "../../wfc/client/wfc";
import {timeFormat} from '../../utils/time'
import {bindWfcEvents, unbindWfcEvents} from "../../utils/wfcEvents";
import {toChat} from "../../utils/nav";
import {conversationPortrait, conversationTitle} from "../../utils/display";
import {messageDigest} from "../../utils/messageView";
import {updateTabBarBadges} from "../../utils/badge";
import {confirm, showActionMenu} from "../../utils/ui";
import Draft from "../../utils/draft";

const LOGOUT_STATUS = [
    ConnectionStatus.ConnectionStatusLogout,
    ConnectionStatus.ConnectionStatusRejected,
    ConnectionStatus.ConnectionStatusKickedOff,
    ConnectionStatus.ConnectionStatusTokenIncorrect,
    ConnectionStatus.ConnectionStatusSecretKeyMismatch,
    ConnectionStatus.ConnectionStatusServerDown,
];

/**
 * 会话列表页面
 */
Page({
    data: {
        conversations: [],
    },

    onLoad() {
        bindWfcEvents(this, {
            [EventType.ConnectionStatusChanged]: 'onConnectionStatusChange',
            [EventType.UserInfosUpdate]: 'scheduleRefresh',
            [EventType.GroupInfosUpdate]: 'scheduleRefresh',
            [EventType.GroupMembersUpdate]: 'scheduleRefresh',
            [EventType.ReceiveMessage]: 'scheduleRefresh',
            [EventType.SendMessage]: 'scheduleRefresh',
            [EventType.MessageStatusUpdate]: 'scheduleRefresh',
            [EventType.RecallMessage]: 'scheduleRefresh',
            [EventType.DeleteMessage]: 'scheduleRefresh',
            [EventType.MessageDeleted]: 'scheduleRefresh',
            [EventType.SettingUpdate]: 'scheduleRefresh',
            [EventType.ConversationInfoUpdate]: 'scheduleRefresh',
            [EventType.FriendRequestUpdate]: 'scheduleRefresh',
            [EventType.FriendListUpdate]: 'scheduleRefresh',
        });
        this.updateTitle(wfc.getConnectionStatus());
    },

    onUnload() {
        clearTimeout(this.refreshTimer);
        unbindWfcEvents(this);
    },

    onShow() {
        wfc.onForeground();
        this.visible = true;
        if (wfc.getConnectionStatus() === ConnectionStatus.ConnectionStatusConnected) {
            this.showConversationList();
        }
    },

    onHide() {
        this.visible = false;
    },

    onConnectionStatusChange(status) {
        this.updateTitle(status);
        if (status === ConnectionStatus.ConnectionStatusConnected) {
            this.showConversationList();
        }
        if (LOGOUT_STATUS.indexOf(status) >= 0) {
            console.log('reLaunch login page, connectionStatus', status);
            wx.clearStorage();
            wx.reLaunch({
                url: '../login/login',
            });
        }
    },

    updateTitle(status) {
        let title = '会话';
        if (status === ConnectionStatus.ConnectionStatusConnecting) {
            title = '连接中...';
        } else if (status === ConnectionStatus.ConnectionStatusReceiveing) {
            title = '收取中...';
        } else if (status === ConnectionStatus.ConnectionStatusUnconnected) {
            title = '会话(未连接)';
        }
        wx.setNavigationBarTitle({title});
    },

    /**
     * 事件可能密集触发，合并刷新
     */
    scheduleRefresh() {
        clearTimeout(this.refreshTimer);
        this.refreshTimer = setTimeout(() => this.showConversationList(), 150);
    },

    showConversationList() {
        if (wfc.getConnectionStatus() !== ConnectionStatus.ConnectionStatusConnected) {
            return;
        }
        let conversationInfos = wfc.getConversationList([ConversationType.Single, ConversationType.Group, ConversationType.Channel], [0, 1]);
        let items = conversationInfos.map(info => this.toItem(info));
        this.setData({conversations: items});
        if (this.visible) {
            updateTabBarBadges(conversationInfos);
        }
    },

    toItem(info) {
        let conversation = info.conversation;
        let unread = info.unreadCount || {};
        let lastMessage = info.lastMessage;
        let draft = Draft.getDraftDigest(info);
        let item = {
            key: `${conversation.type}-${conversation.target}-${conversation.line}`,
            conversation: {type: conversation.type, target: conversation.target, line: conversation.line},
            title: conversationTitle(conversation),
            portrait: conversationPortrait(conversation),
            unread: unread.unread || 0,
            isTop: !!info.top,
            isSilent: !!info.isSilent,
            time: '',
            prefix: '',
            digest: '',
            sendStatus: '',
        };
        if (unread.unreadMention > 0 || unread.unreadMentionAll > 0) {
            item.prefix = unread.unreadMention > 0 ? '[有人@我]' : '[@所有人]';
        }
        if (draft) {
            item.prefix = '[草稿]';
            item.digest = draft.replace(/\n/g, ' ');
        } else if (lastMessage && lastMessage.messageContent) {
            item.digest = messageDigest(lastMessage, conversation);
            if (lastMessage.direction === 0) {
                if (lastMessage.status === MessageStatus.Sending) {
                    item.sendStatus = 'sending';
                } else if (lastMessage.status === MessageStatus.SendFailure) {
                    item.sendStatus = 'failed';
                }
            }
            if (item.isSilent && item.unread > 1) {
                item.digest = `[${item.unread}条] ` + item.digest;
            }
        }
        let timestamp = lastMessage && lastMessage.timestamp ? lastMessage.timestamp : info.timestamp;
        if (timestamp) {
            item.time = timeFormat(timestamp);
        }
        return item;
    },

    _conversation(item) {
        return new Conversation(item.conversation.type, item.conversation.target, item.conversation.line);
    },

    chatTo(e) {
        let item = e.currentTarget.dataset.item;
        toChat(this._conversation(item));
    },

    onSearchTap() {
        wx.navigateTo({url: '/pages/search/search'});
    },

    onConversationLongTap(e) {
        let item = e.currentTarget.dataset.item;
        let conversation = this._conversation(item);
        let items = [
            {
                label: item.isTop ? '取消置顶' : '置顶聊天',
                action: () => wfc.setConversationTop(conversation, item.isTop ? 0 : 1, () => this.scheduleRefresh(), () => {
                })
            },
            {
                label: item.isSilent ? '取消免打扰' : '消息免打扰',
                action: () => wfc.setConversationSlient(conversation, !item.isSilent, () => this.scheduleRefresh(), () => {
                })
            },
            item.unread > 0 ? {
                label: '标为已读',
                action: () => {
                    wfc.clearConversationUnreadStatus(conversation);
                    this.scheduleRefresh();
                }
            } : {
                label: '标为未读',
                action: () => {
                    wfc.markConversationAsUnread(conversation, true);
                    this.scheduleRefresh();
                }
            },
            {
                label: '删除聊天',
                action: async () => {
                    let ok = await confirm('删除聊天', '删除后，将清空该聊天的本地消息记录', '删除', '#fa5151');
                    if (ok) {
                        wfc.removeConversation(conversation, true);
                        this.scheduleRefresh();
                    }
                }
            },
        ];
        showActionMenu(items);
    },
});
