import Long from "long";
import MessageStatus from "./messages/messageStatus";
import Conversation from "./model/conversation";
import ConversationInfo from "./model/conversationInfo";
import ConversationType from "./model/conversationType";
import FriendInfo from "./model/internal/friendInfo";
import NullGroupInfo from "./model/nullGroupInfo";
import NullUserInfo from "./model/nullUserInfo";
import UnreadCount from "./model/unreadCount";
import UserSettingScope from "./userSettingScope";
import MediaMessageContent from "./messages/mediaMessageContent";

export default class WfcStore {
    users = new Map(); // uid -> userInfo
    groups = new Map(); // groupId -> groupInfo
    favGroups = [];
    groupMembers = new Map(); // groupId -> groupMembers[]
    friends = new Map(); // uid -> friendInfo 
    friendRequests = [];
    messages = [];
    settings = [];
    conversationInfos = [];
    chatRoomMessageId = 100;
    messageId = 100;

    genConversationKey(conversation) {
        return conversation.type + '@' + conversation.target + '@' + conversation.line;
    }

    getUser(userId, groupId = '') {
        let userInfo = this.users.get(userId);
        if (userInfo === undefined) {
            userInfo = new NullUserInfo(userId);
        } else {
            let friendAlias = this.getFriendAlias(userId);
            if (friendAlias) {
                userInfo.displayName = friendAlias;
            }
            if (groupId.length > 0) {
                let member = this.getGroupMember(groupId, userId);
                userInfo.displayName = member.alias;
            }
        }

        return userInfo;
    }

    setUser(userInfo) {
        this.users.set(userInfo.uid, userInfo);
    }

    getGroupInfo(groupId) {
        let groupInfo = this.groups.get(groupId);
        if (groupInfo === undefined) {
            groupInfo = new NullGroupInfo(groupId);
        }
        return groupInfo;
    }

    setGroupInfo(groupInfo) {
        this.groups.set(groupInfo.target, groupInfo);
    }

    getGroupMembers(groupId) {
        return this.groupMembers.get(groupId);
    }

    setGroupMembers(groupId, members) {
        this.groupMembers.set(groupId, members)
    }

    removeGroupAndMembers(groupId) {
        this.groups.delete(groupId);
        this.groupMembers.delete(groupId);
    }

    updateGroupMembers(groupId, members) {
        let groupMembers = this.groupMembers.get(groupId);
        if (groupMembers) {
            for (let i = 0; i < members.length; i++) {
                let found = false;
                for (let j = 0; j < groupMembers.length; j++) {
                    if (groupMembers[j].memberId === members[i].memberId) {
                        groupMembers[j] = membersp[i];
                        found = true;
                    }
                }
                if (!found) {
                    groupMembers.push(members[i]);
                }
            }
        } else {
            this.groupMembers.set(groupId, members);
        }
    }

    getGroupMember(groupId, memberId) {
        let members = this.groupMembers.get(groupId);
        for (const member of members) {
            if (memberId === member.memberId) {
                return member;
            }
        }
        return null;
    }

    getFriendIds() {
        let ids = [];
        this.friends.forEach((friend, uid) => {
            if (friend.state === 0) {
                ids.push(friend.uid);
            }
        });
        return ids;
    }

    getBlackList() {
        let ids = [];
        this.friends.forEach((friend, uid) => {
            if (friend.state === 2) {
                ids.push(friend.uid);
            }
        });
        return ids;
    }

    isBlackListed(userId) {
        let friend = this.friends.get(userId);
        return friend.state === 2;
    }

    setBlackList(userId, block) {
        let friend = this.friends.get(userId);
        friend.state = block ? 2 : 0;
    }

    isMyFriend(uid) {
        let friend = this.friends.get(uid);
        return friend && friend.state === 0 ? true : false;
    }

    isBlocked(uid) {
        let friend = this.friends.get(uid);
        return friend && friend.state === 2;
    }

    insertFriend(friendInfo) {
        let info = this.friends.get(friendInfo.uid);
        if (!info || friendInfo.updateDt.compare(info.updateDt) > 0) {
            this.friends.set(friendInfo.uid, Object.assign(new FriendInfo(), friendInfo));
        }
    }

