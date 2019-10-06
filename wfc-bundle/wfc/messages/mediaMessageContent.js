import MessageContent from './messageContent'
import MessageContentMediaType from './messageContentMediaType';
export default class MediaMessageContent extends MessageContent {
    localPath = '';
    remotePath = '';
    mediaType = 0;

    constructor(messageType, mediaType, localPath, remotePath = '') {
        super(messageType);
        this.mediaType = mediaType;
        this.localPath = localPath;
        this.remotePath = remotePath;
    }

    encode() {
        let payload = super.encode();
        payload.localMediaPath = this.localPath;
        payload.remoteMediaUrl = this.remotePath;
        payload.mediaType = this.mediaType;
        return payload;
    };

    decode(payload) {
        super.decode(payload);
        this.localPath = payload.localMediaPath;
        this.remotePath = payload.remoteMediaUrl;
        this.mediaType = payload.mediaType;
    }
}
