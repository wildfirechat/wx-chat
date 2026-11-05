import wfc from "../../wfc/client/wfc";
import MessageContentType from "../../wfc/messages/messageContentType";
import MessagePayload from "../../wfc/messages/messagePayload";
import Message from "../../wfc/messages/message";
import Conversation from "../../wfc/model/conversation";
import CompositeMessageContent from "../../wfc/messages/compositeMessageContent";
import AppServerApi from "../../utils/appServerApi";
import {openCompositeMessage} from "../../utils/messageActions";
import {openDocument} from "../../utils/media";
import {confirm, formatDuration, formatFileSize, showActionMenu, toast} from "../../utils/ui";
import {timeFormat} from "../../utils/time";

/**
 * 收藏，数据保存在应用服务(app server)
 */
Page({
    data: {
        items: [],
        loading: false,
        hasMore: true,
        loaded: false,
    },

    onLoad() {
        this.favItems = [];
        this.loadMore();
    },

    onPullDownRefresh() {
        this.favItems = [];
        this.setData({items: [], hasMore: true});
        this.loadMore().then(() => wx.stopPullDownRefresh());
    },

    onReachBottom() {
        this.loadMore();
    },

    async loadMore() {
        if (this.data.loading || !this.data.hasMore) {
            return;
        }
        this.setData({loading: true});
        try {
            let startId = this.favItems.length > 0 ? this.favItems[this.favItems.length - 1].id : 0;
            let result = await AppServerApi.getFavList(startId, 20);
            let items = (result && result.items) || [];
            this.favItems = this.favItems.concat(items);
            this.setData({
                items: this.favItems.map(fi => this.toItem(fi)),
                hasMore: !!(result && result.hasMore),
                loading: false,
                loaded: true,
            });
        } catch (e) {
            console.log('load fav list error', e);
            this.setData({loading: false, loaded: true, hasMore: false});
            toast('加载收藏失败');
        }
    },

    _parseData(fi) {
        if (!fi.data || fi.type === MessageContentType.Composite_Message) {
            return {};
        }
        try {
            return typeof fi.data === 'string' ? JSON.parse(fi.data) : fi.data;
        } catch (e) {
            return {};
        }
    },

    toItem(fi) {
        let data = this._parseData(fi);
        let item = {
            id: fi.id,
            type: 'text',
            title: fi.title || '',
            origin: fi.origin || (fi.sender ? wfc.getUserDisplayName(fi.sender) : ''),
            time: timeFormat(fi.timestamp),
        };
        switch (fi.type) {
            case MessageContentType.Text:
                item.type = 'text';
                break;
            case MessageContentType.Image:
                item.type = 'image';
                item.url = fi.url;
                break;
            case MessageContentType.Video:
                item.type = 'video';
                item.thumb = data.thumb ? 'data:image/jpeg;base64,' + data.thumb : '';
                item.duration = data.duration ? formatDuration(data.duration / 1000) : '';
                break;
            case MessageContentType.File:
                item.type = 'file';
                item.title = fi.title || '文件';
                item.size = formatFileSize(data.size);
                break;
            case MessageContentType.Voice:
                item.type = 'text';
                item.title = `[语音] ${data.duration || 0}"`;
                break;
            case MessageContentType.Composite_Message: {
                item.type = 'composite';
                let content = this._compositeContent(fi);
                item.lines = content ? content.messages.slice(0, 2).map((m, index) => {
                    let digest = '';
                    try {
                        digest = m.messageContent.digest(m);
                    } catch (e) {
                        // ignore
                    }
                    return {k: index, text: wfc.getUserDisplayName(m.from) + '：' + digest};
                }) : [];
                break;
            }
            default:
                item.type = 'text';
                item.title = fi.title || '[消息]';
                break;
        }
        return item;
    },

    _compositeContent(fi) {
        if (!fi.data) {
            return null;
        }
        try {
            let content = new CompositeMessageContent();
            let payload = new MessagePayload();
            payload.type = MessageContentType.Composite_Message;
            payload.content = fi.title;
            payload.binaryContent = fi.data;
            content.decode(payload);
            return content;
        } catch (e) {
            console.log('decode composite fav error', e);
            return null;
        }
    },

    _favItem(id) {
        return this.favItems.find(fi => fi.id === id);
    },

    onItemTap(e) {
        let fi = this._favItem(e.currentTarget.dataset.id);
        if (!fi) {
            return;
        }
        switch (fi.type) {
            case MessageContentType.Image:
                wx.previewMedia({sources: [{url: fi.url, type: 'image'}], showmenu: true});
                break;
            case MessageContentType.Video:
                wx.previewMedia({sources: [{url: fi.url, type: 'video'}], showmenu: true});
                break;
            case MessageContentType.File:
                openDocument(fi.url, fi.title).catch(() => {
                    wx.setClipboardData({data: fi.url || '', success: () => toast('暂不支持打开该文件，链接已复制')});
                });
                break;
            case MessageContentType.Composite_Message: {
                let content = this._compositeContent(fi);
                if (content) {
                    let conversation = new Conversation(fi.convType, fi.convTarget, fi.convLine);
                    let message = new Message(conversation, content);
                    message.from = fi.sender;
                    openCompositeMessage(message);
                }
                break;
            }
            default:
                if (fi.title) {
                    wx.showModal({title: '', content: fi.title, confirmText: '复制', success: res => {
                        if (res.confirm) {
                            wx.setClipboardData({data: fi.title});
                        }
                    }});
                }
                break;
        }
    },

    onItemLongPress(e) {
        let fi = this._favItem(e.currentTarget.dataset.id);
        if (!fi) {
            return;
        }
        let items = [];
        if (fi.type === MessageContentType.Text && fi.title) {
            items.push({label: '复制', action: () => wx.setClipboardData({data: fi.title})});
        }
        items.push({
            label: '删除',
            action: async () => {
                if (!(await confirm('删除收藏', '确定删除这条收藏？', '删除', '#fa5151'))) {
                    return;
                }
                AppServerApi.delFav(fi.id).then(() => {
                    this.favItems = this.favItems.filter(f => f.id !== fi.id);
                    this.setData({items: this.favItems.map(f => this.toItem(f))});
                }).catch(() => toast('删除失败'));
            }
        });
        showActionMenu(items);
    },
});
