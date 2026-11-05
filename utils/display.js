import wfc from "../wfc/client/wfc";
import Config from "../config";
import ConversationType from "../wfc/model/conversationType";

/**
 * 会话、用户、群组展示相关的通用方法
 */

export function portraitOrDefault(portrait) {
    return portrait || Config.DEFAULT_PORTRAIT_URL;
}

export function groupPortraitOrDefault(portrait) {
    return portrait || Config.DEFAULT_GROUP_PORTRAIT;
}

export function conversationTitle(conversation) {
    switch (conversation.type) {
        case ConversationType.Single:
            return wfc.getUserDisplayName(conversation.target);
        case ConversationType.Group: {
            let groupInfo = wfc.getGroupInfo(conversation.target, false);
            return groupInfo.remark || groupInfo.name || '群聊';
        }
        case ConversationType.Channel: {
            let channelInfo = wfc.getChannelInfo(conversation.target, false);
            return channelInfo && channelInfo.name ? channelInfo.name : conversation.target;
        }
        default:
            return conversation.target;
    }
}

export function conversationPortrait(conversation) {
    switch (conversation.type) {
        case ConversationType.Single:
            return portraitOrDefault(wfc.getUserInfo(conversation.target, false).portrait);
        case ConversationType.Group:
            return groupPortraitOrDefault(wfc.getGroupInfo(conversation.target, false).portrait);
        case ConversationType.Channel: {
            let channelInfo = wfc.getChannelInfo(conversation.target, false);
            return portraitOrDefault(channelInfo ? channelInfo.portrait : '');
        }
        default:
            return Config.DEFAULT_PORTRAIT_URL;
    }
}

/**
 * 用户列表展示数据
 */
export function userItem(userId, groupId = '') {
    let userInfo = wfc.getUserInfo(userId, false, groupId);
    return {
        uid: userId,
        name: groupId ? wfc.getGroupMemberDisplayNameEx(userInfo) : wfc.getUserDisplayNameEx(userInfo),
        portrait: portraitOrDefault(userInfo.portrait),
    };
}

/**
 * 按名称排序，中文按拼音顺序(依赖运行环境支持)
 */
export function sortByName(items, key = 'name') {
    return items.sort((a, b) => {
        let n1 = a[key] || '';
        let n2 = b[key] || '';
        try {
            return n1.localeCompare(n2, 'zh-Hans-CN');
        } catch (e) {
            return n1 < n2 ? -1 : (n1 > n2 ? 1 : 0);
        }
    });
}
