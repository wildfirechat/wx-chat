import { decode as base64Decode, encode as base64Encode } from 'base64-arraybuffer';
import { EventEmitter } from 'events';
import Long from 'long';
// import uuid from 'uuid';
import { AESDecrypt, AESEncrypt, Uint8ToStr } from './internal/aes';
// import connect from '../lib/connect';
import connect from '../proto.min.js'
import MessageConfig from './messageConfig';
import MediaMessageContent from './messages/mediaMessageContent';
import Message from './messages/message';
import MessageContent from './messages/messageContent';
import MessageContentType from './messages/messageContentType';
import MessageStatus from './messages/messageStatus';
import RecallMessageNotification from './messages/notification/recallMessageNotification';
import PersistFlag from './messages/persistFlag';
import TextMessageContent from './messages/textMessageContent';
import ChannelInfo from './model/channelInfo';
import ChatRoomMemberInfo from './model/chatRoomMemberInfo';
import Conversation from './model/conversation';
import ConversationType from './model/conversationType';
import FriendRequest from './model/friendRequest';
import GroupInfo from './model/groupInfo';
import GroupMember from './model/groupMember';
import GroupMemberType from './model/groupMemberType';
import NullGroupInfo from './model/nullGroupInfo';
import NullUserInfo from './model/nullUserInfo';
import UserInfo from './model/userInfo';
import UserSettingScope from './userSettingScope';
import EventType from './wfcEvent';
import WfcStore from './wfc_store';
import ConnectionStatus from './connectionStatus';
import regeneratorRuntime from '../../utils/runtime.js';
// import {encode as , decode } from '../utils/base64-arraybuffer.js';

var protobuf = require('../weichatPb/protobuf.js');
protobuf.util.Long = Long;
protobuf.configure();

var protocol = require('./protocol');
var protocolRoot = protobuf.Root.fromJSON(protocol);


var AddFriendRequest = protocolRoot.lookupType("AddFriendRequest");
var AddGroupMemberRequest = protocolRoot.lookupType("AddGroupMemberRequest");
var BlackUserRequest = protocolRoot.lookupType("BlackUserRequest");
var ConnectAckPayload = protocolRoot.lookupType("ConnectAckPayload");
var PbConversation = protocolRoot.lookupType("Conversation");
var CreateGroupRequest = protocolRoot.lookupType("CreateGroupRequest");
var DismissGroupRequest = protocolRoot.lookupType("DismissGroupRequest");
var GetFriendRequestResult = protocolRoot.lookupType("GetFriendRequestResult");
var GetFriendsResult = protocolRoot.lookupType("GetFriendsResult");
var GetUploadTokenResult = protocolRoot.lookupType("GetUploadTokenResult");
var GetUserSettingResult = protocolRoot.lookupType("GetUserSettingResult");
var PbGroup = protocolRoot.lookupType("Group");
var PbGroupInfo = protocolRoot.lookupType("GroupInfo");
var PbGroupMember = protocolRoot.lookupType("GroupMember");
var HandleFriendRequest = protocolRoot.lookupType("HandleFriendRequest");
var IDBuf = protocolRoot.lookupType("IDBuf");
var IMHttpWrapper = protocolRoot.lookupType("IMHttpWrapper");
var INT64Buf = protocolRoot.lookupType("INT64Buf");
var LoadRemoteMessages = protocolRoot.lookupType("LoadRemoteMessages");
var PbMessage = protocolRoot.lookupType("Message");
var PbMessageContent = protocolRoot.lookupType("MessageContent");
var ModifyGroupInfoRequest = protocolRoot.lookupType("ModifyGroupInfoRequest");
var ModifyGroupMemberAlias = protocolRoot.lookupType("ModifyGroupMemberAlias");
var ModifyUserSettingReq = protocolRoot.lookupType("ModifyUserSettingReq");
var NotifyMessage = protocolRoot.lookupType("NotifyMessage");
var PullGroupInfoResult = protocolRoot.lookupType("PullGroupInfoResult");
var PullGroupMemberRequest = protocolRoot.lookupType("PullGroupMemberRequest");
var PullGroupMemberResult = protocolRoot.lookupType("PullGroupMemberResult");
var PullMessageRequest = protocolRoot.lookupType("PullMessageRequest");
var PullMessageResult = protocolRoot.lookupType("PullMessageResult");
var PullUserRequest = protocolRoot.lookupType("PullUserRequest");
var PullUserResult = protocolRoot.lookupType("PullUserResult");
var QuitGroupRequest = protocolRoot.lookupType("QuitGroupRequest");
var RemoveGroupMemberRequest = protocolRoot.lookupType("RemoveGroupMemberRequest");
var RouteRequest = protocolRoot.lookupType("RouteRequest");
var RouteResponse = protocolRoot.lookupType("RouteResponse");
var SearchUserRequest = protocolRoot.lookupType("SearchUserRequest");
var SearchUserResult = protocolRoot.lookupType("SearchUserResult");
var SetGroupManagerRequest = protocolRoot.lookupType("SetGroupManagerRequest");
var TransferGroupRequest = protocolRoot.lookupType("TransferGroupRequest");
var UserRequest = protocolRoot.lookupType("UserRequest");
var UserSettingEntry = protocolRoot.lookupType("UserSettingEntry");
var Version = protocolRoot.lookupType("Version");
var ModifyMyInfoRequest = protocolRoot.lookupType("ModifyMyInfoRequest");

// Attention 如果是node环境的话，需要打开下面的注释
// TODO 微信不支持，得重写，wx.createRequest
// var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest

// 其实就是imclient，后续可能需要改下名字
export default class WfcImpl {
    host = '';
    // host = 'mqtt://192.168.31.113'
    connectionStatus = 0;
    userId = '';
    token = '';
    mqttClient;
    msgHead; // long object

    clientId = '';
    // clientId = 'a0c9c783acc1f2d51560265077026';
    privateSecret = '';

    store = new WfcStore();

    // TODO 移除吧，全都走EventEmitter
    // onReceiveMessageListeners = [];

    messageContentList = new Map();

    eventEmitter;

    isPullingSetting = false;
    settingHead = new Long(0);
    friendHead = new Long(0);
    friendRequestHead = new Long(0);
    deltaTime = 0;

    onConnectionChanged(status) {
        this.connectionStatus = status;
        this.eventEmitter.emit(EventType.ConnectionStatusChanged, status);
        console.log('connection status changed', status);
    }

    // /**
    //  * 
    //  * @param {function} listener 
    //  */
    // setOnReceiveMessageListener(listener) {
    //     if (typeof listener !== 'function') {
    //         console.log('listener should be a function');
    //         return;
    //     }
    //     self.onReceiveMessageListeners.forEach(l => {
    //         l === listener
    //         return
    //     });
    //     self.onReceiveMessageListeners.push(listener);
    // }

    // removeOnReceiMessageListener(listener) {
    //     if (typeof listener !== 'function') {
    //         console.log('listener should be a function');
    //         return;
    //     }
    //     self.onReceiveMessageListeners.splice(self.onReceiveMessageListeners.indexOf(listener), 1);
    // }

