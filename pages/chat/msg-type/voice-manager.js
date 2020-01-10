import { downloadFile } from "../../../utils/tools";


export default class VoiceManager {
    constructor(page) {
        this._page = page;

        //判断是否需要使用高版本语音播放接口
        this.innerAudioContext = wx.createInnerAudioContext();
        //在该类被初始化时，绑定语音点击播放事件
        // this._page.chatVoiceItemClickEvent = async (e) => {
        //     let dataset = e.currentTarget.dataset;
        //     console.log('点击的语音Item包含的信息', dataset);
        //     await this._playVoice({ dataset })
        // }
    }

    /**
     * 停止播放所有语音
     */
    stopAllVoicePlay(isUpdateView = true) {
        let that = this._page;
        if (this._page.data.isVoicePlaying) {
            this._stopVoice();
            if (isUpdateView) {
                that.data.chatItems.forEach(item => {
                    if ('voice' === item.type) {
                        item.isPlaying = false
                    }
                });
                that.setData({
                    chatItems: that.data.chatItems,
                    isVoicePlaying: false
                })
            }
        }
    }

    /**
     * 停止播放 兼容低版本语音播放
     * @private
     */
    _stopVoice() {
        this.innerAudioContext.stop();
    }

    async _playVoice({ dataset }) {
        console.log('to play', dataset);
        let data = this._page.data;
        if (dataset.voicePath === data.latestPlayVoicePath && data.chatItems[dataset.index].isPlaying) {
            this.stopAllVoicePlay();
        } else {
            this._startPlayVoice(dataset);
            let filePath = dataset.voicePath;//优先读取本地路径，可能不存在此文件

            try {
                await this._myPlayVoice({ filePath });
                console.log('成功读取了本地语音');
            } catch (e) {
                console.log('读取本地语音文件失败，一般情况下是本地没有该文件，需要从服务器下载');
                await downloadFile({ url: filePath });
                await this._myPlayVoice({ filePath });
            }
        }
    }

    async _myPlayVoice({ filePath }) {
        await this.__playVoice({ filePath });
        this.stopAllVoicePlay();
    }

    /**
     * 播放语音 兼容低版本语音播放
     * @param filePath
     * @private
     */
    __playVoice({ filePath }) {
        console.log('to play', filePath);
        return new Promise((resolve, reject) => {
            this.innerAudioContext.src = filePath;
            this.innerAudioContext.startTime = 0;
            this.innerAudioContext.play();
            this.innerAudioContext.onEnded(() => {
                console.log('play end');
                this.innerAudioContext.offEnded();
                resolve();
            });
            this.innerAudioContext.onError((error) => {
                console.log('play error', error);
                this.innerAudioContext.offError();
                reject(error);
            });
        });
    }

    _startPlayVoice(dataset) {
        const that = this._page, { latestPlayVoicePath, chatItems } = that.data,
            currentPlayItem = chatItems[dataset.index];//本次要播放的语音消息
        currentPlayItem.isPlaying = true;
        if (latestPlayVoicePath && latestPlayVoicePath !== currentPlayItem.content) {//如果重复点击同一个，则不将该isPlaying置为false
            for (let item of chatItems) {
                if ('voice' === item.type && latestPlayVoicePath === item.content) {
                    item.isPlaying = false;
                    break;
                }
            }
        }

        that.setData({
            chatItems,
            isVoicePlaying: true
        });
        that.data.latestPlayVoicePath = dataset.voicePath;
    }

}
