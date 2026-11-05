import wfc from "../../wfc/client/wfc";
import Config from "../../config";
import {sortByName, userItem} from "../../utils/display";
import {toast} from "../../utils/ui";

/**
 * 通用的用户选择页面，通过 utils/nav.js 中的 pickUsers 打开
 */
Page({
    data: {
        items: [],
        multi: true,
        keyword: '',
        selectedCount: 0,
        confirmText: '完成',
    },

    onLoad() {
        this.done = false;
        this.selected = new Set();
        this.allItems = [];
        this.eventChannel = this.getOpenerEventChannel();
        this.eventChannel.on('options', options => this.init(options || {}));
    },

    onUnload() {
        if (!this.done && this.eventChannel) {
            this.eventChannel.emit('canceled');
        }
    },

    init(options) {
        this.options = options;
        let multi = options.multi !== false;
        let groupId = options.source === 'group' ? options.groupId : '';
        let excludes = new Set(options.excludes || []);
        let disabled = new Set(options.disabled || []);
        this.maxCount = options.maxCount || 0;

        let uids;
        if (options.userIds) {
            uids = options.userIds;
        } else if (options.source === 'group') {
            uids = wfc.getGroupMemberIds(groupId, false);
        } else {
            uids = wfc.getMyFriendList(false);
        }
        let items = uids.filter(uid => !excludes.has(uid)).map(uid => {
            let item = userItem(uid, groupId);
            item.disabled = disabled.has(uid);
            item.checked = item.disabled;
            return item;
        });
        sortByName(items);
        if (!multi && options.mentionAll) {
            items.unshift({uid: 'All', name: '所有人', portrait: Config.DEFAULT_GROUP_PORTRAIT, disabled: false, checked: false});
        }
        this.allItems = items;
        wx.setNavigationBarTitle({title: options.title || '选择联系人'});
        this.setData({
            multi,
            confirmText: options.confirmText || '完成',
            items,
        });
    },

    onSearchInput(e) {
        let keyword = (e.detail.value || '').trim().toLowerCase();
        let items = keyword ? this.allItems.filter(i => (i.name || '').toLowerCase().indexOf(keyword) >= 0 || i.uid.toLowerCase() === keyword) : this.allItems;
        this.setData({keyword, items});
    },

    onItemTap(e) {
        let uid = e.currentTarget.dataset.uid;
        let item = this.allItems.find(i => i.uid === uid);
        if (!item || item.disabled) {
            return;
        }
        if (!this.data.multi) {
            this.finish([uid]);
            return;
        }
        if (this.selected.has(uid)) {
            this.selected.delete(uid);
            item.checked = false;
        } else {
            if (this.maxCount && this.selected.size >= this.maxCount) {
                toast(`最多选择${this.maxCount}人`);
                return;
            }
            this.selected.add(uid);
            item.checked = true;
        }
        let index = this.data.items.findIndex(i => i.uid === uid);
        let data = {selectedCount: this.selected.size};
        if (index >= 0) {
            data[`items[${index}].checked`] = item.checked;
        }
        this.setData(data);
    },

    onConfirm() {
        if (this.selected.size === 0) {
            toast('请至少选择一个');
            return;
        }
        this.finish(Array.from(this.selected));
    },

    finish(uids) {
        this.done = true;
        this.eventChannel.emit('picked', uids);
        wx.navigateBack();
    },
});