    onReceiveMessage(messages) {
        let needUpdateGroups = [];
        let needUpdateGroupMembers = [];

        messages.forEach(m => {
            let msg = Message.fromProtoMessage(m);
            if (msg) {
                let messageTpyes = [
                    MessageContentType.CreateGroup_Notification,
                    MessageContentType.AddGroupMember_Notification,
                    MessageContentType.KickOffGroupMember_Notification,
                    MessageContentType.TransferGroupOwner_Notification,
                    MessageContentType.ModifyGroupAlias_Notification,
                ];
                if (messageTpyes.indexOf(msg.content.type) > -1) {
                    needUpdateGroups.push(msg.conversation.target);
                    needUpdateGroupMembers.push(msg.conversation.target);
                }

                messageTpyes = [
                    MessageContentType.ChangeGroupName_Notification,
                    MessageContentType.ChangeGroupPortrait_Notification,
                    MessageContentType.MuteGroupMember_Notification,
                    MessageContentType.ChangeJoinType_Notification,
                    MessageContentType.ChangePrivateChat_Notification,
                    MessageContentType.ChangeSearchable_Notificaiton,
                    MessageContentType.SetGroupManager_Notification,
                ];
                if (messageTpyes.indexOf(msg.content.type) > -1) {
                    needUpdateGroups.push(msg.conversation.target);
                }

                messageTpyes = [
                    MessageContentType.QuitGroup_Notification,
                    MessageContentType.DismissGroup_Notification,
                ];
                if (messageTpyes.indexOf(msg.content.type) > -1) {
                    this.store.removeGroupAndMembers(msg.conversation.target);
                    this.store.removeConversation(msg.conversation);
                }

                let flag = MessageConfig.getMessageContentPersitFlag(msg.content.type);
                if (flag === PersistFlag.Persist || flag === PersistFlag.Persist_And_Count) {
                    msg.messageId = this.store.genNormalMessageId();
                    this.store.saveMessage(msg);
                    this.store.updateConversationLastMessage(msg);
                }

                this.eventEmitter.emit(EventType.ReceiveMessage, msg);
            }
        });

        needUpdateGroups.forEach(groupId => {
            // this.getGroupInfo(groupId, true);
            this._reloadGroupInfoFromRemote(groupId);
        });
        needUpdateGroupMembers.forEach(groupId => {
            this.getGroupMembers(groupId, true);
        });
    }

    onGroupInfoUpdate(groupListIds) {
        // TODO
    }

    onChannelInfoUpdate(channelListIds) {
        // TODO

    }

    onSettingUpdate() {
        // TODO 具体更新的信息
        this.eventEmitter.emit(EventType.SettingUpdate);
    }

    onRecallMessage(operatorUid, messageUid) {
        // 更新消息
        let msg = this.store.getMessageByUid(messageUid);
        if (!msg || msg.messageId === 0) {
            return;
        }
        let content = new RecallMessageNotification(operatorUid, messageUid);
        msg.content = content;
        this.store.updateMessageById(msg);
        this.store.updateConversationLastMessage(msg);

        this.eventEmitter.emit(EventType.ReceiveMessage, operatorUid, messageUid);
    }

    onMessageDeleted(messageId) {
        this.eventEmitter.emit(EventType.DeleteMessage, messageId);
    }

    onUserInfoUpdate(userIds) {
        console.log('userIndo update, ids', userIds);
        let userIdA = JSON.parse(userIds);
        userIdA.map((userId => {
            this._reloadUserInfoFromRemote(userId);
            this.eventEmitter.emit(EventType.UserInfoUpdate, userId);
        }))
    }

    onFriendListUpdate(friendListIds) {
        console.log('friendList update, ids', friendListIds);
        this.eventEmitter.emit(EventType.FriendListUpdate, friendListIds);
    }

    onFriendRequestUpdate() {
        // TODO
    }

    /**
     * 
     * @param {messagecontent} content 
     */
    registerMessageContent(name, type, contentClazz) {
        MessageConfig.registerMessageContent(name, type, contentClazz);
    }

    connect(host, userId, clientId, token) {
        connect(host, userId, clientId, token, (client, privateSecret, connectTime) => {
            this.mqttClient = client;
            this.privateSecret = privateSecret;

            this.mqttClient.on('connect', (packet) => {
                let ack = ConnectAckPayload.decode(packet.payload);
                this.msgHead = ack.msgHead;
                console.log('connect msgHead', ack.msgHead);
                this._pullFriends(ack.friendHead);
                this._pullFriendRequest(ack.friendRqHead);
                this._pullUserSettings(Long.MAX_VALUE);

                let cur = new Date().getTime();
                this.deltaTime = Number(ack.serverTime) - cur - (cur - connectTime) / 2;

                console.log('------------', Number(ack.serverTime), connectTime, this.deltaTime);
                this.onConnectionChanged(ConnectionStatus.ConnectionStatusConnecting);

                // connected, for testing your code
                // this.test();
            });

            this.mqttClient.on('error', (err) => {
                this.eventEmitter.emit('error', err);
                console.log('error', err);
            })

            // 这儿来的数据未加密
            this.mqttClient.on('message', (topic, message, packet) => {
                console.log('on push', topic);
                if (topic === 'MS') {
                    let msg = PbMessage.decode(message);
                    let msgs = [];
                    msgs.push(msg);
                    this.onReceiveMessage(msgs);
                } else if (topic === 'MN') {
                    if (!this.msgHead) {
                        return;
                    }
                    var notifyMessage = NotifyMessage.decode(message);
                    var pullMessageRequest = PullMessageRequest.encode({
                        'id': this.msgHead,
                        'type': notifyMessage.type,
                    }).finish();

                    this._publish("MP", pullMessageRequest, (errorCode, data) => {
                        if (errorCode !== 0) {
                            console.log('pull message error', errorCode);
                            return;
                        }
                        var pr = PullMessageResult.decode(data);
                        this.msgHead = pr.current;
                        this.onReceiveMessage(pr.message);
                    });
                } else if (topic === 'FN') {
                    if (message.length === 8) {
                        let head = this._getLongFromBuffer(message);
                        this._pullFriends(head);
                    }
                } else if (topic === 'FRN') {
                    if (message.length === 8) {
                        let head = this._getLongFromBuffer(message);
                        this._pullFriendRequest(head);
                    }
                } else if (topic === 'UN') {
                    if (message.length === 8) {
                        let head = this._getLongFromBuffer(message);
                        this._pullUserSettings(head);
                    }
                } else if (topic === 'RMN') {
                    this.onRecallMessage(recall.fromUser, recall.id);
                }
            });

        });
    }

    _getLongFromBuffer(buffer) {
        return Long.fromBytesBE(buffer.slice(0, 8));
    }

    _getStringFromBuffer(buffer) {
        return buffer.toString();
    }

