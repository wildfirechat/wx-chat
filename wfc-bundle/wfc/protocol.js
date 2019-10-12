module.exports = {
  "options": {
    "java_package": "cn.wildfirechat.proto",
    "java_outer_classname": "WFCMessage"
  },
  "nested": {
    "AddFriendRequest": {
      "fields": {
        "targetUid": {
          "rule": "required",
          "type": "string",
          "id": 1
        },
        "reason": {
          "rule": "required",
          "type": "string",
          "id": 2
        }
      }
    },
    "Conversation": {
      "fields": {
        "type": {
          "rule": "required",
          "type": "int32",
          "id": 1
        },
        "target": {
          "rule": "required",
          "type": "string",
          "id": 2
        },
        "line": {
          "rule": "required",
          "type": "int32",
          "id": 3
        }
      }
    },
    "GroupInfo": {
      "fields": {
        "targetId": {
          "type": "string",
          "id": 1
        },
        "name": {
          "rule": "required",
          "type": "string",
          "id": 2
        },
        "portrait": {
          "type": "string",
          "id": 3
        },
        "owner": {
          "type": "string",
          "id": 4
        },
        "type": {
          "rule": "required",
          "type": "int32",
          "id": 5
        },
        "memberCount": {
          "type": "int32",
          "id": 6
        },
        "extra": {
          "type": "string",
          "id": 7
        },
        "updateDt": {
          "type": "int64",
          "id": 8
        },
        "memberUpdateDt": {
          "type": "int64",
          "id": 9
        },
        "mute": {
          "type": "int32",
          "id": 10
        },
        "joinType": {
          "type": "int32",
          "id": 11
        },
        "privateChat": {
          "type": "int32",
          "id": 12
        },
        "searchable": {
          "type": "int32",
          "id": 13
        }
      }
    },
    "GroupMember": {
      "fields": {
        "memberId": {
          "rule": "required",
          "type": "string",
          "id": 1
        },
        "alias": {
          "type": "string",
          "id": 2
        },
        "type": {
          "rule": "required",
          "type": "int32",
          "id": 3
        },
        "updateDt": {
          "type": "int64",
          "id": 4
        }
      }
    },
    "Group": {
      "fields": {
        "groupInfo": {
          "rule": "required",
          "type": "GroupInfo",
          "id": 1
        },
        "members": {
          "rule": "repeated",
          "type": "GroupMember",
          "id": 2
        }
      }
    },
    "ChannelInfo": {
      "fields": {
        "targetId": {
          "type": "string",
          "id": 1
        },
        "name": {
          "rule": "required",
          "type": "string",
          "id": 2
        },
        "portrait": {
          "type": "string",
          "id": 3
        },
        "owner": {
          "type": "string",
          "id": 4
        },
        "status": {
          "type": "int32",
          "id": 5
        },
        "desc": {
          "type": "string",
          "id": 6
        },
        "extra": {
          "type": "string",
          "id": 7
        },
        "updateDt": {
          "type": "int64",
          "id": 8
        },
        "secret": {
          "type": "string",
          "id": 9
        },
        "callback": {
          "type": "string",
          "id": 10
        },
        "automatic": {
          "type": "int32",
          "id": 11
        }
      }
    },
    "ModifyChannelInfo": {
      "fields": {
        "channelId": {
          "rule": "required",
          "type": "string",
          "id": 1
        },
        "type": {
          "rule": "required",
          "type": "int32",
          "id": 2
        },
        "value": {
          "rule": "required",
          "type": "string",
          "id": 3
        }
      }
    },
    "TransferChannel": {
      "fields": {
        "channelId": {
          "rule": "required",
          "type": "string",
          "id": 1
        },
        "newOwner": {
          "rule": "required",
          "type": "string",
          "id": 2
        }
      }
    },
    "PullChannelInfo": {
      "fields": {
        "channelId": {
          "rule": "required",
          "type": "string",
          "id": 1
        },
        "head": {
          "rule": "required",
          "type": "int64",
          "id": 2
        }
      }
    },
    "PullChannelListener": {
      "fields": {
        "channelId": {
          "rule": "required",
          "type": "string",
          "id": 1
        },
        "offset": {
          "rule": "required",
          "type": "int32",
          "id": 2
        },
        "count": {
          "rule": "required",
          "type": "int32",
          "id": 3
        }
      }
    },
    "PullChannelListenerResult": {
      "fields": {
        "totalCount": {
          "rule": "required",
          "type": "int32",
          "id": 1
        },
        "offset": {
          "rule": "required",
          "type": "int32",
          "id": 2
        },
        "listener": {
          "rule": "repeated",
          "type": "string",
          "id": 3
        }
      }
    },
    "ListenChannel": {
      "fields": {
        "channelId": {
          "rule": "required",
          "type": "string",
          "id": 1
        },
        "listen": {
          "rule": "required",
          "type": "int32",
          "id": 2
        }
      }
    },
    "SearchChannelResult": {
      "fields": {
        "channel": {
          "rule": "repeated",
          "type": "ChannelInfo",
          "id": 1
        },
        "keyword": {
          "rule": "required",
          "type": "string",
          "id": 2
        }
      }
    },
    "MessageContent": {
      "fields": {
        "type": {
          "rule": "required",
          "type": "int32",
          "id": 1
        },
        "searchableContent": {
          "type": "string",
          "id": 2
        },
        "pushContent": {
          "type": "string",
          "id": 3
        },
        "content": {
          "type": "string",
          "id": 4
        },
        "data": {
          "type": "bytes",
          "id": 5
        },
        "mediaType": {
          "type": "int32",
          "id": 6
        },
        "remoteMediaUrl": {
          "type": "string",
          "id": 7
        },
        "persistFlag": {
          "type": "int32",
          "id": 8
        },
        "expireDuration": {
          "type": "int32",
          "id": 9
        },
        "mentionedType": {
          "type": "int32",
          "id": 10
        },
        "mentionedTarget": {
          "rule": "repeated",
          "type": "string",
          "id": 11
        },
        "extra": {
          "type": "string",
          "id": 12
        }
      }
    },
    "AddGroupMemberRequest": {
      "fields": {
        "groupId": {
          "rule": "required",
          "type": "string",
          "id": 1
        },
        "addedMember": {
          "rule": "repeated",
          "type": "GroupMember",
          "id": 2
        },
        "toLine": {
          "rule": "repeated",
          "type": "int32",
          "id": 3,
          "options": {
            "packed": false
          }
        },
        "notifyContent": {
          "type": "MessageContent",
          "id": 4
        }
      }
    },
    "CreateGroupRequest": {
      "fields": {
        "group": {
          "rule": "required",
          "type": "Group",
          "id": 1
        },
        "toLine": {
          "rule": "repeated",
          "type": "int32",
          "id": 2,
          "options": {
            "packed": false
          }
        },
        "notifyContent": {
          "type": "MessageContent",
          "id": 3
        }
      }
    },
    "DismissGroupRequest": {
      "fields": {
        "groupId": {
          "rule": "required",
          "type": "string",
          "id": 1
        },
        "toLine": {
          "rule": "repeated",
          "type": "int32",
          "id": 2,
          "options": {
            "packed": false
          }
        },
        "notifyContent": {
          "type": "MessageContent",
          "id": 3
        }
      }
    },
    "FriendRequest": {
      "fields": {
        "fromUid": {
          "type": "string",
          "id": 1
        },
        "toUid": {
          "rule": "required",
          "type": "string",
          "id": 2
        },
        "reason": {
          "rule": "required",
          "type": "string",
          "id": 3
        },
        "status": {
          "type": "int32",
          "id": 4
        },
        "updateDt": {
          "type": "int64",
          "id": 5
        },
        "fromReadStatus": {
          "type": "bool",
          "id": 6
        },
        "toReadStatus": {
          "type": "bool",
          "id": 7
        }
      }
    },
    "GeneralResult": {
      "fields": {
        "errorCode": {
          "rule": "required",
          "type": "int32",
          "id": 1
        }
      }
    },
    "GetUploadTokenRequest": {
      "fields": {
        "mediaType": {
          "rule": "required",
          "type": "int32",
          "id": 1
        },
        "mediaPath": {
          "rule": "required",
          "type": "string",
          "id": 2
        }
      }
    },
    "GetUploadTokenResult": {
      "fields": {
        "domain": {
          "rule": "required",
          "type": "string",
          "id": 1
        },
        "token": {
          "rule": "required",
          "type": "string",
          "id": 2
        },
        "server": {
          "rule": "required",
          "type": "string",
          "id": 3
        },
        "port": {
          "type": "int32",
          "id": 4
        },
        "type": {
          "type": "int32",
          "id": 5
        },
        "date": {
          "type": "string",
          "id": 6
        },
        "path": {
          "type": "string",
          "id": 7
        }
      }
    },
    "HandleFriendRequest": {
      "fields": {
        "targetUid": {
          "rule": "required",
          "type": "string",
          "id": 1
        },
        "status": {
          "rule": "required",
          "type": "int32",
          "id": 2
        }
      }
    },
    "IDBuf": {
      "fields": {
        "id": {
          "rule": "required",
          "type": "string",
          "id": 1
        }
      }
    },
    "IDListBuf": {
      "fields": {
        "id": {
          "rule": "repeated",
          "type": "string",
          "id": 1
        }
      }
    },
    "Message": {
      "fields": {
        "conversation": {
          "rule": "required",
          "type": "Conversation",
          "id": 1
        },
        "fromUser": {
          "rule": "required",
          "type": "string",
          "id": 2
        },
        "content": {
          "rule": "required",
          "type": "MessageContent",
          "id": 3
        },
        "messageId": {
          "type": "int64",
          "id": 4
        },
        "serverTimestamp": {
          "type": "int64",
          "id": 5
        },
        "toUser": {
          "type": "string",
          "id": 6
        },
        "to": {
          "rule": "repeated",
          "type": "string",
          "id": 7
        }
      }
    },
    "User": {
      "fields": {
        "uid": {
          "rule": "required",
          "type": "string",
          "id": 1
        },
        "name": {
          "type": "string",
          "id": 2
        },
        "displayName": {
          "type": "string",
          "id": 3
        },
        "portrait": {
          "type": "string",
          "id": 4
        },
        "mobile": {
          "type": "string",
          "id": 5
        },
        "email": {
          "type": "string",
          "id": 6
        },
        "address": {
          "type": "string",
          "id": 7
        },
        "company": {
          "type": "string",
          "id": 8
        },
        "extra": {
          "type": "string",
          "id": 9
        },
        "updateDt": {
          "type": "int64",
          "id": 10
        },
        "gender": {
          "type": "int32",
          "id": 11
        },
        "social": {
          "type": "string",
          "id": 12
        },
        "type": {
          "type": "int32",
          "id": 13
        }
      }
    },
    "Robot": {
      "fields": {
        "uid": {
          "rule": "required",
          "type": "string",
          "id": 1
        },
        "state": {
          "rule": "required",
          "type": "int32",
          "id": 2
        },
        "owner": {
          "type": "string",
          "id": 3
        },
        "secret": {
          "type": "string",
          "id": 4
        },
        "callback": {
          "type": "string",
          "id": 5
        },
        "extra": {
          "type": "string",
          "id": 6
        }
      }
    },
    "GetRobotsResult": {
      "fields": {
        "entry": {
          "rule": "repeated",
          "type": "Robot",
          "id": 1
        }
      }
    },
    "Thing": {
      "fields": {
        "uid": {
          "rule": "required",
          "type": "string",
          "id": 1
        },
        "state": {
          "rule": "required",
          "type": "int32",
          "id": 2
        },
        "token": {
          "rule": "required",
          "type": "string",
          "id": 3
        },
        "owner": {
          "type": "string",
          "id": 4
        },
        "extra": {
          "type": "string",
          "id": 5
        }
      }
    },
    "GetThingsResult": {
      "fields": {
        "entry": {
          "rule": "repeated",
          "type": "Thing",
          "id": 1
        }
      }
    },
    "UploadDeviceTokenRequest": {
      "fields": {
        "platform": {
          "rule": "required",
          "type": "int32",
          "id": 1
        },
        "appName": {
          "rule": "required",
          "type": "string",
          "id": 2
        },
        "deviceToken": {
          "rule": "required",
          "type": "string",
          "id": 3
        },
        "pushType": {
          "rule": "required",
          "type": "int32",
          "id": 4
        }
      }
    },
    "ModifyGroupInfoRequest": {
      "fields": {
        "groupId": {
          "rule": "required",
          "type": "string",
          "id": 1
        },
        "type": {
          "rule": "required",
          "type": "int32",
          "id": 2
        },
        "value": {
          "rule": "required",
          "type": "string",
          "id": 3
        },
        "toLine": {
          "rule": "repeated",
          "type": "int32",
          "id": 4,
          "options": {
            "packed": false
          }
        },
        "notifyContent": {
          "type": "MessageContent",
          "id": 5
        }
      }
    },
    "SetGroupManagerRequest": {
      "fields": {
        "groupId": {
          "rule": "required",
          "type": "string",
          "id": 1
        },
        "type": {
          "rule": "required",
          "type": "int32",
          "id": 2
        },
        "userId": {
          "rule": "repeated",
          "type": "string",
          "id": 3
        },
        "toLine": {
          "rule": "repeated",
          "type": "int32",
          "id": 4,
          "options": {
            "packed": false
          }
        },
        "notifyContent": {
          "type": "MessageContent",
          "id": 5
        }
      }
    },
    "InfoEntry": {
      "fields": {
        "type": {
          "rule": "required",
          "type": "int32",
          "id": 1
        },
        "value": {
          "rule": "required",
          "type": "string",
          "id": 2
        }
      }
    },
    "ModifyMyInfoRequest": {
      "fields": {
        "entry": {
          "rule": "repeated",
          "type": "InfoEntry",
          "id": 1
        }
      }
    },
    "NotifyMessage": {
      "fields": {
        "type": {
          "rule": "required",
          "type": "int32",
          "id": 1
        },
        "head": {
          "rule": "required",
          "type": "int64",
          "id": 2
        },
        "target": {
          "type": "string",
          "id": 3
        }
      }
    },
    "PullMessageRequest": {
      "fields": {
        "id": {
          "rule": "required",
          "type": "int64",
          "id": 1
        },
        "type": {
          "rule": "required",
          "type": "int32",
          "id": 2
        },
        "delay": {
          "type": "int64",
          "id": 3
        }
      }
    },
    "PullMessageResult": {
      "fields": {
        "message": {
          "rule": "repeated",
          "type": "Message",
          "id": 1
        },
        "current": {
          "rule": "required",
          "type": "int64",
          "id": 2
        },
        "head": {
          "rule": "required",
          "type": "int64",
          "id": 3
        }
      }
    },
    "PullGroupInfoResult": {
      "fields": {
        "info": {
          "rule": "repeated",
          "type": "GroupInfo",
          "id": 1
        }
      }
    },
    "PullGroupMemberRequest": {
      "fields": {
        "target": {
          "rule": "required",
          "type": "string",
          "id": 1
        },
        "head": {
          "rule": "required",
          "type": "int64",
          "id": 2
        }
      }
    },
    "PullGroupMemberResult": {
      "fields": {
        "member": {
          "rule": "repeated",
          "type": "GroupMember",
          "id": 1
        }
      }
    },
    "UserRequest": {
      "fields": {
        "uid": {
          "rule": "required",
          "type": "string",
          "id": 1
        },
        "updateDt": {
          "type": "int64",
          "id": 2
        }
      }
    },
    "PullUserRequest": {
      "fields": {
        "request": {
          "rule": "repeated",
          "type": "UserRequest",
          "id": 1
        }
      }
    },
    "UserResult": {
      "fields": {
        "user": {
          "rule": "required",
          "type": "User",
          "id": 1
        },
        "code": {
          "rule": "required",
          "type": "int32",
          "id": 2
        }
      }
    },
    "PullUserResult": {
      "fields": {
        "result": {
          "rule": "repeated",
          "type": "UserResult",
          "id": 1
        }
      }
    },
    "QuitGroupRequest": {
      "fields": {
        "groupId": {
          "rule": "required",
          "type": "string",
          "id": 1
        },
        "toLine": {
          "rule": "repeated",
          "type": "int32",
          "id": 2,
          "options": {
            "packed": false
          }
        },
        "notifyContent": {
          "type": "MessageContent",
          "id": 3
        }
      }
    },
    "RemoveGroupMemberRequest": {
      "fields": {
        "groupId": {
          "rule": "required",
          "type": "string",
          "id": 1
        },
        "removedMember": {
          "rule": "repeated",
          "type": "string",
          "id": 2
        },
        "toLine": {
          "rule": "repeated",
          "type": "int32",
          "id": 3,
          "options": {
            "packed": false
          }
        },
        "notifyContent": {
          "type": "MessageContent",
          "id": 4
        }
      }
    },
    "TransferGroupRequest": {
      "fields": {
        "groupId": {
          "rule": "required",
          "type": "string",
          "id": 1
        },
        "newOwner": {
          "rule": "required",
          "type": "string",
          "id": 2
        },
        "toLine": {
          "rule": "repeated",
          "type": "int32",
          "id": 3,
          "options": {
            "packed": false
          }
        },
        "notifyContent": {
          "type": "MessageContent",
          "id": 4
        }
      }
    },
    "ModifyGroupMemberAlias": {
      "fields": {
        "groupId": {
          "rule": "required",
          "type": "string",
          "id": 1
        },
        "alias": {
          "rule": "required",
          "type": "string",
          "id": 2
        },
        "toLine": {
          "rule": "repeated",
          "type": "int32",
          "id": 3,
          "options": {
            "packed": false
          }
        },
        "notifyContent": {
          "type": "MessageContent",
          "id": 4
        }
      }
    },
    "UserSettingEntry": {
      "fields": {
        "scope": {
          "rule": "required",
          "type": "int32",
          "id": 1
        },
        "key": {
          "rule": "required",
          "type": "string",
          "id": 2
        },
        "value": {
          "rule": "required",
          "type": "string",
          "id": 3
        },
        "updateDt": {
          "rule": "required",
          "type": "int64",
          "id": 4
        }
      }
    },
    "ModifyUserSettingReq": {
      "fields": {
        "scope": {
          "rule": "required",
          "type": "int32",
          "id": 1
        },
        "key": {
          "rule": "required",
          "type": "string",
          "id": 2
        },
        "value": {
          "rule": "required",
          "type": "string",
          "id": 3
        }
      }
    },
    "Version": {
      "fields": {
        "version": {
          "rule": "required",
          "type": "int64",
          "id": 1
        }
      }
    },
    "GetUserSettingResult": {
      "fields": {
        "entry": {
          "rule": "repeated",
          "type": "UserSettingEntry",
          "id": 1
        }
      }
    },
    "Friend": {
      "fields": {
        "uid": {
          "rule": "required",
          "type": "string",
          "id": 1
        },
        "state": {
          "rule": "required",
          "type": "int32",
          "id": 2
        },
        "updateDt": {
          "rule": "required",
          "type": "int64",
          "id": 3
        },
        "alias": {
          "type": "string",
          "id": 4
        }
      }
    },
    "GetFriendsResult": {
      "fields": {
        "entry": {
          "rule": "repeated",
          "type": "Friend",
          "id": 1
        }
      }
    },
    "GetFriendRequestResult": {
      "fields": {
        "entry": {
          "rule": "repeated",
          "type": "FriendRequest",
          "id": 1
        }
      }
    },
    "ConnectAckPayload": {
      "fields": {
        "msgHead": {
          "type": "int64",
          "id": 1
        },
        "friendHead": {
          "type": "int64",
          "id": 2
        },
        "friendRqHead": {
          "type": "int64",
          "id": 3
        },
        "settingHead": {
          "type": "int64",
          "id": 4
        },
        "nodeAddr": {
          "type": "string",
          "id": 5
        },
        "nodePort": {
          "type": "int32",
          "id": 6
        },
        "serverTime": {
          "type": "int64",
          "id": 7
        }
      }
    },
    "IMHttpWrapper": {
      "fields": {
        "token": {
          "rule": "required",
          "type": "string",
          "id": 1
        },
        "clientId": {
          "rule": "required",
          "type": "string",
          "id": 2
        },
        "request": {
          "rule": "required",
          "type": "string",
          "id": 3
        },
        "data": {
          "type": "bytes",
          "id": 4
        }
      }
    },
    "SearchUserRequest": {
      "fields": {
        "keyword": {
          "rule": "required",
          "type": "string",
          "id": 1
        },
        "fuzzy": {
          "type": "int32",
          "id": 2
        },
        "page": {
          "type": "int32",
          "id": 3
        }
      }
    },
    "SearchUserResult": {
      "fields": {
        "entry": {
          "rule": "repeated",
          "type": "User",
          "id": 1
        }
      }
    },
    "GetChatroomInfoRequest": {
      "fields": {
        "chatroomId": {
          "rule": "required",
          "type": "string",
          "id": 1
        },
        "updateDt": {
          "type": "int64",
          "id": 2
        }
      }
    },
    "ChatroomInfo": {
      "fields": {
        "title": {
          "rule": "required",
          "type": "string",
          "id": 1
        },
        "desc": {
          "type": "string",
          "id": 2
        },
        "portrait": {
          "type": "string",
          "id": 3
        },
        "memberCount": {
          "type": "int32",
          "id": 4
        },
        "createDt": {
          "type": "int64",
          "id": 5
        },
        "updateDt": {
          "type": "int64",
          "id": 6
        },
        "extra": {
          "type": "string",
          "id": 7
        },
        "state": {
          "type": "int32",
          "id": 8
        }
      }
    },
    "GetChatroomMemberInfoRequest": {
      "fields": {
        "chatroomId": {
          "rule": "required",
          "type": "string",
          "id": 1
        },
        "maxCount": {
          "type": "int32",
          "id": 2
        }
      }
    },
    "ChatroomMemberInfo": {
      "fields": {
        "memberCount": {
          "type": "int32",
          "id": 1
        },
        "members": {
          "rule": "repeated",
          "type": "string",
          "id": 2
        }
      }
    },
    "INT64Buf": {
      "fields": {
        "id": {
          "rule": "required",
          "type": "int64",
          "id": 1
        }
      }
    },
    "NotifyRecallMessage": {
      "fields": {
        "id": {
          "rule": "required",
          "type": "int64",
          "id": 1
        },
        "fromUser": {
          "rule": "required",
          "type": "string",
          "id": 2
        }
      }
    },
    "BlackUserRequest": {
      "fields": {
        "uid": {
          "rule": "required",
          "type": "string",
          "id": 1
        },
        "status": {
          "rule": "required",
          "type": "int32",
          "id": 2
        }
      }
    },
    "RouteRequest": {
      "fields": {
        "app": {
          "type": "string",
          "id": 1
        },
        "platform": {
          "type": "int32",
          "id": 2
        },
        "pushType": {
          "type": "int32",
          "id": 3
        },
        "deviceName": {
          "type": "string",
          "id": 4
        },
        "deviceVersion": {
          "type": "string",
          "id": 5
        },
        "phoneName": {
          "type": "string",
          "id": 6
        },
        "language": {
          "type": "string",
          "id": 7
        },
        "carrierName": {
          "type": "string",
          "id": 8
        },
        "appVersion": {
          "type": "string",
          "id": 9
        },
        "sdkVersion": {
          "type": "string",
          "id": 10
        },
        "wxAppId": {
          "type": "string",
          "id": 11
        },
        "wxAppKey": {
          "type": "string",
          "id": 12
        },
        "webAppId": {
          "type": "string",
          "id": 13
        },
        "webAppKey": {
          "type": "string",
          "id": 14
        }
      }
    },
    "RouteResponse": {
      "fields": {
        "host": {
          "rule": "required",
          "type": "string",
          "id": 1
        },
        "longPort": {
          "rule": "required",
          "type": "int32",
          "id": 2
        },
        "shortPort": {
          "rule": "required",
          "type": "int32",
          "id": 3
        },
        "thumbPara": {
          "type": "string",
          "id": 4
        }
      }
    },
    "GetTokenRequest": {
      "fields": {
        "userId": {
          "rule": "required",
          "type": "string",
          "id": 1
        },
        "clientId": {
          "rule": "required",
          "type": "string",
          "id": 2
        }
      }
    },
    "LoadRemoteMessages": {
      "fields": {
        "conversation": {
          "rule": "required",
          "type": "Conversation",
          "id": 1
        },
        "beforeUid": {
          "rule": "required",
          "type": "int64",
          "id": 2
        },
        "count": {
          "rule": "required",
          "type": "int32",
          "id": 3
        }
      }
    },
    "MultiCastMessage": {
      "fields": {
        "fromUser": {
          "rule": "required",
          "type": "string",
          "id": 1
        },
        "content": {
          "rule": "required",
          "type": "MessageContent",
          "id": 2
        },
        "to": {
          "rule": "repeated",
          "type": "string",
          "id": 3
        },
        "line": {
          "rule": "required",
          "type": "int32",
          "id": 4
        }
      }
    }
  }
};
