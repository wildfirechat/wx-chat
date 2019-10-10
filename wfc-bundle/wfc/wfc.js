import MessageContent from './messages/messageContent';
import MessageStatus from './messages/messageStatus';
import Conversation from './model/conversation';
import WfcImpl from './wfcImpl';
import ImageMessageContent from './messages/imageMessageContent';
import ConversationType from './model/conversationType';
import Message from './messages/message';
import { EventEmitter } from 'events';
import regeneratorRuntime from '../../utils/runtime.js'
// 其实就是imclient，后续可能需要改下名字
export class WfcManager {
    impl = new WfcImpl();
    eventEmiter = new EventEmitter();

    constructor() {
        this.impl.eventEmitter = this.eventEmiter;
    }

    /**
     * 
     * @param {messagecontent} content 
     */
    registerMessageContent(name, type, contentClazz) {
        this.impl.registerMessageContent(name, type, contentClazz);
    }

    disconnect() {
        this.impl.disconnect();
    }

    getClientId() {
        return this.impl.getClientId();
    }

    getUserId() {
        return this.impl.getUserId();
    }

    getServerDeltaTime() {
        return this.impl.getServerDeltaTime();
    }

    isLogin() {
        return this.impl.isLogin();
    }

    getConnectionStatus() {
        return this.impl.getConnectionStatus();
    }

    getMyGroupList() {
        return this.impl.getMyGroupList();
    }

    getUserInfo(userId, refresh = false) {
        return this.impl.getUserInfo(userId, refresh);
    }


    async searchUser(keyword, successCB, failCB) {
        this.impl.searchUser(keyword, successCB, failCB);
    }

    searchFriends(keyword) {
        return this.impl.searchFriends(keyword);
    }

    searchGroups(keyword) {
        return this.impl.searchGroups(keyword);
    }

    getIncommingFriendRequest() {
        return this.impl.getIncommingFriendRequest();
    }

    getOutgoingFriendRequest() {
        return this.impl.getOutgoingFriendRequest();
    }

    loadFriendRequestFromRemote() {
        return this.impl.loadFriendRequestFromRemote();
    }

    getUnreadFriendRequestCount() {
        return this.impl.getUnreadFriendRequestCount();
    }

    clearUnreadFriendRequestStatus() {
        return this.impl.clearUnreadFriendRequestStatus();
    }

    async deleteFriend(userId, successCB, failCB) {
        this.impl.deleteFriend(userId, successCB, failCB);
    }

    async handleFriendRequest(userId, accept, successCB, failCB) {
        this.impl.handleFriendRequest(userId, accept, successCB, failCB);
    }

    isBlackListed(userId) {
        return this.impl.isBlackListed(userId);
    }

    getBlackList() {
        return this.impl.getBlackList();
    }

    setBlackList(userId, block, successCB, failCB) {
        this.impl.setBlackList(userId, block, successCB, failCB);
    }

    getMyFriendList(fresh = false) {
        return this.impl.getMyFriendList(fresh);
    }

    async createGroup(groupId, groupType, name, portrait, memberIds = [], lines = [0], notifyContent, successCB, failCB) {
        this.impl.createGroup(groupId, groupType, name, portrait, memberIds, lines, notifyContent, successCB, failCB);
    }

    async setGroupManager(groupId, isSet, memberIds, lines, notifyMessageContent, successCB, failCB) {
        this.impl.setGroupManager(groupId, isSet, memberIds, lines, notifyMessageContent, successCB, failCB);
    }

    getGroupInfo(groupId, refresh = false) {
        return this.impl.getGroupInfo(groupId, refresh);
    }


    addGroupMembers(groupId, memberIds, notifyLines, notifyMessageContent, successCB, failCB) {
        this.impl.addGroupMembers(groupId, memberIds, notifyLines, notifyMessageContent, successCB, failCB);
    }