    _pullUserSettings(head) {
        if (this.isPullingSetting || this.settingHead.compare(head) >= 0) {
            return;
        }
        this.isPullingSetting = true;
        let version = Version.create()
        version.version = this.settingHead;
        let request = Version.encode(version).finish();

        this._publish("UG", request, (errorCode, data) => {
            this.isPullingSetting = false;
            if (errorCode !== 0) {
                console.log('pull user setting error', errorCode);
                return;
            }
            var ur = GetUserSettingResult.decode(data);
            ur.entry.map((e) => {
                if (new Long(e.updateDt).compare(this.settingHead) > 0) {
                    this.settingHead = e.updateDt;
                }
            });
            this.store.updateUserSettings(ur.entry);

            this.onConnectionChanged(ConnectionStatus.ConnectionStatusConnected);
            this.onSettingUpdate();
        });
    }

    _updateUserSetting(scope, key, value, successCB, failCB) {
        let modifySettingReq = ModifyUserSettingReq.create();
        modifySettingReq.scope = scope;
        modifySettingReq.key = key;
        modifySettingReq.value = value;

        let requestData = ModifyUserSettingReq.encode(modifySettingReq).finish();

        this._publish("UP", requestData, (errorCode, data) => {
            if (errorCode === 0) {
                let settings = [];
                let setting = new UserSettingEntry();
                setting.scope = scope;
                setting.key = key;
                setting.value = value;
                settings.push(setting);
                this.store.updateUserSettings(settings);
                if (successCB) {
                    successCB();
                }
            } else {
                if (failCB) {
                    failCB(errorCode);
                }
            }
        });
    }

    _pullFriends(head) {
        if (this.friendHead.compare(head) >= 0) {
            return 0;
        }
        let version = Version.create();
        version.version = this.friendHead;
        let requet = Version.encode(version).finish();
        this._publish('FP', requet, (errorCode, data) => {
            if (errorCode !== 0) {
                console.log('pull friend error', errorCode);
                return;
            }
            var fr = GetFriendsResult.decode(data);
            console.log('fr', fr);
            let uids = [];
            fr.entry.map((e) => {
                if (new Long(e.updateDt).compare(this.friendHead) > 0) {
                    this.friendHead = e.updateDt;
                }
                uids.push(e.uid);
                this.store.insertFriend(e);
            });
            this.onFriendListUpdate(uids);
        });
    }

    _pullFriendRequest(head) {
        if (this.friendRequestHead.compare(head) >= 0) {
            return;
        }
        this.loadFriendRequestFromRemote();
    }

    disconnect() {
        this.mqttClient.end();
    }


    getClientId() {
        if (!this.clientId || this.clientId.length === 0) {
            this.clientId = uuid.v1();
        }
        return this.clientId;
    }

    getUserId() {
        return this.userId;
    }

    getServerDeltaTime() {
        return this.deltaTime;
    }

    isLogin() {
        return this.token && this.token.length > 0;
    }

    getConnectionStatus() {
        return this.connectionStatus;
    }

    getMyGroupList() {
        return this.store.getFavGroups();
    }

    _publish(topic, data, cb) {
        var encryptData = this._encrypt(data);
        this.mqttClient.publish(topic, encryptData, { qos: 1, retain: true, dup: true }, (err, packet) => {
            if (err) {
                console.log('publis error', topic, err);
                if (cb) {
                    cb(-1);
                }
                return;
            }
            var errorCode = packet.payload[0];
            if (errorCode !== 0) {
                console.log('publish business errorCode', errorCode);
                if (cb) {
                    cb(errorCode);
                }
                return;
            } else {
                let decryptData = null;
                if (packet.payload.length > 1) {
                    decryptData = this._decryptPublishResponse(packet);
                }
                if (cb) {
                    cb(0, decryptData);
                }
            }
        });
    }

    async _reloadUserInfoFromRemote(userId) {
        console.log('reload userInfo from remote', userId);
        var userRequest = new UserRequest();
        userRequest.uid = userId;
        userRequest.updateDt = 0;
        var pullUserRequest = new PullUserRequest();
        pullUserRequest.request.push(userRequest);
        this._publish("UPUI", PullUserRequest.encode(pullUserRequest).finish(), (errorCode, data) => {
            if (errorCode !== 0) {
                console.log('reloadUserInfoFromRemote error', errorCode);
                return;
            }
            var result = PullUserResult.decode(data).result;
            if (result.length > 0) {
                result.map((ur) => {
                    let userInfo = Object.assign(new UserInfo(), ur.user);
                    console.log('load userInfo from remote', userInfo);
                    this.store.setUser(userInfo);
                    this.eventEmitter.emit(EventType.UserInfoUpdate, userInfo);
                });
            }
        });
    }

    getUserInfo(userId, refresh = false) {
        var userInfo = this.store.getUser(userId);

        console.log('getUserInfo', refresh, userInfo instanceof NullGroupInfo);
        if (refresh || userInfo instanceof NullUserInfo) {
            console.log('----------reload');
            this._reloadUserInfoFromRemote(userId);
        }
        return userInfo;
    }


    async searchUser(keyword, successCB, failCB) {
        let request = SearchUserRequest.create();
        request.fuzzy = 1;
        request.keyword = keyword;
        request.page = 0;
        this._publish('US', SearchUserRequest.encode(request).finish(), (errorCode, data) => {
            if (errorCode === 0) {
                if (successCB) {
                    let result = SearchUserResult.decode(data);
                    // let userInfo = Object.assign(new UserInfo(), ur.user);
                    successCB(result.entry);
                }

            } else {
                if (failCB) {
                    failCB(errorCode);
                }
            }
        });
    }

    searchFriends(keyword) {
        return this.store.searchFriends(keyword);
    }

    searchGroups(keyword) {
        return this.store.searchGroups(keyword);
    }

    getIncommingFriendRequest() {
        return this.store.getIncommingFriendRequest();
    }

    getOutgoingFriendRequest() {
        return this.store.getOutgoingFriendRequest();
    }

    loadFriendRequestFromRemote() {
        let request = Version.create();
        request.version = this.friendRequestHead;

        this._publish('FRP', Version.encode(request).finish(), (errorCode, data) => {
            if (errorCode === 0) {
                let result = GetFriendRequestResult.decode(data);
                result.entry.forEach((request) => {
                    let friendRequest = new FriendRequest();
                    friendRequest.status = request.status;
                    friendRequest.reason = request.reason;
                    if (request.fromUid === this.getUserId()) {
                        friendRequest.direction = 0;
                        friendRequest.target = request.toUid;
                        friendRequest.readStatus = request.fromReadStatus;
                    } else {
                        friendRequest.direction = 1;
                        friendRequest.target = request.fromUid;
                        friendRequest.readStatus = request.toReadStatus;
                    }
                    friendRequest.timestamp = request.updateDt;
                    this.store.insertOrReplaceFriendRequest(friendRequest);
                });
            }
        });
    }

    getUnreadFriendRequestCount() {
        return this.store.getUnreadFriendRequestCount();
    }

