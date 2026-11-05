import Config from "../../../config";

/**
 * 语音消息播放
 * 同一时间只播放一条语音，通过 onStateChange(playingKey) 通知页面刷新播放状态
 */
export default class VoiceManager {
    playingKey = null;

    constructor(onStateChange) {
        this.onStateChange = onStateChange;
        this.innerAudioContext = wx.createInnerAudioContext();
        // 不监听 onStop：切换播放时，旧语音的 onStop 是异步回调，会误把新语音的播放状态清除，停止状态在 stop() 中同步处理
        this.innerAudioContext.onEnded(() => this._onStopped());
        this.innerAudioContext.onError((error) => {
            console.log('play voice error', error);
            if (this.playingKey) {
                wx.showToast({title: '语音播放失败', icon: 'none'});
            }
            this._onStopped();
        });
    }

    /**
     * 小程序不能播放 amr 格式的音频，需要服务端转成 mp3
     */
    static playableUrl(url) {
        if (!url) {
            return url;
        }
        if (url.indexOf('.mp3') === -1 && url.indexOf(Config.AMR_TO_MP3_SERVER_ADDRESS) === -1 && url.startsWith('http')) {
            return Config.AMR_TO_MP3_SERVER_ADDRESS + url;
        }
        return url;
    }

    /**
     * 播放或停止播放
     */
    toggle(key, url) {
        if (this.playingKey === key) {
            this.stop();
            return;
        }
        this.play(key, url);
    }

    play(key, url) {
        if (this.playingKey) {
            this.innerAudioContext.stop();
        }
        this.playingKey = key;
        this.innerAudioContext.src = VoiceManager.playableUrl(url);
        this.innerAudioContext.startTime = 0;
        this.innerAudioContext.play();
        this.onStateChange && this.onStateChange(this.playingKey);
    }

    stop() {
        if (this.playingKey) {
            this.innerAudioContext.stop();
            this._onStopped();
        }
    }

    // 兼容旧接口
    stopAllVoicePlay() {
        this.stop();
    }

    destroy() {
        this.onStateChange = null;
        this.playingKey = null;
        try {
            this.innerAudioContext.stop();
            this.innerAudioContext.destroy();
        } catch (e) {
            // ignore
        }
    }

    _onStopped() {
        if (this.playingKey === null) {
            return;
        }
        this.playingKey = null;
        this.onStateChange && this.onStateChange(null);
    }
}
