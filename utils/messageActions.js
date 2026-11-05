import wfc from "../wfc/client/wfc";
import MessageContentType from "../wfc/messages/messageContentType";
import Conversation from "../wfc/model/conversation";
import ConversationType from "../wfc/model/conversationType";
import avenginekitproxy from "../wfc/av/engine/avenginekitproxy";
import {mediaUrl, openDocument, saveToPhotosAlbum} from "./media";
import {toChat, toUserDetail} from "./nav";
import {showActionMenu, toast} from "./ui";

/**
 * 消息点击等通用处理，会话页面和聊天记录页面共用
 */

function isImage(m) {
    let type = m.messageContent && m.messageContent.type;
    return type === MessageContentType.Image || type === MessageContentType.Sticker;
}

function isVideo(m) {
    return m.messageContent && m.messageContent.type === MessageContentType.Video;
}

/**
 * 预览图片和视频，支持左右滑动
 * @param {[Message]} messages 当前列表中的所有消息
 * @param {Message} current 当前点击的消息
 */
export function previewMedia(messages, current) {
    let sources = [];
    let currentIndex = 0;
    messages.forEach(m => {
        if (!isImage(m) && !isVideo(m)) {
            return;
        }
        let url = mediaUrl(m.messageContent);
        if (!url) {
            return;
        }
        if (m === current) {
            currentIndex = sources.length;
        }
        if (isVideo(m)) {
            let thumb = m.messageContent.thumbnail;
            sources.push({
                url,
                type: 'video',
                poster: thumb ? 'data:image/jpeg;base64,' + thumb : undefined,
            });
        } else {
            sources.push({url, type: 'image'});
        }
    });
    if (sources.length === 0) {
        toast('媒体文件不存在');
        return;
    }
    wx.previewMedia({
        sources,
        current: currentIndex,
        showmenu: true,
    });
}

function copyLink(url) {
    if (!url) {
        return;
    }
    wx.setClipboardData({
        data: url,
        success: () => toast('链接已复制，请在浏览器中打开')
    });
}

export function openFile(message) {
    let content = message.messageContent;
    let url = mediaUrl(content);
    openDocument(url, content.name).catch(e => {
        if (e && e.message === 'unsupported') {
            showActionMenu([{label: '复制文件链接', action: () => copyLink(content.remotePath || url)}]);
            toast('小程序暂不支持打开该类型文件');
        } else {
            console.log('open document error', e);
            toast('打开文件失败');
        }
    });
}

export function openUserCard(content) {
    switch (content.cardType) {
        case 0:
            toUserDetail(content.target);
            break;
        case 1: {
            let member = wfc.getGroupMember(content.target, wfc.getUserId());
            if (member) {
                toChat(new Conversation(ConversationType.Group, content.target, 0));
            } else {
                toast('你不是该群成员');
            }
            break;
        }
        default:
            toast('暂不支持查看该名片');
            break;
    }
}

export function openCompositeMessage(message) {
    getApp().globalData.compositeMessage = message;
    wx.navigateTo({url: '/pages/composite-message/composite-message'});
}

/**
 * 点击消息
 * @param {Message} message
 * @param {[Message]} messages 当前列表中的所有消息，用于图片、视频预览时左右滑动
 * @return {boolean} 是否已处理
 */
export function openMessage(message, messages) {
    let content = message.messageContent;
    if (!content) {
        return false;
    }
    switch (content.type) {
        case MessageContentType.Image:
        case MessageContentType.Sticker:
        case MessageContentType.Video:
            previewMedia(messages || [message], message);
            return true;
        case MessageContentType.File:
            openFile(message);
            return true;
        case MessageContentType.Location:
            wx.openLocation({
                latitude: Number(content.lat),
                longitude: Number(content.long),
                name: content.title || '',
                scale: 16,
            });
            return true;
        case MessageContentType.Link:
            copyLink(content.url);
            return true;
        case MessageContentType.Articles:
            copyLink(content.topArticle && content.topArticle.url);
            return true;
        case MessageContentType.UserCard:
            openUserCard(content);
            return true;
        case MessageContentType.Composite_Message:
            openCompositeMessage(message);
            return true;
        case MessageContentType.CONFERENCE_CONTENT_TYPE_INVITE:
            avenginekitproxy.joinConference(content.callId, content.audioOnly, content.pin, content.host, content.title, content.desc, content.audience, content.advanced, false, false);
            return true;
        default:
            return false;
    }
}

/**
 * 保存图片、视频到相册
 */
export function saveMedia(message) {
    let url = mediaUrl(message.messageContent);
    saveToPhotosAlbum(url, isVideo(message) ? 'video' : 'image');
}

export function isSavable(message) {
    return isImage(message) || isVideo(message);
}