    clearUnreadFriendRequestStatus() {
        let maxDt = this.store.getUnreadFriendRequestMaxDt();
        if (maxDt === 0) {
            return;
        }
        let count = this.store.clearUnreadFriendRequestStatus();
        if (count > 0) {
            let request = Version.create();
            request.version = maxDt instanceof Long ? maxDt : new Long(maxDt);
            this._publish('FRUS', Version.encode(request).finish(), (errorCode, data) => {
                // do nothing now
            });
        }
    }

    async deleteFriend(userId, successCB, failCB) {
        let request = IDBuf.create();
        request.id = userId;
        this._publish('FDL', IDBuf.encode(request).finish(), (errorCode, data) => {
            if (errorCode === 0) {
                this.store.deleteFriend(userId);
                if (successCB) {
                    successCB();
                }
            } else {
                failCB(errorCode);
            }

        });
    }

    async handleFriendRequest(userId, accept, successCB, failCB) {
        let request = HandleFriendRequest.create();
        request.status = accept ? 1 : 2;
        request.targetUid = userId;
        this._publish('FHR', HandleFriendRequest.encode(request).finish(), (errorCode, data) => {
            if (errorCode === 0) {
                this.store.updateFriendRequestStatus(userId, request.status);
                if (successCB) {
                    successCB();
                }
            } else {
                if (failCB) {
                    failCB(errorCode);
                }
            }
        });
    }

    isBlackListed(userId) {
        this.store.isBlackListed(userId);
    }

    getBlackList() {
        return this.store.getBlackList();
    }

    setBlackList(userId, block, successCB, failCB) {
        let request = BlackUserRequest.create();
        request.status = block ? 2 : 1;
        request.uid = userId;
        this._publish('BLU', BlackUserRequest.encode(request).finish(), (errorCode, data) => {
            if (errorCode === 0) {
                this.store.setBlackList(userId, block);
                if (successCB) {
                    successCB();
                }
            } else {
                if (failCB) {
                    failCB();
                }
            }
        });
    }

    getMyFriendList(fresh = false) {
        let uids = this.store.getFriendIds();
        if (fresh || uids.length === 0) {
            this._getMyFriendListFromRemote();
        }
        return uids;
    }

    async _getMyFriendListFromRemote() {
        this._pullFriends(Long.MAX_VALUE);
    }

    async createGroup(groupId, groupType, name, portrait, memberIds = [], lines = [0], notifyContent, successCB, failCB) {
        groupId = !groupId ? '' : groupId;
        let myUid = this.getUserId();

        let group = PbGroup.create();
        let groupInfo = PbGroupInfo.create();
        groupInfo.targetId = groupId;
        groupInfo.type = groupType;
        groupInfo.name = name;
        groupInfo.portrait = portrait;
        group.groupInfo = groupInfo;

        if (!memberIds.includes(myUid)) {
            memberIds.push(myUid);
        }

        memberIds.map((memberId) => {
            let member = PbGroupMember.create();
            member.memberId = memberId;
            member.type = GroupMemberType.Normal;
            if (memberId === myUid) {
                member.type = GroupMemberType.Owner;
            }
            group.members.push(member);
        });

        let createGroupReq = CreateGroupRequest.create();
        createGroupReq.group = group;
        createGroupReq.toLine = lines;
        createGroupReq.notifyContent = this._toProtoMessageContent(notifyContent);

        this._publish('GC', CreateGroupRequest.encode(createGroupReq).finish(), (errorCode, data) => {
            if (errorCode === 0) {
                let groupId = data.toString();
                if (successCB) {
                    successCB(groupId);
                }
                console.log('create group success', groupId);
            } else {
                console.log('create group error', errorCode);
                if (failCB) {
                    failCB(errorCode);
                }
            }
        });
    }

    async setGroupManager(groupId, isSet, memberIds, lines, notifyMessageContent, successCB, failCB) {
        let setGroupManagerRequest = SetGroupManagerRequest.create();
        setGroupManagerRequest.type = isSet ? 1 : 0;
        setGroupManagerRequest.groupId = groupId;
        setGroupManagerRequest.userId = memberIds;
        setGroupManagerRequest.toLine = lines;
        setGroupManagerRequest.notifyContent = this._toProtoMessageContent(notifyMessageContent);

        this._publish('GSM', SetGroupManagerRequest.encode(setGroupManagerRequest).finish(), (errorCode, data) => {
            if (errorCode === 0) {
                if (successCB) {
                    successCB();
                }
                console.log('set group manager success', groupId);
            } else {
                console.log('set group manager error', errorCode);
                if (failCB) {
                    failCB(errorCode);
                }
            }
        });
    }

    async _reloadGroupInfoFromRemote(groupId) {
        var userRequest = new UserRequest();
        userRequest.uid = groupId;
        userRequest.updateDt = 0;
        var pullUserRequest = new PullUserRequest();
        pullUserRequest.request.push(userRequest);
        this._publish('GPGI', PullUserRequest.encode(pullUserRequest).finish(), (errorCode, data) => {
            if (errorCode !== 0) {
                console.log('reloadGroupInfoFromRemote error', errorCode);
                return;
            }
            var result = PullGroupInfoResult.decode(data).info;
            if (result.length > 0) {
                result.forEach((info) => {
                    let groupInfo = Object.assign(new GroupInfo(), info);
                    groupInfo.target = info.targetId;
                    delete groupInfo.targetId;
                    console.log('load groupInfo from remote', groupInfo);
                    this.store.setGroupInfo(groupInfo);
                    this.eventEmitter.emit(EventType.GroupInfoUpdate, groupInfo);
                });
            }
        });
    }

    async _reloadGroupMembersFromRemote(groupId, updateDt) {
        var requet = PullGroupMemberRequest.create();
        requet.target = groupId;
        requet.head = updateDt;
        this._publish('GPGM', PullGroupMemberRequest.encode(requet).finish(), (errorCode, data) => {
            if (errorCode !== 0) {
                console.log('reloadGroupMembersFromRemote error', errorCode);
                return;
            }

            let result = PullGroupMemberResult.decode(data).member;
            let groupMembers = [];
            result.forEach(member => {
                let groupMember = new GroupMember();
                groupMember.groupId = groupId;
                groupMember.alias = member.alias;
                groupMember.type = member.type;
                groupMember.memberId = member.memberId;
                groupMember.updateDt = member.updateDt;
                groupMembers.push(groupMember);
            });

            console.log('loadGroupMembersFromRemote', groupId, groupMembers);
            this.store.updateGroupMembers(groupId, groupMembers);
            let groupInfo = this.getGroupInfo(groupId, false);
            this.eventEmitter.emit(EventType.GroupInfoUpdate, groupInfo);
        });
    }

    getGroupInfo(groupId, refresh = false) {
        var groupInfo = this.store.getGroupInfo(groupId);

        if (refresh || groupInfo instanceof NullGroupInfo) {
            this._reloadGroupInfoFromRemote(groupId);
        }
        return groupInfo;
    }


