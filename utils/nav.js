import Conversation from "../wfc/model/conversation";
import ConversationType from "../wfc/model/conversationType";

/**
 * 页面跳转相关的通用方法
 */

export function encodeConversation(conversation) {
    return encodeURIComponent(JSON.stringify({
        type: conversation.type,
        target: conversation.target,
        line: conversation.line || 0,
    }));
}

/**
 * 兼容编码和未编码两种格式
 */
export function parseConversation(str) {
    let obj;
    try {
        obj = JSON.parse(decodeURIComponent(str));
    } catch (e) {
        obj = JSON.parse(str);
    }
    return new Conversation(obj.type !== undefined ? obj.type : obj.conversationType, obj.target, obj.line || 0);
}

/**
 * 打开会话
 * @param conversation
 * @param {object} options redirect: 是否替换当前页面；focusMessageId: 定位到某条消息
 */
export function toChat(conversation, options = {}) {
    let url = `/pages/chat/chat?conversation=${encodeConversation(conversation)}`;
    if (options.focusMessageId) {
        url += `&focusMessageId=${options.focusMessageId}`;
    }
    if (options.redirect) {
        wx.redirectTo({url});
    } else {
        wx.navigateTo({url});
    }
}

/**
 * 返回到会话页面，如果页面栈中已经存在该会话，直接返回，否则用会话页面替换当前页面
 */
export function backToChat(conversation) {
    const pages = getCurrentPages();
    for (let i = pages.length - 1; i >= 0; i--) {
        let p = pages[i];
        if (p.route === 'pages/chat/chat' && p.conversation && p.conversation.equal(conversation)) {
            wx.navigateBack({delta: pages.length - 1 - i});
            return;
        }
    }
    toChat(conversation, {redirect: true});
}

/**
 * 打开会话并定位到某条消息，如果页面栈中已经存在该会话，返回该会话页面并定位
 */
export function openChatAtMessage(conversation, messageId) {
    const pages = getCurrentPages();
    for (let i = pages.length - 1; i >= 0; i--) {
        let p = pages[i];
        if (p.route === 'pages/chat/chat' && p.conversation && p.conversation.equal(conversation)) {
            p.loadAround(messageId);
            wx.navigateBack({delta: pages.length - 1 - i});
            return;
        }
    }
    toChat(conversation, {focusMessageId: messageId});
}

export function toSingleChat(userId, options) {
    toChat(new Conversation(ConversationType.Single, userId, 0), options);
}

export function toUserDetail(userId, groupId = '') {
    wx.navigateTo({
        url: `/pages/user-detail/user-detail?userId=${encodeURIComponent(userId)}&groupId=${encodeURIComponent(groupId || '')}`
    });
}

/**
 * 选择用户
 * @param {object} options
 *  title: 标题
 *  source: 'friends' | 'group'，默认 friends
 *  groupId: source 为 group 时必须
 *  multi: 是否多选，默认 true
 *  excludes: 不显示的用户 id
 *  disabled: 显示，但不可选的用户 id(比如已经是群成员)
 *  mentionAll: 单选群成员时，是否显示 “所有人”
 * @return {Promise<[string]>} 选中的用户 id 列表，取消选择时返回空数组
 */
export function pickUsers(options = {}) {
    return new Promise(resolve => {
        let resolved = false;
        wx.navigateTo({
            url: '/pages/pick-user/pick-user',
            events: {
                picked: (userIds) => {
                    resolved = true;
                    resolve(userIds || []);
                },
                canceled: () => {
                    if (!resolved) {
                        resolve([]);
                    }
                }
            },
            success: res => {
                res.eventChannel.emit('options', options);
            },
            fail: () => resolve([])
        });
    });
}