    getGroupMemberIds(groupId, fresh = false) {
        return this.impl.getGroupMemberIds(groupId, fresh);
    }

    getGroupMembers(groupId, fresh = false) {
        return this.impl.getGroupMembers(groupId, fresh);
    }

    getGroupMember(groupId, memberId) {
        return this.impl.getGroupMember(groupId, memberId);
    }

    kickoffGroupMembers(groupId, memberIds, notifyLines, notifyMsg, successCB, failCB) {
        this.impl.kickoffGroupMembers(groupId, memberIds, notifyLines, notifyMsg, successCB, failCB);
    }

    async quitGroup(groupId, lines, notifyMessageContent, successCB, failCB) {
        this.impl.quitGroup(groupId, lines, notifyMessageContent, successCB, failCB);
    }

    async dismissGroup(groupId, lines, notifyMessageContent, successCB, failCB) {
        this.impl.dismissGroup(groupId, lines, notifyMessageContent, successCB, failCB);
    }

    async modifyGroupInfo(groupId, type, newValue, lines, notifyMessageContent, successCB, failCB) {
        this.impl.modifyGroupInfo(groupId, type, newValue, lines, notifyMessageContent, successCB, failCB);
    }

    async modifyGroupAlias(groupId, alias, lines, notifyMessageContent, successCB, failCB) {
        this.impl.modifyGroupAlias(groupId, alias, lines, notifyMessageContent, successCB, failCB);
    }

    transferGroup(groupId, newOwner, lines, notifyMessageContent, successCB, failCB) {
        this.impl.transferGroup(groupId, newOwner, lines, notifyMessageContent, successCB, failCB);
    }

    getFavGroups() {
        return this.impl.getFavGroups();
    }

    isFavGroup(groupId) {
        return this.impl.isFavGroup(groupId);
    }

    async setFavGroup(groupId, fav, successCB, failCB) {
        this.impl.setFavGroup(groupId, fav, successCB, failCB);
    }

    getUserSetting(scope, key) {
        return this.impl.getUserSetting(scope, key);
    }

    getUserSettings(scope) {
        return this.impl.getUserSettings(scope);
    }

    async setUserSetting(scope, key, value, successCB, failCB) {
        this.impl.setUserSetting(scope, key, value, successCB, failCB);
    }

    modifyMyInfo(modifyMyInfoEntries, successCB, failCB) {
        this.impl.modifyMyInfo(entries, successCB, failCB);
    }

    isGlobalSlient() {
        this.impl.isGlobalSlient();
    }

    async setGlobalSlient(silent, successCB, failCB) {
        this.impl.setGlobalSlient(silent, successCB, failCB);
    }

    isHiddenNotificationDetail() {
        this.impl.isHiddenNotificationDetail();
    }

    async setHiddenNotificationDetail(hide, successCB, failCB) {
        this.impl.setHiddenNotificationDetail(hide, successCB, failCB);
    }

    isHiddenGroupMemberName(groupId) {
        return this.impl.isHiddenGroupMemberName(groupId);
    }

    async setHiddenGroupMemberName(groupId, hide, successCB, failCB) {
        this.impl.setHiddenGroupMemberName(groupId, hide, successCB, failCB);
    }

    async joinChatroom(chatroomId, successCB, failCB) {
        this.impl.joinChatroom(chatroomId, successCB, failCB);
    }

    async quitChatroom(chatroomId, successCB, failCB) {
        this.impl.quitChatroom(chatroomId, successCB, failCB);
    }

    async getChatroomInfo(chatroomId, updateDt, successCB, failCB) {
        this.impl.getChatroomInfo(chatroomId, updateDt, successCB, failCB);
    }

    async getChatroomMemberInfo(chatroomId, maxCount, successCB, failCB) {
        this.impl.getChatroomMemberInfo(chatroomId, maxCount, successCB, failCB);
    }

    createChannel(name, portrait, status, desc, extra, successCB, failCB) {
        this.impl.createChannel(name, portrait, status, desc, extra, successCB, failCB);
    }

