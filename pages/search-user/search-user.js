import wfc from "../../wfc/client/wfc";
import {toUserDetail} from "../../utils/nav";
import {portraitOrDefault} from "../../utils/display";
import {hideLoading, prompt, showLoading, toast} from "../../utils/ui";

/**
 * 添加朋友：从服务端搜索用户
 */
Page({
    data: {
        keyword: '',
        searched: false,
        searchResults: []
    },

    onLoad(options) {
        if (options.keyword) {
            this.setData({keyword: decodeURIComponent(options.keyword)});
            this.onSearchConfirm();
        }
    },

    onSearchInput(e) {
        this.setData({keyword: (e.detail.value || '').trim()});
    },

    onSearchConfirm() {
        let keyword = this.data.keyword;
        if (!keyword) {
            return;
        }
        showLoading('正在搜索');
        wfc.searchUser(keyword, 0, 0, (kw, users) => {
            hideLoading();
            let selfUid = wfc.getUserId();
            let searchResults = (users || []).map(user => ({
                uid: user.uid,
                portrait: portraitOrDefault(user.portrait),
                name: user.displayName || user.name,
                account: user.name,
                isFriend: wfc.isMyFriend(user.uid),
                isSelf: user.uid === selfUid,
            }));
            this.setData({searchResults, searched: true});
        }, (err) => {
            hideLoading();
            console.error('Search user failed', err);
            toast('搜索失败');
        });
    },

    onUserTap(e) {
        toUserDetail(e.currentTarget.dataset.uid);
    },

    async addUser(e) {
        let uid = e.currentTarget.dataset.uid;
        let myName = wfc.getUserDisplayName(wfc.getUserId());
        let reason = await prompt('发送好友申请', '验证信息', `我是${myName}`);
        if (reason === null) {
            return;
        }
        wfc.sendFriendRequest(uid, reason, '', () => {
            toast('已发送', 'success');
        }, (err) => {
            console.error('Send friend request failed', err);
            toast('发送失败 ' + err);
        });
    },
});
