import MessageContentMediaType from "./messageContentMediaType";
import MediaMessageContent from "./mediaMessageContent";
import MessageContentType from "./messageContentType";

export default class FileMessageContent extends MediaMessageContent {
    name = '';
    size = 0;

    constructor(localPath, remotePath, name, size) {
        super(MessageContentType.File, MessageContentMediaType.File, localPath, remotePath);
        if (file) {
            this.name = name;
            this.size = size;
        }
    }

    digest() {
        return '[文件]';
    }

    encode() {
        let payload = super.encode();
        payload.searchableContent = this.name;
        payload.content = this.size + '';
        return payload;
    };

    decode(payload) {
        super.decode(payload);
        this.name = payload.searchableContent;
        this.size = Number(payload.content);
    }

}