    getChannelInfo(channelId, refresh) {
        return this.getChannelInfo(channelId, refresh);
    }

    async modifyChannelInfo(channelId, type, newValue, successCB, failCB) {
        this.impl.modifyChannelInfo(channelId, type, newValue, successCB, failCB);
    }

    searchChannel(keyword, successCB, failCB) {
        this.impl.searchChannel(keyword, successCB, failCB);
    }

    isListenedChannel(channelId) {
        return this.impl.isListenedChannel(channelId);
    }

    async listenChannel(channelId, listen, successCB, failCB) {
        this.impl.listenChannel(channelId, listen, successCB, failCB);
    }

    // return channelIds
    getMyChannels() {
        return this.impl.getMyChannels();
    }

    getListenedChannels() {
        return this.impl.getListenedChannels();
    }

    async destoryChannel(channelId, successCB, failCB) {
        this.impl.destoryChannel(channelId, successCB, failCB);
    }

    getConversationList(types, lines) {
        return this.impl.getConversationList(types, lines);
    }

    getConversationInfo(conversation) {
        return this.impl.getConversationInfo(conversation);
    }

    searchConversation(keyword, types = [], lines = []) {
        return this.impl.searchConversation(keyword, types, lines);
    }

    async removeConversation(conversation, clearMsg) {
        this.impl.removeConversation(conversation, clearMsg);
    }

    setConversationTop(conversation, top, successCB, failCB) {
        this.impl.setConversationTop(conversation, top, successCB, failCB);
    }

    setConversationSlient(conversation, silent, successCB, failCB) {
        this.impl.setConversationSlient(conversation, silent, successCB, failCB);
    }

    setConversationDraft(conversation, draft = '') {
        this.impl.setConversationDraft(conversation, draft);
    }

    getUnreadCount(types = [0, 1, 2], lines = [0]) {
        return this.impl.getUnreadCount(types, lines);
    }

    getConversationUnreadCount(conversation) {
        return this.impl.getConversationUnreadCount(conversation);
    }

    clearConversationUnreadStatus(conversation) {
        this.impl.clearConversationUnreadStatus(conversation);
    }

    clearAllUnreadStatus() {
        this.impl.clearAllUnreadStatus();
    }

    setMediaMessagePlayed(messageId) {
        return 'no implement'
        // this.impl.setMediaMessagePlayed(messageId);
    }

    isMyFriend(userId) {
        return this.impl.isMyFriend(userId);
    }

    async sendFriendRequest(userId, reason, successCB, failCB) {
        this.impl.sendFriendRequest(userId, reason, successCB, failCB);
    }

    /**
     * 
     * @param {Conversation} conversation
     * @param {number} fromIndex 
     * @param {boolean} before 
     * @param {number} count 
     * @param {string} withUser 
     */
    getMessages(conversation, fromIndex, before = true, count = 20, withUser = '') {
        return this.impl.getMessages(conversation, fromIndex, before, count, withUser);
    }

    loadRemoteMessages(conversation, beforeUid, count, successCB, failCB) {
        this.impl.loadRemoteMessages(conversation, beforeUid, count, successCB, failCB);
    }

    getMessageById(messageId) {
        return this.impl.getMessageById(messageId);
    }

    getMessageByUid(messageUid) {
        return this.impl.getMessageByUid(messageUid);
    }

    searchMessage(conversation, keyword) {
        return this.impl.searchMessage(conversation, keyword);
    }

    async sendConversationMessage(conversation, messageContent, toUsers, preparedCB, progressCB, successCB, failCB) {
        this.impl.sendConversationMessage(conversation, messageContent, toUsers, preparedCB, progressCB, successCB, failCB);
    }

    async sendMessage(message, preparedCB, progressCB, successCB, failCB) {
        this.impl.sendMessage(message, preparedCB, progressCB, successCB, failCB);
    }

