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
        this.setData({options: options.options});
        this.loadGroupMembers(groupId);
    },

    loadGroupMembers(groupId) {
        const members = wfc.getGroupMembers(groupId).map(member => {
            const userInfo = wfc.getUserInfo(member.memberId, false);
            return {
                userId: userInfo.uid,
                userHeadUrl: userInfo.portrait ? userInfo.portrait : Config.DEFAULT_PORTRAIT_URL,
                userName: userInfo.displayName,
                selected: false
            };
        });
        this.setData({members});
    },

    toggleSelect(e) {
        const userId = e.currentTarget.dataset.userid;
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