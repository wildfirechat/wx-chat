import MessageContent from "./messageContent";
import MessageContentType from "./messageContentType";
import MessageContentMediaType from "./messageContentMediaType";
import wfc from "../client/wfc";

export default class PcLoginRequestMessageContent extends MessageContent{
    platform;
    sessionId;


    constructor() {
        super(MessageContentType.PC_Login_Request);
    }

    digest() {
        return '[PC请求登录]';
    }

    encode() {
        let payload = super.encode();
        payload.mediaType = MessageContentMediaType.File;
        let obj = {
            p : this.platform,
            t: this.sessionId,
        };
        payload.binaryContent = wfc.utf8_to_b64(JSON.stringify(obj));
        return payload;
    }

    decode(payload) {
        super.decode(payload);
        let obj = JSON.parse(wfc.b64_to_utf8(payload.binaryContent));
        this.platform = obj.p;
        this.sessionId = obj.t;
    }

}