    // toUsers 用来实现定向消息
    async sendMessageEx(message, toUsers = [], preparedCB, progressCB, successCB, failCB) {
        this.impl.sendMessageEx(message, toUsers, preparedCB, progressCB, successCB, failCB);
    }

    // 更新了原始消息的内容
    async recallMessage(messageUid, successCB, failCB) {
        this.impl.recallMessage(messageUid, successCB, failCB);
    }

    deleteMessage(messageId) {
        this.impl.deleteMessageById(messageId);
    }

    async clearMessages(conversation) {
        this.impl.clearMessages(conversation);
    }

    /**
     * 
     * @param {Conversation} conversation 
     * @param {MessageContent} messageContent 
     * @param {MessageStatus} status 
     * @param {boolean} notify 是否触发onReceiveMessage
     * @param {Number} serverTime 服务器时间，精度到毫秒
     */
    insertMessage(conversation, messageContent, status, notify = false, serverTime = 0) {
        this.impl.insertMessage(conversation, messageContent, status, notify, serverTime);
    }

    async updateMessageContent(messageId, messageContent) {
        this.impl.updateMessageContent(messageId, messageContent);
    }

    async uploadMedia(data, mediaType, successCB, failCB, progressCB) {
        this.impl.uploadMedia(data, mediaType, successCB, failCB, progressCB);
    }

    // 一定需要带上http://或者 wx://
    // 网页 http://pc.wildfirechat.cn
    // 微信小程序 wx://pc.wildifirechat.cn
    connect(appId, appKey, host, port, userId, clientId, token) {
        this.impl.connect(appId, appKey, host, port, userId, clientId, token);
    }

    async testSendImageMessage(file, thumbnail) {
        let imgMsg = new ImageMessageContent(file, thumbnail);
        let conv = new Conversation(ConversationType.Single, 'uiuJuJcc', 0);
        let msg = new Message(conv, imgMsg);

        let retValue = this.sendMessage(msg, function (messageId, timestamp) { //preparedCB
            console.log("sendMessage prepared:", messageId, timestamp);
        }, function (uploaded, total) { //progressCB
            console.log("sendMessage progress:", uploaded, total);
        }, function (messageUid, timestamp) { //successCB
            console.log("sendMessage success:", messageUid, timestamp);
        }, function (errorCode) { //errorCB
            console.log("sendMessage failed:", errorCode);
        });
        console.log("call sendMessage return:", retValue);
    }
}
// global.WfcManager = WfcManager;

const self = new WfcManager();
// global.WfcManager = self;
export default self;

// //remote
var username = 'GNMtGtZZ';
var clientId = '78E616BC-1F7C-405F-AB16-41539EA89150';
var token = 'Ni3ya43aML2x3fTWKwAsCuRE4SZpFi8ZDgqqgbmSfkWES0hIx6d8gvmFRIjT2Unhm6Et+wOV632kQrjMQTSo5Mu6u2yAL5fp0MVhI5E8Ln0/eohOsEK1JsFJfrc292l/9lrwgmCkqc7VhLcuYy/GEW6l2Db/rLXIkRMM2nSpYPE=';
var host = 'wildfirechat.cn';
var shortPort = 80;

// local
// var username = 'MUMmMm55'
// var clientId = '78E616BC-1F7C-405F-AB16-41539EA89150';
// var token = 'qQCBJD7nr31gtUB5zm4Oewhn3ec7Uxuw9aFJm7vwgNa9ZsYH0BQNgPjm4p9HNktC9t9kglUhoJokg2JzHkWJVuqqKNltOe5JWVNXf3qmvwQsogRYPErO6dxFhdRtx+ypgujYMJ9ZlRjZdJww0g55rwomXP9iWMjtupk9TxbnJgI='
// var host = '192.168.0.158';
// var shortPort = 80;


// self.connect(host, shortPort, username, token)
// self.impl.connect(host, username, clientId, token);