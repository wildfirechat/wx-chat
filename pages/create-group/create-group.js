import wfc from "../../wfc/client/wfc";
import {sortByName, userItem} from "../../utils/display";
import {createGroupAndChat} from "../../utils/group";
import {toast} from "../../utils/ui";

/**
 * 发起群聊：选择好友，选择一个人时打开单聊，多个人时创建群聊
 */
Page({
    data: {
        items: [],
        keyword: '',
        selectedCount: 0,
    },

    onLoad() {
        this.selected = new Set();
        this.allItems = sortByName(wfc.getMyFriendList(false).map(uid => {
            let item = userItem(uid);
            item.checked = false;
            return item;
        }));
        this.setData({items: this.allItems});
    },

    onSearchInput(e) {
        let keyword = (e.detail.value || '').trim().toLowerCase();
        let items = keyword ? this.allItems.filter(i => (i.name || '').toLowerCase().indexOf(keyword) >= 0) : this.allItems;
        this.setData({keyword, items});
    },

    onItemTap(e) {
        let uid = e.currentTarget.dataset.uid;
        let item = this.allItems.find(i => i.uid === uid);
        if (!item) {
            return;
        }
        if (this.selected.has(uid)) {
            this.selected.delete(uid);
        } else {
            this.selected.add(uid);
        }
        item.checked = this.selected.has(uid);
        let data = {selectedCount: this.selected.size};
        let index = this.data.items.findIndex(i => i.uid === uid);
        if (index >= 0) {
            data[`items[${index}].checked`] = item.checked;
        }
        this.setData(data);
    },

    onConfirm() {
        if (this.selected.size === 0) {
            toast('请选择联系人');
            return;
        }
        createGroupAndChat(Array.from(this.selected), true);
    },
});
