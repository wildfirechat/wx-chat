import wfc from "../wfc/client/wfc";
import Config from "../config";
import MessageContentType from "../wfc/messages/messageContentType";
import MessageStatus from "../wfc/messages/messageStatus";
import NotificationMessageContent from "../wfc/messages/notification/notificationMessageContent";
import RecallMessageNotification from "../wfc/messages/notification/recallMessageNotification";
import RichNotificationMessageContent from "../wfc/messages/notification/richNotificationMessageContent";
import UnknownMessageContent from "../wfc/messages/unknownMessageContent";
import UnsupportMessageContent from "../wfc/messages/unsupportMessageConten";
import ConversationType from "../wfc/model/conversationType";
import {gt, gte, numberValue, stringValue} from "../wfc/util/longUtil";
import {timeFormat} from "./time";
import {formatDuration, formatFileSize} from "./ui";
import {mediaUrl} from "./media";

/**
 * 将 sdk 的 Message 转换成页面渲染需要的精简数据
 * 页面 data 中只保存这些精简数据，避免 setData 数据量过大
 */

// 自己撤回的文本消息，多长时间内可以重新编辑，单位秒
export const RECALL_REEDIT_TIME_LIMIT = 60;
// 两条消息间隔多久显示时间，单位毫秒
const SHOW_TIME_INTERVAL = 5 * 60 * 1000;

export function messageKey(m) {
    if (m.messageId > 0) {
        return 'm' + m.messageId;
    }
    if (m.messageUid && gt(m.messageUid, 0)) {
        return 'u' + stringValue(m.messageUid);
    }
    if (m.messageContent && m.messageContent.streamId) {
        return 's' + m.messageContent.streamId;
    }
    return 't' + numberValue(m.timestamp);
}

function imageBox(width, height, max = 360, min = 120) {
    if (!width || !height) {
        return {width: 240, height: 240};
    }
    if (width >= height) {
        return {width: max, height: Math.max(min, Math.round(max * height / width))};
    }
    return {width: Math.max(min, Math.round(max * width / height)), height: max};
}

function base64Image(base64) {
    if (!base64) {
        return '';
    }
    if (base64.startsWith('data:')) {
        return base64;
    }
    return 'data:image/jpeg;base64,' + base64;
}

function safeDigest(message) {
    try {
        return message.messageContent.digest(message) || '';
    } catch (e) {
        return '';
    }
}

function senderName(message) {
    if (message.conversation && message.conversation.type === ConversationType.Group) {
        return wfc.getGroupMemberDisplayName(message.conversation.target, message.from);
    }
    return wfc.getUserDisplayName(message.from);
}

function fileExt(name) {
    if (!name || name.lastIndexOf('.') === -1) {
        return '';
    }
    return name.substring(name.lastIndexOf('.') + 1).toUpperCase().substring(0, 4);
}

/**
 * 填充和消息内容相关的字段
 */
function fillContent(item, m) {
    let content = m.messageContent;
    let type = content ? content.type : MessageContentType.Unknown;

    if (content instanceof NotificationMessageContent) {
        item.type = 'notification';
        if (content instanceof RichNotificationMessageContent) {
            item.type = 'rich';
            item.title = content.title;
            item.desc = content.desc;
            item.remark = content.remark;
            item.exName = content.exName;
            item.datas = (content.datas || []).map(d => ({key: d.key, value: d.value, color: d.color}));
            return;
        }
        try {
            item.content = content.formatNotification(m);
        } catch (e) {
            item.content = '';
        }
        if (content instanceof RecallMessageNotification
            && content.operatorId === wfc.getUserId()
            && content.originalContentType === MessageContentType.Text
            && content.originalSearchableContent) {
            let now = new Date().getTime() + wfc.getServerDeltaTime();
            item.reeditable = now - numberValue(m.timestamp) < RECALL_REEDIT_TIME_LIMIT * 1000;
        }
        return;
    }

    switch (type) {
        case MessageContentType.Text:
        case MessageContentType.P_Text:
            item.type = 'text';
            item.content = content.content;
            if (content.quoteInfo && content.quoteInfo.messageDigest) {
                item.quote = {
                    name: content.quoteInfo.userDisplayName || '',
                    digest: content.quoteInfo.messageDigest,
                };
            }
            break;
        case MessageContentType.Streaming_Text_Generating:
        case MessageContentType.Streaming_Text_Generated:
            item.type = 'text';
            item.content = content.text;
            item.streaming = type === MessageContentType.Streaming_Text_Generating;
            break;
        case MessageContentType.Image: {
            item.type = 'image';
            item.url = mediaUrl(content);
            item.thumb = base64Image(content.thumbnail);
            let box = imageBox(content.imageWidth, content.imageHeight);
            item.width = box.width;
            item.height = box.height;
            break;
        }
        case MessageContentType.Sticker: {
            item.type = 'image';
            item.sticker = true;
            item.url = mediaUrl(content);
            let box = imageBox(content.width, content.height, 240, 120);
            item.width = box.width;
            item.height = box.height;
            break;
        }
        case MessageContentType.Video:
            item.type = 'video';
            item.url = mediaUrl(content);
            item.thumb = base64Image(content.thumbnail);
            // 时长单位是毫秒，和 android/ios 保持一致
            item.duration = content.duration ? formatDuration(content.duration / 1000) : '';
            break;
        case MessageContentType.Voice:
            item.type = 'voice';
            item.url = mediaUrl(content);
            item.voiceDuration = content.duration || 0;
            item.voiceWidth = Math.min(420, 140 + item.voiceDuration * 8);
            break;
        case MessageContentType.File:
            item.type = 'file';
            item.url = mediaUrl(content);
            item.name = content.name || '文件';
            item.size = formatFileSize(content.size);
            item.ext = fileExt(content.name);
            break;
        case MessageContentType.Location:
            item.type = 'location';
            item.title = content.title || '位置';
            item.thumb = base64Image(content.thumbnail);
            break;
        case MessageContentType.Link:
            item.type = 'link';
            item.title = content.title || content.url;
            item.desc = content.contentDigest || '';
            item.thumb = content.thumbnail || '';
            item.url = content.url;
            break;
        case MessageContentType.Articles: {
            let top = content.topArticle || {};
            item.type = 'link';
            item.title = top.title || '';
            item.desc = top.digest || '';
            item.thumb = top.cover || '';
            item.url = top.url;
            break;
        }
        case MessageContentType.UserCard:
            item.type = 'card';
            item.cardType = content.cardType;
            item.target = content.target;
            item.title = content.displayName || content.name || content.target;
            item.thumb = content.portrait || Config.DEFAULT_PORTRAIT_URL;
            item.desc = ['个人名片', '群组名片', '聊天室名片', '频道名片'][content.cardType] || '名片';
            break;
        case MessageContentType.Composite_Message:
            item.type = 'composite';
            item.title = content.title || '聊天记录';
            item.lines = (content.messages || []).slice(0, 3).map((sub, index) => {
                return {k: index, text: senderName(sub) + '：' + safeDigest(sub)};
            });
            break;
        case MessageContentType.VOIP_CONTENT_TYPE_START:
            item.type = 'call';
            item.content = safeDigest(m);
            item.audioOnly = !!content.audioOnly;
            break;
        case MessageContentType.CONFERENCE_CONTENT_TYPE_INVITE:
            item.type = 'conference';
            item.title = content.title || '会议邀请';
            item.content = safeDigest(m);
            break;
        default:
            item.type = 'text';
            if (content instanceof UnknownMessageContent || content instanceof UnsupportMessageContent || !content) {
                item.content = '[暂不支持此消息类型，请在手机上查看]';
                item.unsupported = true;
            } else {
                item.content = safeDigest(m) || '[暂不支持此消息类型，请在手机上查看]';
            }
            break;
    }
}

