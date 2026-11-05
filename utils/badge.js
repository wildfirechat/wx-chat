import wfc from "../wfc/client/wfc";
import ConnectionStatus from "../wfc/client/connectionStatus";

/**
 * tabBar 未读数角标
 * 注意：只有当前页面是 tabBar 页面时，设置才会生效，所以需要在 tab 页面的 onShow 中调用
 */

const TAB_CONVERSATION = 0;
const TAB_CONTACT = 1;

function setBadge(index, count) {
    if (count > 0) {
        wx.setTabBarBadge({
            index,
            text: count > 99 ? '99+' : String(count),
            fail: () => {
            }
        });
    } else {
        wx.removeTabBarBadge({
            index,
            fail: () => {
            }
        });
    }
}

/**
 * 计算未读消息数，免打扰的会话不计入
 * @param {[ConversationInfo]} conversationInfos 可选，已经获取的会话列表
 */
export function unreadMessageCount(conversationInfos) {
    let count = 0;
    try {
        // 和会话列表保持一致：单聊、群聊、频道
        let list = conversationInfos || wfc.getConversationList([0, 1, 3], [0, 1]);
        list.forEach(info => {
            if (!info.isSilent && info.unreadCount) {
                count += info.unreadCount.unread || 0;
            }
        });
    } catch (e) {
        console.log('unreadMessageCount error', e);
    }
    return count;
}

export function updateTabBarBadges(conversationInfos) {
    if (wfc.getConnectionStatus() !== ConnectionStatus.ConnectionStatusConnected) {
        return;
    }
    setBadge(TAB_CONVERSATION, unreadMessageCount(conversationInfos));
    let friendRequestCount = 0;
    try {
        friendRequestCount = wfc.getUnreadFriendRequestCount();
    } catch (e) {
        // ignore
    }
    setBadge(TAB_CONTACT, friendRequestCount);
}
