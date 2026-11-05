import wfc from "../../wfc/client/wfc";
import EventType from "../../wfc/client/wfcEvent";
import ModifyMyInfoType from "../../wfc/model/modifyMyInfoType";
import ModifyMyInfoEntry from "../../wfc/model/modifyMyInfoEntry";
import MessageContentMediaType from "../../wfc/messages/messageContentMediaType";
import {bindWfcEvents, unbindWfcEvents} from "../../utils/wfcEvents";
import {portraitOrDefault} from "../../utils/display";
import {hideLoading, prompt, showActionMenu, showLoading, toast} from "../../utils/ui";
import {uploadFile} from "../../utils/media";

const GENDERS = ['未设置', '男', '女'];

/**
 * 个人信息
 */
Page({
    data: {
        portrait: '',
        displayName: '',
        account: '',
        gender: '',
        mobile: '',
        email: '',
    },

    onLoad() {
        bindWfcEvents(this, {
            [EventType.UserInfosUpdate]: 'refresh',
        });
        this.refresh();
    },

    onUnload() {
        unbindWfcEvents(this);
    },

    refresh() {
        let userInfo = wfc.getUserInfo(wfc.getUserId(), false);
        this.setData({
            portrait: portraitOrDefault(userInfo.portrait),
            displayName: userInfo.displayName || '',
            account: userInfo.name || '',
            gender: GENDERS[userInfo.gender] || GENDERS[0],
            mobile: userInfo.mobile || '',
            email: userInfo.email || '',
        });
    },

    modify(type, value) {
        return new Promise((resolve, reject) => {
            let entry = new ModifyMyInfoEntry();
            entry.type = type;
            entry.value = value;
            wfc.modifyMyInfo([entry], () => {
                // 刷新自己的用户信息
                wfc.getUserInfo(wfc.getUserId(), true);
                resolve();
            }, errorCode => reject(errorCode));
        });
    },

    onPortraitTap() {
        showActionMenu([
            {label: '查看头像', action: () => wx.previewImage({urls: [this.data.portrait]})},
            {label: '从相册选择', action: () => this.choosePortrait(['album'])},
            {label: '拍照', action: () => this.choosePortrait(['camera'])},
        ]);
    },

    choosePortrait(sourceType) {
        wx.chooseMedia({
            count: 1,
            mediaType: ['image'],
            sourceType,
            sizeType: ['compressed'],
            success: res => {
                let path = res.tempFiles[0].tempFilePath;
                if (wx.cropImage) {
                    wx.cropImage({
                        src: path,
                        cropScale: '1:1',
                        success: r => this.uploadPortrait(r.tempFilePath),
                        fail: e => {
                            if (!e || !e.errMsg || e.errMsg.indexOf('cancel') === -1) {
                                this.uploadPortrait(path);
                            }
                        },
                    });
                } else {
                    this.uploadPortrait(path);
                }
            }
        });
    },

    async uploadPortrait(path) {
        showLoading('正在上传');
        try {
            let ext = path.substring(path.lastIndexOf('.'));
            let url = await uploadFile(`portrait-${new Date().getTime()}${ext}`, path, MessageContentMediaType.Portrait);
            await this.modify(ModifyMyInfoType.Modify_Portrait, url);
            hideLoading();
            this.setData({portrait: url});
            toast('头像已更新', 'success');
        } catch (e) {
            hideLoading();
            console.log('update portrait error', e);
            toast('修改头像失败');
        }
    },

    async onDisplayNameTap() {
        let name = await prompt('修改昵称', '昵称', this.data.displayName);
        if (name === null || name === this.data.displayName) {
            return;
        }
        if (!name) {
            toast('昵称不能为空');
            return;
        }
        try {
            await this.modify(ModifyMyInfoType.Modify_DisplayName, name);
            this.setData({displayName: name});
        } catch (e) {
            toast('修改失败 ' + e);
        }
    },

    onGenderTap() {
        let setGender = async (value) => {
            try {
                await this.modify(ModifyMyInfoType.Modify_Gender, String(value));
                this.setData({gender: GENDERS[value]});
            } catch (e) {
                toast('修改失败 ' + e);
            }
        };
        showActionMenu([
            {label: '男', action: () => setGender(1)},
            {label: '女', action: () => setGender(2)},
        ]);
    },

    async onEmailTap() {
        let email = await prompt('修改邮箱', '邮箱', this.data.email);
        if (email === null || email === this.data.email) {
            return;
        }
        try {
            await this.modify(ModifyMyInfoType.Modify_Email, email);
            this.setData({email});
        } catch (e) {
            toast('修改失败 ' + e);
        }
    },

    onCopyAccount() {
        if (this.data.account) {
            wx.setClipboardData({data: this.data.account});
        }
    },
});