    addFavGroup(groupId) {
        let index = this.favGroups.indexOf(groupId);
        if (index >= 0) {
            return;
        }
        this.favGroups.push(groupId);
    }

    getFavGroups() {
        return this.favGroups;
    }

    isFavGroup(groupId) {
        let index = this.favGroups.indexOf(groupId);
        return index && index >= 0;
    }

    getFavGroupInfos() {
        let groupInfos = [];
        this.favGroups.map((groupId) => {
            let groupInfo = this.groups.get(groupId);
            groupInfos.push(groupInfo);
        });

        // TODO sort
        return groupInfos;
    }

    getFriendAlias(uid) {
        let friend = this.friends.get(uid);
        let alias = friend ? friend.alias : '';
        return alias.length > 0 ? alias : null;
    }

    getFriendUserInfos() {
        let userInfos = [];
        this.friends.forEach((friend, uid) => {
            if (friend.state === 0) {
                let userInfo = this.getUser(uid);
                userInfos.push(userInfo);
            }
        });
        // TODO sort

        return userInfos;
    }

    getConversationInfo(conversation) {
        let cs = this.conversationInfos.filter((info) => {
            return info.conversation.equal(conversation);
        });
        if (cs && cs.length > 0) {
            return cs[0];
        }
        return null;
    }

    clearConversationUnreadStatus(conversation) {
        let info = this.getConversationInfo(conversation);
        let count = 0;
        if (info) {
            count = info.unreadCount.unread + info.unreadCount.unreadMention + info.unreadCount.unreadMentionAll;
            info.unreadCount.unread = 0;
            info.unreadCount.unreadMention = 0;
            info.unreadCount.unreadMentionAll = 0;
        }
        return count;
    }

    getConversationReadMaxDt(conversation) {
        let maxDt = 0;
        this.messages.forEach((message) => {
            if (message.conversation.equal(conversation)) {
                if (message.timestamp > maxDt) {
                    maxDt = message.timestamp;
                }
            }
        });
        return maxDt;
    }

    clearAllUnreadStatus() {
        let count = 0;
        this.conversationInfos.forEach((info) => {
            count += info.unreadCount.unread + info.unreadCount.unreadMention + info.unreadCount.unreadMentionAll;
            info.unreadCount.unread = 0;
            info.unreadCount.unreadMention = 0;
            info.unreadCount.unreadMentionAll = 0;
        });
        return count;
    }

    getConversationInfos() {
        // TODO 排序还得考虑置顶
        return this.conversationInfos.sort((a, b) => {
            return a.timestamp - b.timestamp;
        });
    }

    getConversationList(types, lines) {
        return this.conversationInfos.filter((info) => {
            return types.indexOf(info.conversation.type) > -1 && lines.indexOf(info.conversation.line) > -1;
        });
    }

    searchFriends(keyword) {
        let friendsInfo = this.getFriendUserInfos();
        return friendsInfo.filter((info) => {
            return info.displayName.indexOf(keyword) >= 0;
        });
    }

    searchConversation(keyword, types = [0, 1, 2, 3], lines = [0, 1]) {
        return this.conversationInfos.filter((info) => {
            if (types.indexOf(info.conversation.type) < 0 || lines.indexOf(info.conversation.line) < 0) {
                return false;
            }
            let displayName;
            switch (info.conversation.type) {
                case ConversationType.Single:
                    let userinfo = this.getUser(info.conversation.target);
                    displayName = userinfo.displayName;
                    break;
                case ConversationType.Group:
                    let groupInfo = this.getGroupInfo(info.conversation.target);
                    displayName = groupInfo.displayName;
                    break;

                default:
                    break;
            }

            if (displayName && displayName.indexOf(keyword) > -1) {
                return true;
            }
            let lastMessage = info.lastMessage;
            if (lastMessage && lastMessage.content && lastMessage.content.searchableContent.indexOf(keyword) > -1) {
                return true;
            }

            return false;
        });
    }

