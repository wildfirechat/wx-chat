/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */

export default class EventType {
    // function (message) {}
    static SendMessage = 'sendMsg';
    // function (message, hasMore) {}
    static ReceiveMessage = 'receiveMsg';
    // function (Map(userId, receiveTime)) {}
    static MessageReceived = 'msgReceived';
    // function ([readEntry]) {}
    static MessageRead = 'msgRead';
    // 主动调用recallMessage时，也会触发
    // function (operator, messageUid) {}
    static RecallMessage = 'recallMsg';
    // 远程删除消息时触发
    // function (messageUid) {}
    static MessageDeleted = 'msgDeleted'
    // function (messageId) {}
    // 本地主动删除消息时触发
    static DeleteMessage = 'deleteMsg';
    // function (message) {}
    static MessageStatusUpdate = 'msgStatusUpdate';
    // function (connectionStatus) {}
    static ConnectionStatusChanged = 'connectionStatusChanged';
    // function (host/ip/port) {}
    static ConnectToServer = 'connectToServer';
    // function (userInfos) {}
    static UserInfosUpdate = 'userInfosUpdate';
    // function (channelInfos) {}
    static ChannelInfosUpdate = 'channelInfosUpdate';
    // function (groupInfos) {}
    static GroupInfosUpdate = 'groupInfosUpdate';
    // function (updatedFriendIds) {}
    static FriendListUpdate = 'friendListUpdate';
    // function ([newFriendRequests]) {}
    static FriendRequestUpdate = 'friendRequestUpdate';
    // function (conversationInfo) {}
    static ConversationInfoUpdate = 'conversationInfoUpdate';
    // function () {}
    static SettingUpdate = 'settingUpdate';
    // function (groupId, GroupMember[]) {}
    static GroupMembersUpdate = 'groupMembersUpdate';

    // function (event) {}
    static ConferenceEvent = 'conferenceEvent';
    // function (UserOnlineState[]) {}
    static UserOnlineEvent = 'onlineEvent';
    // function (targetId, playedMessageId) {}
    static SecretChatStartBurn = 'secretChatStartBurn';
    // function ([messageId]) {}
    static SecretChatMessageBurned = 'secretChatMessageBurned';
    // function (targetId) {}
    static SecretChatStateChange = 'secretChatStateChange';
}