    addGroupMembers(groupId, memberIds, notifyLines, notifyMessageContent, successCB, failCB) {
        let request = AddGroupMemberRequest.create();
        request.groupId = groupId;
        request.addedMember = memberIds;
        request.toLine = notifyLines;
        request.notifyContent = this._toProtoMessageContent(notifyMessageContent);
        this._publish('GAM', AddGroupMemberRequest.encode(request).finish(), (errorCode, data) => {
            this._generalOperationCallback(errorCode, successCB, failCB);
        });
    }

    getGroupMemberIds(groupId, fresh = false) {
        let groupMembers = this.getGroupMembers(groupId, fresh);
        var groupMemberIds = [];
        groupMembers.forEach(e => {
            groupMemberIds.push(e.memberId);
        });
        return groupMemberIds;
    }

    getGroupMembers(groupId, fresh = false) {
        let groupInfo = this.store.getGroupInfo(groupId);
        if (!groupInfo) {
            return null;
        }

        let members = this.store.getGroupMembers(groupId);
        let updateDt = new Long(0);
        if (members) {
            members.forEach(member => {
                if (new Long(member.updateDt).compare(updateDt) > 0) {
                    updateDt = member.updateDt;
                }
            });
        }
        if (!members || fresh) {
            console.log('---------', groupId, groupInfo, groupInfo.memberUpdateDt);
            this._reloadGroupMembersFromRemote(groupId, updateDt);
        }
        return members;
    }

    getGroupMember(groupId, memberId) {
        return this.store.getGroupMember(groupId, memberId);
    }

    kickoffGroupMembers(groupId, memberIds, notifyLines, notifyContent, successCB, failCB) {
        let request = RemoveGroupMemberRequest.create();
        request.groupId = groupId;
        request.removedMember = memberIds;
        request.toLine = notifyLines;
        request.notifyContent = this._toProtoMessageContent(notifyContent);

        this._publish('GKM', RemoveGroupMemberRequest.encode(request).finish(), (errorCode, data) => {
            this._generalOperationCallback(errorCode, successCB, failCB);
        });

    }

    async quitGroup(groupId, lines, notifyMessageContent, successCB, failCB) {
        let request = QuitGroupRequest.create();
        request.groupId = groupId;
        request.toLine = lines;
        request.notifyContent = this._toProtoMessageContent(notifyMessageContent);

        this._publish('GQ', QuitGroupRequest.encode(request).finish(), (errorCode, data) => {
            this._generalOperationCallback(errorCode, successCB, failCB);
        });
    }

    async dismissGroup(groupId, lines, notifyMessageContent, successCB, failCB) {
        let request = DismissGroupRequest.create();
        request.groupId = groupId;
        request.toLine = lines;
        request.notifyContent = this._toProtoMessageContent(notifyMessageContent);

        this._publish('GD', DismissGroupRequest.encode(request).finish(), (errorCode, data) => {
            this._generalOperationCallback(errorCode, successCB, failCB);
        });
    }

    async modifyGroupInfo(groupId, type, newValue, lines, notifyMessageContent, successCB, failCB) {
        let request = ModifyGroupInfoRequest.create();
        request.groupId = groupId;
        request.toLine = lines;
        request.type = type;
        request.value = newValue;
        request.notifyContent = this._toProtoMessageContent(notifyMessageContent);

        this._publish('GMI', ModifyGroupInfoRequest.encode(request).finish(), (errorCode, data) => {
            this._generalOperationCallback(errorCode, successCB, failCB);
        });
    }

    async modifyGroupAlias(groupId, alias, lines, notifyMessageContent, successCB, failCB) {
        let request = ModifyGroupMemberAlias.create();
        request.groupId = groupId;
        request.alias = alias;
        request.toLine = lines;
        request.notifyContent = this._toProtoMessageContent(notifyMessageContent);

        this._publish('GMA', ModifyGroupMemberAlias.encode(request).finish(), (errorCode, data) => {
            this._generalOperationCallback(errorCode, successCB, failCB);
        });
    }

    transferGroup(groupId, newOwner, lines, notifyMessageContent, successCB, failCB) {
        let request = TransferGroupRequest.create();
        request.groupId = groupId;
        request.newOwner = newOwner;
        request.toLine = lines;
        request.notifyContent = this._toProtoMessageContent(notifyMessageContent);
        this._publish('GTG', TransferGroupRequest.encode(request).finish(), (errorCode, data) => {
            this._generalOperationCallback(errorCode, successCB, failCB);
        });
    }

    getFavGroups() {
        return this.store.getFavGroups();
    }

    isFavGroup(groupId) {
        return this.store.isFavGroup(groupId);
    }

    async setFavGroup(groupId, fav, successCB, failCB) {
        this._updateUserSetting(UserSettingScope.FavoriteGroup, groupId, fav ? '1' : '0', successCB, failCB);
    }

    getUserSetting(scope, key) {
        return this.store.getUserSetting(scope, key);
    }

    getUserSettings(scope) {
        return this.store.getUserSettings(scope);
    }

    async setUserSetting(scope, key, value, successCB, failCB) {
        this._updateUserSetting(scope, key, value, successCB, failCB);
    }

    modifyMyInfo(entries, successCB, failCB) {
        let request = ModifyMyInfoRequest.create();
        request.entry = entries;

        this._publish('MMI', ModifyMyInfoRequest.encode(request).finish(), (errorCode, data) => {
            this._generalOperationCallback(errorCode, successCB, failCB);
        });
    }

    isGlobalSlient() {
        let setting = this.store.getUserSetting(UserSettingScope.GlobalSilent, '');
        return setting ? setting.value === '1' : false;
    }

    setGlobalSlient(silent, successCB, failCB) {
        this._updateUserSetting(UserSettingScope.GlobalSilent, '', silent ? '1' : '0', () => {
            if (successCB) {
                successCB();
            }
        }, (errorCode) => {
            if (failCB) {
                failCB(errorCode);
            }
        });
    }

    isHiddenNotificationDetail() {
        let setting = this.store.getUserSetting(UserSettingScope.HiddenNotificationDetail, '');
        return setting ? setting.value === '1' : false;
    }

    async setHiddenNotificationDetail(hide, successCB, failCB) {
        this._updateUserSetting(UserSettingScope.HiddenNotificationDetail, '', hide ? '1' : '0', () => {
            if (successCB) {
                successCB();
            }
        }, (errorCode) => {
            if (failCB) {
                failCB(errorCode);
            }
        });
    }

    isHiddenGroupMemberName(groupId) {
        let setting = this.store.getUserSetting(UserSettingScope.GroupHideNickname, groupId);
        return setting ? setting.value === '1' : false;
    }

    async setHiddenGroupMemberName(groupId, hide, successCB, failCB) {
        this._updateUserSetting(UserSettingScope.GroupHideNickname, groupId, hide ? '1' : '0', () => {
            if (successCB) {
                successCB();
            }
        }, (errorCode) => {
            if (failCB) {
                failCB(errorCode);
            }
        });
    }