    searchGroups(keyword) {
        let groups = [];
        this.groups.forEach((groupId, groupInfo) => {
            if (groupInfo.name.indexOf(keyword) > -1) {
                groups.push(groupInfo);
            }
        });
        return groups;
    }

    _findConversationInfoIndex(conversation) {
        for (let i in this.conversationInfos) {
            if (this.conversationInfos[i].conversation.equal(conversation)) {
                return i;
            }
        }
        return -1;
    }

    removeConversation(conversation, clearMsg = false) {
        let index = this._findConversationInfoIndex(conversation);
        if (index > -1) {
            this.conversationInfos.splice(index, 1);
        }
        if (clearMsg) {
            this.messages = this.messages.filter((message) => {
                return !message.conversation.equal(conversation);
            });
        }
    }

    setConversationTop(conversation, top) {
        let info = this.getConversationInfo(conversation);
        if (info) {
            info.isTop = top;
        }
    }

    setConversationSilent(conversation, silent) {
        let info = this.getConversationInfo(conversation);
        if (info) {
            info.isSilent = silent;
        }
    }

    setConversationDraft(conversation, draft) {
        let info = this.getConversationInfo(conversation);
        if (info) {
            info.draft = draft;
        }
    }

    getUnreadCount(types, lines) {
        let unreadCount = new UnreadCount();
        this.conversationInfos.forEach((info) => {
            if (types.indexOf(info.conversation.type) > -1 && lines.indexOf(info.conversation.line) > -1 && info.unreadCount) {
                unreadCount.unread += info.unreadCount.unread;
                unreadCount.unreadMention += info.unreadCount.unreadMention;
                unreadCount.unreadMentionAll += info.unreadCount.unreadMentionAll;
            }
        });
        return unreadCount;
    }

    getConversationUnreadCount(conversation) {
        let i = this._findConversationInfoIndex(conversation);
        if (i > -1) {
            let info = this.conversationInfos[i];
            return info.unreadCount;
        }
        return null;
    }

    insertConversationMessages(messages) {
        this.messages.push(...messages);
    }

    updateConversationLastMessage(message) {
        let info;
        let found = false;
        this.conversationInfos.forEach((c) => {
            if (c.conversation.equal(message.conversation)) {
                found = true;
                info = c;
            }
        });
        if (!found) {
            info = new ConversationInfo();
            info.conversation = message.conversation;
            info.timestamp = message.timestamp;
            info.unreadCount = new UnreadCount();
            this.conversationInfos.push(info);
        }
        info.lastMessage = message;
        if (message.direction === 1) {
            if (message.status === MessageStatus.Unread) {
                info.unreadCount.unread += 1;
            } else if (message.status === MessageStatus.Mentioned) {
                info.unreadCount.unreadMention += 1;
            } else if (message.status === MessageStatus.AllMentioned) {
                info.unreadCount.unreadMentionAll += 1;
            }
        }
    }

    getConversationMessages(conversation) {
        let cmsgs = this.messages.filter((message) => {
            return message.conversation.equal(conversation);
        });
        if (cmsgs && cmsgs.length > 0) {
            return cmsgs.sort((m1, m2) => {
                return m1.timestamp < m2.timestamp;
            });
        }

        return cmsgs;
    }

    clearConversationMessages(conversation) {
        this.messages = this.messages.filter((message) => {
            return !message.conversation.equal(conversation);
        });
        let conversationInfo = this.getConversationInfo(conversation);
        if (conversationInfo) {
            conversationInfo.lastMessage = null;
        }
    }

    searchMessage(keyword) {
        return this.messages.filter((message) => {
            return message.content.searchableContent.indexOf(keyword) > -1;
        });
    }

    searchConversationMessage(conversation, keyword) {
        let msgs = this.getConversationMessages(conversation);
        return msgs.filter((message) => {
            return message.content.searchableContent.indexOf(keyword) > -1;
        });
    }

    genChatRoomMessageId() {
        this.chatRoomMessageId++;
        return 0 - this.chatRoomMessageId;
    }

    genNormalMessageId() {
        return this.messageId++;
    }

