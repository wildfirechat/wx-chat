import wfc from "../../wfc/client/wfc";
import Conversation from "../../wfc/model/conversation";
import ConversationType from "../../wfc/model/conversationType";
import {openChatAtMessage, toChat, toUserDetail} from "../../utils/nav";
import {conversationPortrait, conversationTitle, groupPortraitOrDefault, portraitOrDefault} from "../../utils/display";
import {splitByKeyword} from "../../utils/highlight";
import {messageDigest} from "../../utils/messageView";

const MAX_PER_SECTION = 20;

/**
 * 全局搜索：联系人、群聊、聊天记录
 */
Page({
    data: {
        keyword: '',
        contacts: [],
        groups: [],
        conversations: [],
    },

    onUnload() {
        clearTimeout(this.searchTimer);
    },

    onSearchInput(e) {
        let keyword = (e.detail.value || '').trim();
        this.setData({keyword});
        clearTimeout(this.searchTimer);
        this.searchTimer = setTimeout(() => this.search(keyword), 300);
    },

    onCancel() {
        wx.navigateBack();
    },

    search(keyword) {
        if (!keyword) {
            this.setData({contacts: [], groups: [], conversations: []});
            return;
        }
        let contacts = (wfc.searchFriends(keyword) || []).slice(0, MAX_PER_SECTION).map(u => ({
            uid: u.uid,
            name: wfc.getUserDisplayNameEx(u),
            portrait: portraitOrDefault(u.portrait),
            hl: splitByKeyword(wfc.getUserDisplayNameEx(u), keyword),
        }));

        let groups = (wfc.searchGroups(keyword) || []).slice(0, MAX_PER_SECTION).map(r => {
            let g = r.groupInfo;
            let name = g.remark || g.name || '群聊';
            let item = {
                groupId: g.target,
                name,
                portrait: groupPortraitOrDefault(g.portrait),
                hl: splitByKeyword(name, keyword),
                desc: '',
            };
            if (r.matchMembers && r.matchMembers.length > 0 && name.toLowerCase().indexOf(keyword.toLowerCase()) === -1) {
                item.desc = '包含：' + r.matchMembers.join('、');
            }
            return item;
        });

        let conversations = [];
        (wfc.searchConversation(keyword, [ConversationType.Single, ConversationType.Group], [0]) || []).some(r => {
            let conversation = r.conversation;
            let matchCount = r.matchCount;
            let matchMessage = r.matchMessage;
            if (matchCount === undefined) {
                // 小程序 SDK 返回的是 ConversationInfo，没有匹配的消息数；名称匹配的会话也会返回，需要自己搜索消息
                let messages = wfc.searchMessage(conversation, keyword) || [];
                matchCount = messages.length;
                matchMessage = messages.length === 1 ? messages[0] : null;
            }
            if (!matchCount) {
                // 只是名称匹配，已经在联系人、群聊里展示了
                return false;
            }
            let desc;
            if (matchCount === 1 && matchMessage) {
                desc = splitByKeyword(messageDigest(matchMessage, conversation), keyword);
            } else {
                desc = {before: `${matchCount}条相关聊天记录`, match: '', after: ''};
            }
            conversations.push({
                key: `${conversation.type}-${conversation.target}-${conversation.line}`,
                conversation: {type: conversation.type, target: conversation.target, line: conversation.line},
                title: conversationTitle(conversation),
                portrait: conversationPortrait(conversation),
                desc,
                matchCount,
                messageId: matchCount === 1 && matchMessage ? matchMessage.messageId : 0,
            });
            return conversations.length >= MAX_PER_SECTION;
        });

        this.setData({contacts, groups, conversations});
    },

    onContactTap(e) {
        toUserDetail(e.currentTarget.dataset.uid);
    },

    onGroupTap(e) {
        toChat(new Conversation(ConversationType.Group, e.currentTarget.dataset.id, 0));
    },

    onConversationTap(e) {
        let item = e.currentTarget.dataset.item;
        let conversation = new Conversation(item.conversation.type, item.conversation.target, item.conversation.line);
        if (item.messageId) {
            openChatAtMessage(conversation, item.messageId);
        } else {
            wx.navigateTo({
                url: `/pages/message-search/message-search?conversation=${encodeURIComponent(JSON.stringify(item.conversation))}&keyword=${encodeURIComponent(this.data.keyword)}`
            });
        }
    },

    onSearchUser() {
        wx.navigateTo({url: `/pages/search-user/search-user?keyword=${encodeURIComponent(this.data.keyword)}`});
    },
});