    async joinChatroom(chatroomId, successCB, failCB) {
        proto.joinChatroom(chatroomId, () => {
            if (successCB) {
                successCB();
            }
        }, (errorCode) => {
            if (failCB) {
                failCB(errorCode);
            }
        });
    }

    async quitChatroom(chatroomId, successCB, failCB) {
        proto.quitChatroom(chatroomId, () => {
            if (successCB) {
                successCB();
            }
        }, (errorCode) => {
            if (failCB) {
                failCB(errorCode);
            }
        });
    }

    async getChatroomInfo(chatroomId, updateDt, successCB, failCB) {
        proto.getChatroomInfo(chatroomId, updateDt, (info) => {
            if (successCB) {
                successCB(JSON.parse(info));
            }
        }, (errorCode) => {
            if (failCB) {
                failCB(errorCode);
            }
        });
    }

    async getChatroomMemberInfo(chatroomId, maxCount, successCB, failCB) {
        proto.getChatroomMemberInfo(chatroomId, maxCount, (info) => {
            if (successCB) {
                successCB(Object.assign(new ChatRoomMemberInfo(), JSON.parse(info)));
            }
        }, (errorCode) => {
            if (failCB) {
                failCB(errorCode);
            }
        });
    }

    createChannel(name, portrait, status, desc, extra, successCB, failCB) {
        proto.createChannel(name, portrait, status, desc, extra, (info) => {
            if (successCB) {
                successCB(Object.assign(new ChannelInfo(), JSON.parse(info)));
            }
        }, (errorCode) => {
            if (failCB) {
                failCB(errorCode);
            }
        });
    }

    getChannelInfo(channelId, refresh) {
        let result = proto.getChannelInfo(channelId, refresh);
        if (result === '') {
            return null;
        }

        return Object.assign(new ChannelInfo(), JSON.parse(result));
    }

    async modifyChannelInfo(channelId, type, newValue, successCB, failCB) {
        proto.modifyChannelInfo(channelId, type, newValue, () => {
            if (successCB) {
                successCB();
            }
        }, (errorCode) => {
            if (failCB) {
                failCB(errorCode);
            }
        });
    }

    searchChannel(keyword, successCB, failCB) {
        proto.searchChannel(keyword, (result) => {
            if (successCB) {
                let channels = [];
                let tmp = JSON.parse(result);
                tmp.forEach(channel => {
                    channels.push(Object.assign(new ChannelInfo(), channel));
                });
                successCB(channels);
            }
        }, (errorCode) => {
            if (failCB) {
                failCB(errorCode);
            }
        });
    }

    isListenedChannel(channelId) {
        return proto.isListenedChannel(channelId);
    }

    async listenChannel(channelId, listen, successCB, failCB) {
        proto.listenChannel(channelId, listen, () => {
            successCB();
        }, errorCode => {
            failCB(errorCode);
        });
    }

    // return channelIds
    getMyChannels() {
        let result = proto.getMyChannels();
        return JSON.parse(result);
    }

    getListenedChannels() {
        let result = proto.getListenedChannels();
        return JSON.parse(result);
    }

    async destoryChannel(channelId, successCB, failCB) {
        proto.destoryChannel(channelId, () => {
            if (successCB) {
                successCB();
            }
        }, errorCode => {
            if (failCB) {
                failCB(errorCode);
            }
        });
    }

    getConversationList(types, lines) {
        // TODO 第一次等从服务端拉取
        return this.store.getConversationList(types, lines);
    }

    getConversationInfo(conversation) {
        return this.store.getConversationInfo(conversation);
    }

    searchConversation(keyword, types = [0, 1, 2], lines = [0, 1]) {
        return this.store.searchConversation(keyword, types, lines);
    }

    async removeConversation(conversation, clearMsg) {
        this.store.removeConversation(conversation, clearMsg);
    }

    setConversationTop(conversation, top, successCB, failCB) {
        let scope = UserSettingScope.ConversationTop;
        let key = conversation.type + '-' + conversation.line + '-' + conversation.target;
        let value = top ? '1' : '0';
        this._updateUserSetting(scope, key, value, () => {
            let conversationInfo = this.getConversationInfo(conversation);
            this.eventEmitter.emit(EventType.ConversationInfoUpdate, conversationInfo);
            this.store.setConversationTop(conversation, top);
            if (successCB) {
                successCB();
            }
        }, (errorCode) => {
            if (failCB) {
                failCB(errorCode);
            }
        });
    }

    setConversationSlient(conversation, silent, successCB, failCB) {
        let scope = UserSettingScope.ConversationSilent;
        let key = conversation.type + '-' + conversation.line + '-' + conversation.target;
        let value = silent ? '1' : '0';
        this._updateUserSetting(scope, key, value, () => {
            this.store.setConversationTop(conversation, top);
            if (successCB) {
                successCB();
            }
            let conversationInfo = this.getConversationInfo(conversation);
            this.eventEmitter.emit(EventType.ConversationInfoUpdate, conversationInfo);
        }, (errorCode) => {
            if (failCB) {
                failCB(errorCode);
            }
        });
    }

    setConversationDraft(conversation, draft = '') {
        this.store.setConversationDraft(conversation, draft);
    }

    getUnreadCount(types = [], lines = [0]) {
        return this.store.getUnreadCount(types, lines);
    }

    getConversationUnreadCount(conversation) {
        return this.store.getConversationUnreadCount(conversation);
    }

    async clearConversationUnreadStatus(conversation) {
        let count = this.store.clearConversationUnreadStatus(conversation);
        let conversationInfo = this.getConversationInfo(conversation);
        this.eventEmitter.emit(EventType.ConversationInfoUpdate, conversationInfo);
        if (count > 0) {
            let maxDt = this.store.getConversationReadMaxDt(conversation);
            this._updateUserSetting(UserSettingScope.Conversation_Sync,
                conversation.type + '-' + conversation.line + '-' + conversation.target,
                '' + maxDt,
                () => { console.log('syncConversation success', conversation) },
                (errorCode) => { console.log('sync conversation fail', conversation, errorCode) }
            );
        }
    }

    async clearAllUnreadStatus() {
        let count = this.store.clearAllUnreadStatus();
        if (count > 0) {
            // TODO sync all conversation
        }
    }

    setMediaMessagePlayed(messageId) {
        let count = this.store.setMediaMessagePlayed(messageId);
        if (count > 0) {
            let msg = this.store.getMessageById(messageId);
            this.eventEmitter.emit(EventType.MessageStatusUpdate, msg);
        }
    }

    isMyFriend(userId) {
        return this.store.isMyFriend(userId);
    }

    async sendFriendRequest(userId, reason, successCB, failCB) {
        let request = AddFriendRequest.create();
        request.targetUid = userId;
        request.reason = reason;
        this._publish('FAR', AddFriendRequest.encode(request).finish(), (errorCode, data) => {
            if (errorCode === 0) {
                if (successCB) {
                    successCB();
                }
            } else {
                if (failCB) {
                    failCB(errorCode);
                }
            }
        });
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
        return this.store.getConversationMessages(conversation);
    }