    saveMessage(message) {
        let msg;
        if (message.messageUid) {
            msg = this.getMessageByUid(message.messageUid);
            if (msg) {
                console.log('message exist', message);
                return;
            }
        }
        if (message.messageId > 0) {
            msg = this.getMessageById(message.memberId);
            if (msg) {
                console.log('message exist', message);
                return;
            }
        }
        this.messages.push(message);
    }

    updateMessageById(message) {
        let i;
        for (let index = 0; index < this.messages.length; index++) {
            const element = this.messages[index];
            if (element.messageId === message.memberId) {
                i = index;
                break;
            }
        }
        if (i) {
            this.messages[i] = message;
            let conversationInfo = this.getConversationInfo(message.conversation);
            if (conversationInfo.lastMessage.messageId === message.messageId) {
                conversationInfo.lastMessage = message;
            }
        }
    }

    deleteMessageById(messageId) {
        let i;
        for (let index = 0; index < this.messages.length; index++) {
            const element = this.messages[index];
            if (element.messageId === messageId) {
                i = index;
                break;
            }
        }
        if (i) {
            let messages = this.messages.splice(i, 1);
            let msg = messages[0];
            let conversationInfo = this.getConversationInfo(msg.conversation);

            if (conversationInfo.lastMessage.messageId === messageId) {
                let cmsgs = this.getConversationMessages(msg.conversation);
                if (cmsgs && cmsgs.length > 0) {
                    conversationInfo.lastMessage = cmsgs[cmsgs.length - 1];
                }
            }
        }
    }

    deleteFriend(friendId) {
        this.friends.delete(friendId);
    }

    getMessageById(messageId) {
        let result = this.messages.filter((msg) => {
            msg.messageId === messageId;
        });
        if (result.length > 0) {
            return result[0];
        }
        return null;
    }

    getMessageByUid(messageUid) {
        let messageUidLong = messageUid instanceof Long ? messageUid : new Long(messageUid);
        let result = this.messages.filter((msg) => {
            return messageUidLong.compare(msg.messageUid) === 0;
        });
        if (result && result.length > 0) {
            return result[0];
        }
        return null;
    }

    setMediaMessagePlayed(messageId) {
        let result = false;
        let msg = this.getMessageById(messageId);
        if (msg.messageContent instanceof MediaMessageContent && msg.direction === 1) {
            msg.status = MessageStatus.Played;
            result = true;
        }
        return result;
    }

    // TODO 目前不需要
    // getMessages(conversation, fromIndex, before = true, count = 20, withUser = '') {
    //     let msgs = [];
    //     let msg;
    //     let timestamp;
    //     let tmpMsgs = this.messages.filter(message => {
    //         message.messageId === fromIndex;
    //     });
    //     if (tmpMsgs.length > 0) {
    //         timestamp = tmpMsgs[0].timestamp;
    //     } else {
    //         if (before) {
    //             timestamp = Number.MAX_SAFE_INTEGER;
    //         } else {
    //             timestamp = 0;
    //         }
    //     }


    //     if (before) {
    //         for (let i = this.messages.length - 1; i >= 0; i--) {
    //             msg = this.messages[i];
    //             if (msg.conversation.equal(conversation) && msg.timestamp < timestamp) {
    //                 if (withUser.length > 0 && (msg.direction === 0 && (msg.to === '' || msg.to === withUser))) {

    //                 } else {
    //                     msgs.push(msg);
    //                 }
    //             }

    //         }
    //     } else {

    //     }
    //     return msgs;
    // }

