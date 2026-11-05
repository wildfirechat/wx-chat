import wfc from "../wfc/client/wfc";
import GroupType from "../wfc/model/groupType";
import Conversation from "../wfc/model/conversation";
import ConversationType from "../wfc/model/conversationType";
import {toChat} from "./nav";
import {hideLoading, showLoading, toast} from "./ui";

/**
 * 创建群聊并打开会话，和 web 端保持一致：群类型为 Restricted，群名称为前几个成员的名称
 * 只选择了一个人时，打开单聊
 * @param {[string]} userIds 不包含自己
 * @param {boolean} redirect 是否替换当前页面
 */
export function createGroupAndChat(userIds, redirect = true) {
    let selfUid = wfc.getUserId();
    userIds = userIds.filter(uid => uid !== selfUid);
    if (userIds.length === 0) {
        return;
    }
    if (userIds.length === 1) {
        toChat(new Conversation(ConversationType.Single, userIds[0], 0), {redirect});
        return;
    }
    let memberIds = [selfUid].concat(userIds);
    let groupName = memberIds.slice(0, 4).map(uid => wfc.getUserDisplayName(uid)).join('、');
    if (groupName.length > 30) {
        groupName = groupName.substring(0, 30);
    }
    showLoading('正在创建');
    wfc.createGroup(null, GroupType.Restricted, groupName, '', '', memberIds, '', [0], null, groupId => {
        hideLoading();
        toChat(new Conversation(ConversationType.Group, groupId, 0), {redirect});
    }, errorCode => {
        hideLoading();
        toast('创建群聊失败 ' + errorCode);
    });
}