/**
 * @param {Message} m
 * @param {object} ctx
 *   prevTimestamp: 上一条消息的时间，用于计算是否显示时间
 *   readTime: 单聊对方的已读时间，用于显示已读状态，undefined 时不显示
 *   playingKey: 正在播放的语音消息
 *   selectedKeys: Set，多选时选中的消息
 *   multiSelect: 是否处于多选状态
 */
export function messageToItem(m, ctx = {}) {
    let timestamp = numberValue(m.timestamp);
    let isMy = m.direction === 0;
    let conversation = m.conversation;
    let isGroup = conversation && conversation.type === ConversationType.Group;
    let item = {
        key: messageKey(m),
        messageId: m.messageId,
        from: m.from,
        isMy,
        time: timeFormat(timestamp),
        showTime: !ctx.prevTimestamp || timestamp - ctx.prevTimestamp > SHOW_TIME_INTERVAL,
    };

    fillContent(item, m);

    if (item.type === 'notification' || item.type === 'rich') {
        return item;
    }

    let userInfo = wfc.getUserInfo(m.from, false, isGroup ? conversation.target : '');
    item.portrait = userInfo.portrait || Config.DEFAULT_PORTRAIT_URL;
    if (isGroup && !isMy) {
        item.senderName = wfc.getGroupMemberDisplayNameEx(userInfo);
    }

    if (isMy) {
        switch (m.status) {
            case MessageStatus.Sending:
                item.status = 'sending';
                break;
            case MessageStatus.SendFailure:
                item.status = 'failed';
                break;
            default:
                item.status = 'success';
                if (ctx.readTime !== undefined && m.status === MessageStatus.Sent) {
                    item.readStatus = ctx.readTime && gte(ctx.readTime, m.timestamp) ? '已读' : '未读';
                }
                break;
        }
    }

    if (item.type === 'voice') {
        item.isPlaying = ctx.playingKey === item.key;
    }
    if (ctx.multiSelect) {
        item.selectable = ['call', 'conference', 'voice'].indexOf(item.type) === -1;
        item.checked = !!(ctx.selectedKeys && ctx.selectedKeys.has(item.key));
    }
    return item;
}

/**
 * 批量转换，并计算时间显示
 */
export function messagesToItems(messages, ctx = {}) {
    let prevTimestamp = 0;
    return messages.map(m => {
        let item;
        try {
            item = messageToItem(m, Object.assign({}, ctx, {prevTimestamp}));
        } catch (e) {
            // 单条消息解析异常，不影响其他消息显示
            console.error('messageToItem error', m, e);
            item = {key: messageKey(m), messageId: m.messageId, type: 'notification', content: '[消息解析失败]'};
        }
        prevTimestamp = numberValue(m.timestamp);
        return item;
    });
}

/**
 * 会话列表等地方显示的消息摘要
 */
export function messageDigest(message, conversation) {
    if (!message || !message.messageContent) {
        return '';
    }
    let digest = safeDigest(message).replace(/\n/g, ' ');
    if (conversation && conversation.type === ConversationType.Group
        && message.direction === 1
        && !(message.messageContent instanceof NotificationMessageContent)
        && message.from) {
        digest = wfc.getGroupMemberDisplayName(conversation.target, message.from) + '：' + digest;
    }
    return digest;
}