    updateUserSettings(settings) {
        settings.forEach((setting) => {
            let i = -1;
            for (let index = 0; index < this.settings.length; index++) {
                let element = this.settings[index];
                if (element.key === setting.key && element.scope === setting.scope) {
                    i = index;
                    break;
                }
            }
            if (i >= 0) {
                if (setting.value === '') {
                    this.settings.splice(i, 1);
                } else {
                    this.settings[i] = setting;
                }
            } else {
                if (setting.value !== '') {
                    this.settings.push(setting);
                }
            }

            if (setting.scope === UserSettingScope.ConversationSilent
                || setting.scope === UserSettingScope.ConversationTop
                || setting.scope === UserSettingScope.Conversation_Sync) {
                let key = setting.key;
                let type = parseInt(key.substring(0, key.indexOf('-')));
                let line = parseInt(key.substring(key.indexOf('-') + 1, key.lastIndexOf('-')));
                let target = key.substring(key.lastIndexOf('-') + 1);

                let conversation = new Conversation(type, target, line);
                let info = this.getConversationInfo(conversation);
                if (!info) {
                    info = this._genAndSaveDefaultConversationInfo(conversation);
                }
                if (setting.scope === UserSettingScope.ConversationSilent) {
                    info.isSilent = setting.value === '1';
                } else if (setting.scope === UserSettingScope.ConversationTop) {
                    info.isTop = setting.value === '1';
                } else if (setting.scope === UserSettingScope.Conversation_Sync) {
                    let dt = Long.fromString(setting.value);
                    // 更新已读状态
                    let msg = this.getConversationMessages(conversation);
                    msg.forEach((m) => {
                        if (dt.compare(m.timestamp) >= 0 &&
                            [MessageStatus.Unread, MessageStatus.AllMentioned, MessageStatus.Mentioned].indexOf(m.status) > -1) {
                            m.status = MessageStatus.Readed;
                        }
                    });
                }
            } else if (setting.scope === UserSettingScope.FavoriteGroup) {
                let index = this.favGroups.indexOf(setting.key);
                if (setting.value === '1') {
                    if (!index) {
                        this.favGroups.push(setting.key);
                    }
                } else {
                    if (index) {
                        this.favGroups = this.favGroups.splice(index, 1);
                    }
                }
            }

        });
    }

    _genAndSaveDefaultConversationInfo(conversation) {
        let info = new ConversationInfo();
        info.conversation = conversation;
        info.unreadCount = new UnreadCount();
        this.conversationInfos.push(info);
        return info;
    }

    getUserSetting(scope, key) {
        let settings = this.settings.filter((setting) => {
            return setting.scope === scope && setting.key === key;
        });

        if (settings.length > 0) {
            return settings[settings.length - 1];
        }
        return null;
    }

    getUserSettings(scope) {
        return this.settings.filter((setting) => {
            return setting.scope === scope;
        });
    }

    insertOrReplaceFriendRequest(friendRequest) {
        let i = -1;
        for (let index = 0; index < this.friendRequests.length; index++) {
            let element = this.friendRequests[index];
            if (element.direction === friendRequest.direction && element.target === friendRequest.target) {
                i = index;
                break;
            }
        }
        if (i >= 0) {
            this.friendRequests[i] = friendRequest;
        } else {
            this.friendRequests.push(friendRequest);
        }
    }

    getIncommingFriendRequest() {
        return this.friendRequests.filter((friendRequest) => {
            return friendRequest.direction === 1;
        });
    }

    getOutgoingFriendRequest() {
        return this.friendRequests.filter((friendRequest) => {
            return friendRequest.direction === 0;
        });
    }

    getUnreadFriendRequestCount() {
        let count = 0;
        this.friendRequests.forEach((friendRequest) => {
            if (friendRequest.direction === 1 && friendRequest.readStatus === 0) {
                count++;
            }

        });
        return count;
    }

    clearUnreadFriendRequestStatus() {
        let count = 0;
        this.friendRequests.forEach((friendRequest) => {
            if (friendRequest.direction === 1 && friendRequest.readStatus === 0) {
                friendRequest.readStatus = 1;
                count++;
            }
        });
        return count;
    }

    updateFriendRequestStatus(targetId, status) {
        this.friendRequests.forEach((friendRequest) => {
            if (friendRequest.target === targetId && friendRequest.direction === 1) {
                friendRequest.status = status;
            }
        });
    }

    getUnreadFriendRequestMaxDt() {
        let maxDt = 0;
        this.friendRequests.forEach((friendRequest) => {
            if (friendRequest.direction === 1 && friendRequest.readStatus === 0) {
                if (friendRequest.timestamp > maxDt) {
                    maxDt = friendRequest.timestamp;
                }
            }
        });
        return maxDt;
    }
}