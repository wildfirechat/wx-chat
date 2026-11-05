import wfc from "../wfc/client/wfc";
import GroupType from "../wfc/model/groupType";
import GroupMemberType from "../wfc/model/groupMemberType";

/**
 * 群权限判断，和 web 端保持一致
 */

export function selfMemberType(groupId) {
    let member = wfc.getGroupMember(groupId, wfc.getUserId());
    return member ? member.type : -1;
}

export function isGroupMember(groupId) {
    let type = selfMemberType(groupId);
    return type >= 0 && type !== GroupMemberType.Removed;
}

export function isOwner(groupInfo) {
    return groupInfo.owner === wfc.getUserId() || selfMemberType(groupInfo.target) === GroupMemberType.Owner;
}

export function isManagerOrOwner(groupInfo) {
    return isOwner(groupInfo) || selfMemberType(groupInfo.target) === GroupMemberType.Manager;
}

export function canAddMember(groupInfo) {
    if (groupInfo.type === GroupType.Organization) {
        return false;
    }
    // Restricted 群：joinType 0 开放加入；1 只能群成员拉人；2 只能群管理拉人
    if (groupInfo.type === GroupType.Restricted && groupInfo.joinType === 2) {
        return isManagerOrOwner(groupInfo);
    }
    return true;
}

export function canRemoveMember(groupInfo) {
    if (groupInfo.type === GroupType.Organization) {
        return false;
    }
    return isManagerOrOwner(groupInfo);
}

export function canModifyGroupInfo(groupInfo) {
    if (groupInfo.type === GroupType.Organization) {
        return false;
    }
    if (groupInfo.type === GroupType.Restricted) {
        return isManagerOrOwner(groupInfo);
    }
    return true;
}

export function canModifyAnnouncement(groupInfo) {
    return isManagerOrOwner(groupInfo);
}

export function canDismiss(groupInfo) {
    return groupInfo.type !== GroupType.Organization && isOwner(groupInfo);
}

export function canQuit(groupInfo) {
    return groupInfo.type !== GroupType.Organization;
}