    loadRemoteMessages(conversation, beforeUid = Number.MAX_SAFE_INTEGER - 1, count = 20, successCB, failCB) {
        let request = LoadRemoteMessages.create();
        request.conversation = this._toProtoConversation(conversation);
        request.beforeUid = Long.isLong(beforeUid) ? beforeUid : new Long(beforeUid);
        request.count = count;
        console.log('loadRemoteMessages request', beforeUid, request);
        this._publish('LRM', LoadRemoteMessages.encode(request).finish(), (errorCode, data) => {
            if (errorCode === 0) {
                var pr = PullMessageResult.decode(data);
                if (pr && pr.message) {
                    pr.message.forEach(m => {
                        let msg = Message.fromProtoMessage(m);
                        if (msg) {
                            let flag = MessageConfig.getMessageContentPersitFlag(msg.content.type);
                            if (flag === PersistFlag.Persist || flag === PersistFlag.Persist_And_Count) {
                                msg.messageId = this.store.genNormalMessageId();
                                this.store.saveMessage(msg);
                            }
                        }
                    });
                }

            } else {
                if (failCB) {
                    failCB(errorCode);
                }
            }
        });
    }

    getMessageById(messageId) {
        return this.store.getMessageById(messageId);
    }

    getMessageByUid(messageUid) {
        return this.store.getMessageByUid(messageUid);
    }

    searchMessage(conversation, keyword) {
        return this.store.searchConversationMessage(conversation, keyword);
    }

    async sendConversationMessage(conversation, messageContent, toUsers, preparedCB, progressCB, successCB, failCB) {
        let message = new Message();
        message.conversation = conversation;
        message.messageContent = messageContent;
        this.sendMessageEx(message, toUsers, preparedCB, progressCB, successCB, failCB);
    }

    async sendMessage(message, preparedCB, progressCB, successCB, failCB) {
        this.sendMessageEx(message, [], preparedCB, progressCB, successCB, failCB);
    }

    // toUsers 用来实现定向消息
    async sendMessageEx(message, toUsers = [], preparedCB, progressCB, successCB, failCB) {

        // prepared
        // insert message
        let msgId;
        let saveTimestamp = new Date().getTime();
        message.status = MessageStatus.Sending;
        if (message.conversation.type === ConversationType.ChatRoom) {
            msgId = this.store.genChatRoomMessageId();
            message.messageId = msgId;
        } else {
            msgId = this.store.genNormalMessageId();
            message.messageId = msgId;
            message.timestamp = saveTimestamp;
            this.store.saveMessage(message);
        }

        this.store.updateConversationLastMessage(message);
        if (preparedCB) {
            preparedCB(msgId, saveTimestamp);
        }

        if (message.messageContent instanceof MediaMessageContent) {
            if (message.messageContent.file) {
                this.uploadMedia(message.messageContent.file, message.messageContent.mediaType,
                    (remoteMediaUrl) => {
                        message.messageContent.remotePath = remoteMediaUrl;
                        console.log('remote Url', remoteMediaUrl);
                        this._sendMessageInternal(message, toUsers, successCB, failCB);
                    },
                    (errorCode) => {
                        if (failCB) {
                            failCB(errorCode);
                        }
                    },
                    (uploaded, total) => {
                        if (progressCB) {
                            progressCB(uploaded, total);
                        }
                    });

            } else if (message.messageContent.remotePath !== '') {
                this._sendMessageInternal(message, toUsers, successCB, failCB);
            } else {
                if (failCB) {
                    console.log('send media message error, file and remoteUrl are null');
                    failCB(-1);
                }
            }
        } else {
            this._sendMessageInternal(message, toUsers, successCB, failCB);
        }
    }

    _sendMessageInternal(message, toUsers = [], successCB, failCB) {
        let pbMsg = this._toProtoMessage(message);
        pbMsg.to = toUsers;
        this._publish('MS', PbMessage.encode(pbMsg).finish(), (errorCode, data) => {
            if (errorCode !== 0) {
                console.log('send message error', errorCode);
                message.status = MessageStatus.SendFailure;
                this.store.updateMessageById(message);
                this.store.updateConversationLastMessage(message);
                if (failCB) {
                    failCB(errorCode);
                }
                return;
            } else {
                // parse data
                // messageUid + timestamp
                let messageUid = new Long(0);
                let timestamp = new Long(0);
                if (data.length === 16) {
                    messageUid = Long.fromBytesBE(data.slice(0, 8), true);
                    timestamp = Long.fromBytesBE(data.slice(8, 16), true);
                    message.messageUid = messageUid;
                    message.timestamp = Number(timestamp);
                    message.status = MessageStatus.Sent;
                    this.store.updateMessageById(message);
                    this.store.updateConversationLastMessage(message);

                    if (successCB) {
                        successCB(messageUid, Number(timestamp));
                    }
                } else {
                    message.status = MessageStatus.SendFailure;
                    this.store.updateMessageById(message);
                    this.store.updateConversationLastMessage(message);
                    console.log('ms reponse length error');
                    if (failCB) {
                        failCB(-100001);
                    }
                }
            }
        });

        this.eventEmitter.emit(EventType.SendMessage, message);
    }

    // TODO 更新本地原始消息的内容
    async recallMessage(messageUid, successCB, failCB) {
        let request = INT64Buf.create();
        request.id = messageUid instanceof Long ? messageUid : Long.fromNumber(messageUid);
        this._publish('MR', INT64Buf.encode(request).finish(), (errorCode, data) => {
            if (errorCode === 0) {
                if (successCB) {
                    successCB();
                }
                this.onRecallMessage(this.getUserId(), messageUid);
            } else {
                if (failCB) {
                    failCB(errorCode);
                }
            }
        });
    }

    deleteMessageById(messageId) {
        let result = this.store.deleteMessage(messageId);
        if (result) {
            this.onMessageDeleted(messageId);
        }
        return result;
    }

    async clearMessages(conversation) {
        this.store.clearConversationMessages(conversation);
        let conversationInfo = this.getConversationInfo(conversation);
        this.eventEmitter.emit(EventType.ConversationInfoUpdate, conversationInfo);
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
        return 'not implement';
        // proto.insertMessage(JSON.stringify(conversation), this.userId, JSON.stringify(messageContent), status, notify, serverTime);
    }

    updateMessageContent(messageId, messageContent) {
        let msg = this.store.getMessageByUid(messageId);
        if (msg.messageId === 0) {
            return;
        }
        msg.content = messageContent;
        this.store.updateMessageById(msg);
    }

