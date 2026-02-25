import wfc from "../../wfc/client/wfc";
import Config from "../../config";

Page({
    data: {
        members: [],
        isConfirmDisabled: true,
        options: {}
    },

    onLoad(options) {
        const groupId = options.groupId;
        let opts = options.options;
        if (opts && typeof opts === 'string') {
            try {
                opts = JSON.parse(opts);
            } catch (e) {
                console.error('parse options error', e);
            }
        }
        this.setData({
            options: opts,
            mode: options.mode
        });
        this.loadGroupMembers(groupId);
    },

    loadGroupMembers(groupId) {
        let members = wfc.getGroupMembers(groupId).map(member => {
            const userInfo = wfc.getUserInfo(member.memberId, false);
            return {
                userId: userInfo.uid,
                userHeadUrl: userInfo.portrait ? userInfo.portrait : Config.DEFAULT_PORTRAIT_URL,
                userName: userInfo.displayName,
                selected: false
            };
        });

        if (this.data.mode === 'single' && this.data.options && this.data.options.op === 'mention') {
            members.unshift({
                userId: 'All',
                userHeadUrl: Config.DEFAULT_PORTRAIT_URL, // You might want a specific icon for @All
                userName: '所有人',
                selected: false
            });
        }
        this.setData({members});
    },

    toggleSelect(e) {
        const userId = e.currentTarget.dataset.userid;
        if (this.data.mode === 'single') {
            const pages = getCurrentPages();
            const prevPage = pages[pages.length - 2];
            wx.navigateBack();
            prevPage.onSelectGroupMember([userId], this.data.options);
            return;
        }

        const members = this.data.members.map(member => {
            if (member.userId === userId) {
                member.selected = !member.selected;
            }
            return member;
        });
        const isConfirmDisabled = !members.some(member => member.selected);
        this.setData({members, isConfirmDisabled});
    },

    confirmSelection() {
        const selectedMembers = this.data.members.filter(member => member.selected).map(member => member.userId);
        const pages = getCurrentPages();
        const prevPage = pages[pages.length - 2];
        wx.navigateBack();
        prevPage.onSelectGroupMember(selectedMembers, this.data.options);
    }
});