import NotificationMessageContent from "./notificationMessageContent";
import wfc from '../../wfc'
import MessageContentType from "../messageContentType";
import GroupNotificationContent from "./groupNotification";

export default class ChangeGroupNameNotification extends GroupNotificationContent {
    operator = '';
    name = '';

    constructor(operator, name) {
        super(MessageContentType.ChangeGroupName_Notification);
        this.operator = operator;
        this.name = name;
    }

    formatNotification() {
        if (this.fromSelf) {
            return '您修改群名称为：' + this.name;
        } else {
            let u = wfc.getUserInfo(this.operator);
            return u.displayName + '修改群名称为：' + this.name;
        }
    }

    encode() {
        let payload = super.encode();
        let obj = {
            g: this.groupId,
            n: this.name,
            o: this.operator,
        };
        payload.binaryContent = this.btoa(JSON.stringify(obj));
        return payload;
    }

    decode(payload) {
        super.decode(payload);
        let json = this.atob(payload.binaryContent)
        let obj = JSON.parse(json);
        this.groupId = obj.g;
        this.operator = obj.o;
        this.name = obj.n;
    }

}