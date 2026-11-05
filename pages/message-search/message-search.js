import wfc from "../../wfc/client/wfc";
import ConversationType from "../../wfc/model/conversationType";
import {numberValue} from "../../wfc/util/longUtil";
import {openChatAtMessage, parseConversation} from "../../utils/nav";
import {portraitOrDefault} from "../../utils/display";
import {splitByKeyword} from "../../utils/highlight";
import {timeFormat} from "../../utils/time";

const MAX_RESULT = 100;

/**
 * 会话内搜索聊天记录
 */
Page({
    data: {
        keyword: '',
        results: [],
        searched: false,
    },

    onLoad(options) {
        this.conversation = parseConversation(options.conversation);
        let keyword = options.keyword ? decodeURIComponent(options.keyword) : '';
        if (keyword) {
            this.setData({keyword});
            this.search(keyword);
        }
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

    search(keyword) {
        if (!keyword) {
            this.setData({results: [], searched: false});
            return;
        }
        let isGroup = this.conversation.type === ConversationType.Group;
        let messages = wfc.searchMessage(this.conversation, keyword) || [];
        messages.sort((a, b) => numberValue(b.timestamp) - numberValue(a.timestamp));
        let results = messages.slice(0, MAX_RESULT).map(m => {
            let userInfo = wfc.getUserInfo(m.from, false, isGroup ? this.conversation.target : '');
            let digest = '';
            try {
                digest = m.messageContent.digest(m);
            } catch (e) {
                // ignore
            }
            return {
                messageId: m.messageId,
                name: isGroup ? wfc.getGroupMemberDisplayNameEx(userInfo) : wfc.getUserDisplayNameEx(userInfo),
                portrait: portraitOrDefault(userInfo.portrait),
                time: timeFormat(m.timestamp),
                hl: splitByKeyword(digest, keyword, 16),
            };
        });
        this.setData({results, searched: true});
    },

    onResultTap(e) {
        let messageId = e.currentTarget.dataset.id;
        if (messageId) {
            openChatAtMessage(this.conversation, messageId);
        }
    },
});