    // file 是从html input来的
    async uploadMedia(file, mediaType, successCB, failCB, progressCB) {
        const buf = Buffer.from([1]);
        this._publish('GQNUT', buf, (errorCode, data) => {
            if (errorCode === 0) {
                let tokenResult = GetUploadTokenResult.decode(data);
                let req = new XMLHttpRequest();
                let formData = new FormData();

                let fileNmae = this.userId + '-' + new Date().getTime() + '-' + Math.round(Math.random() * 10000);
                let type = 'application_octet-stream';
                if (mediaType === 3) {
                    type = 'image_jpeg';
                } else if (mediaType === 2) {
                    type = 'audio_amr';

                }
                let blob = new Blob([file], { type: type })
                formData.append('file', blob, fileNmae);
                formData.append('token', tokenResult.token);
                formData.append('key', fileNmae);

                let timeout = false;
                var timer = setTimeout(function () {
                    timeout = true;
                    req.abort();
                    failCB(-1);
                }, 10000);
                req.onreadystatechange = () => {
                    if (req.readyState !== 4) return;
                    if (timeout) return;
                    clearTimeout(timer);
                    if (req.status === 200) {
                        let uploadResult = JSON.parse(req.responseText);
                        if (successCB) {
                            successCB(tokenResult.domain + '/' + uploadResult.key);
                        }
                    }
                };
                req.onprogress = (evt) => {
                    if (evt.lengthComputable) {
                        if (progressCB) {
                            progressCB(evt.loaded, evt.total);
                        }
                    };
                };
                req.open("POST", 'http://' + tokenResult.server + '/fs');

                req.send(formData);
            } else {
                if (failCB) {
                    failCB(errorCode);
                }
            }
        });

        console.log('upload-----------');
    }


    _encrypt(request) {
      var base64Data = AESEncrypt(new Int8Array(request), this.privateSecret);
      return base64Data;
    }

    _decrypt(buf) {
      var data = AESDecrypt(buf.toString('base64'), this.privateSecret, true);
      return data;
    }

    _decryptPublishResponse(packet) {
        var data = AESDecrypt(packet.payload.slice(1, packet.payload.length).toString('base64'), this.privateSecret, true);
        if (data) {
          return data;;
        }
        return null;
    }

    _toProtoConversation(conversation) {
        let pbConversation = PbConversation.create();
        pbConversation.type = conversation.type;
        pbConversation.target = conversation.target;
        pbConversation.line = conversation.line;
        return pbConversation;
    }

    _toProtoMessage(msg) {
        let pbMsg = new PbMessage();
        pbMsg.conversation = msg.conversation;
        pbMsg.fromUser = this.getUserId();
        pbMsg.content = this._toProtoMessageContent(msg.messageContent);;

        return pbMsg;
    }

    _toProtoMessageContent(content) {
        if (!content) {
            return null;
        }
        let pbMsgContent = PbMessageContent.create();
        let payload = content.encode();
        pbMsgContent.content = payload.content;
        pbMsgContent.searchableContent = payload.searchableContent;
        pbMsgContent.data = payload.binaryContent;
        pbMsgContent.type = payload.type;
        pbMsgContent.mentionedType = payload.mentionedType;
        pbMsgContent.mentionedTarget = payload.mentionedTargets;
        pbMsgContent.mediaType = payload.mediaType;
        pbMsgContent.remoteMediaUrl = payload.remoteMediaUrl;
        pbMsgContent.persistFlag = MessageConfig.getMessageContentPersitFlag(payload.type);
        pbMsgContent.extra = content.extra;

        return pbMsgContent;
    }

    _generalOperationCallback(errorCode, successCB, failCB) {
        if (errorCode === 0) {
            if (successCB) {
                successCB();
            }
        } else {
            if (failCB) {
                failCB(errorCode);
            }
        }
    }

    test() {

        console.log('---------------test start----------------------');
        // let u = self.getUserInfo('uiuJuJccj', true);
        // u.hello();
        // console.log('user info', u);
        // self.getMessageById(200);

        // let g = self.getGroupInfo('PHPSPS22');
        // console.log(g);

        // let m = self.getGroupMembers('PHPSPS22');
        // console.log(m);

        // this.getMyGroupList();

        // console.log('localStorage', localStorage.getItem('test'));
        // localStorage.setItem('test', 'hello world');
        // console.log('localStorage', localStorage.getItem('test'));

        // console.log('atob', btoa('hello world'));
        // self.uploadMedia('hello world', MessageContentMediaType.Image,
        //     (remoteUrl) => {
        //         console.log('----------------upload success', remoteUrl);
        //     },
        //     (errorCode) => {
        //         console.log('-------------upload error', errorCode);
        //     },
        //     (current, total) => {

        //     });

        /*
        let id = 0;
        setInterval(() => {
            console.log('send message to uiuJuJcc');
            let conversation = new Conversation(ConversationType.Single, "uiuJuJcc", 0);
            let content = new TextMessageContent(id + "hello from wfc.js " + new Date().toString() + " " + id);
            // this.sendConversationMessage(conversation, content)
            // content = new ImageMessageContent(null, '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');
            this.sendConversationMessage(conversation, content, [], (messageId, timestamp) => {
                id = messageId;
                // prepared
                console.log('send prepared', messageId);
                // console.log('send msg prepared', this.store.getConversationInfos(), this.store.getConversationInfo(conversation));

            }, null, (messageUid, timestamp) => {
                // sucess
                console.log('send success', messageUid);
                // console.log('send msg success', this.store.getConversationInfos(), this.store.getConversationInfo(conversation));
                // this.recallMessage(messageUid, () => {
                //     console.log('recall s');
                // }, (errorCode) => {
                //     console.log('recall error', errorCode);
                // });

            });
        }, 100);
        */

        // this.setConversationTop(conversation, true, () => {
        //     console.log('set conversation top success');
        //     let info = this.getConversationInfo(conversation);
        //     console.log('conversation info', info);
        // }, (errorCode) => {
        //     console.log('set conversation top failed', errorCode);

        // });

        // let notifyContent = new CreateGroupNotification(this.getUserId(), 'test group Name');
        // let notifyContent = new ImageMessageContent(null, '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');
        // this.createGroup(null, "test group namxxxxxxxxxxe", null, ['uiuJuJcc'], [0], notifyContent);


        // console.log('getUserInfo', self.getUserInfo('uiuJuJcc'));
        // console.log('getGroupInfo', self.getGroupInfo('-OWD-DAA'));
        // this.uploadMedia();
        console.log('---------------test end----------------------');
    }
}
// const self = new WfcImpl();
// export default self;

// var username = 'GNMtGtZZ';
// // var username = '141b1boo'
// var token = 'PNvAMGi+CWGn4HXvkswJaCz8tjEU1Ylqf7mqTHvwy/YvccA/yWWxoT1aqHAK4QVFkv0oAnGKofTgYt9D+D5lsMr4sdz8qa1A2/fmL7ruxnDZS09XMblQMk6ND4OkCZF4GARARVQr+1jp+qt7CL5/WXLQFfUugibo8KsGLW17vdg=';
// // var token = 'vRHUDqbbowFr05lGQo3jOq5aUXgJKyUQttVcpOLA63+YcJZ8V8IGvYaMsds2K5GOPtrqC1LtjSQYnXE1iawoAxkojbOvHKH2808hfPI0nkTrWq/IakkJL92J3xzGavP/j+OQgOLD108q/nyQO4v+CkrEG1iwUqPZHFEXmXi/Bb4=';
// self.connect(username, token);