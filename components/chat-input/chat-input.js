const MIN_VOICE_TIME = 1, MAX_VOICE_TIME = 60, START_TIME_DOWN = 54, status = {
    START: 1,
    SUCCESS: 2,
    CANCEL: 3,
    SHORT: 4,
    FAIL: 5,
    UNAUTH: 6
}, EVENT = {
    EXTRA_CLICK: 'extraClickEvent',
    EXTRA_ITEM_CLICK: 'extraItemClickEvent',
    VOICE_RECORD: 'voiceRecordEvent',
    SEND_MESSAGE: 'sendMessageEvent',
    MENTION: 'mentionEvent',
    // 输入内容变化，detail: {value}
    TEXT_CHANGE: 'textChangeEvent',
    // 键盘高度变化，detail: {height}
    KEYBOARD_HEIGHT_CHANGE: 'keyboardHeightChangeEvent',
};
Component({
    properties: {
        minVoiceTime: {
            type: Number,
            value: MIN_VOICE_TIME
        },
        maxVoiceTime: {
            type: Number,
            value: MAX_VOICE_TIME
        },
        startTimeDown: {
            type: Number,
            value: START_TIME_DOWN,
        },
        tabBarHeight: {
            type: Number,
            value: 0
        },
        format: {
            type: String,
            value: 'mp3'
        },
        extraArray: {
            type: Array,
            value: []
        },
        placeholder: {
            type: String,
            value: ''
        },
        // 禁言等情况下，不允许输入
        disabled: {
            type: Boolean,
            value: false
        },
        disabledTip: {
            type: String,
            value: ''
        }
    },
    data: {
        windowHeight: 0,
        windowWidth: 0,
        cancelLineYPosition: 0,
        _startTimeDown: START_TIME_DOWN,
        timer: -1,
        singleVoiceTimeCount: 0,
        textMessage: '',
        voiceObj: {moveToCancel: false},
        extraObj: {
            chatInputShowExtra: false,
            chatInputExtraArr: []
        },
        inputStatus: 'text',
        focus: false,
        keyboardHeight: 0,
    },
    observers: {
        'extraArray'(value) {
            this.setData({
                'extraObj.chatInputExtraArr': value || []
            })
        },
        'startTimeDown'(startTimeDown) {
            const data = this.data;
            data._startTimeDown = startTimeDown && startTimeDown < data.maxVoiceTime && startTimeDown > 0 ? startTimeDown : START_TIME_DOWN;
        }
    },
    methods: {
        getRecordStatus() {
            return {...status};
        },
        closeExtraView() {
            if (this.data.extraObj.chatInputShowExtra) {
                this.setData({
                    'extraObj.chatInputShowExtra': false
                });
            }
        },
        /**
         * 设置输入框内容
         */
        setText(text) {
            this.setData({
                textMessage: text || '',
                inputStatus: 'text',
            });
        },
        getText() {
            return this.data.textMessage;
        },
        /**
         * 在输入框末尾追加内容，并弹出键盘
         */
        appendText(text) {
            this.setData({
                textMessage: (this.data.textMessage || '') + text,
                inputStatus: 'text',
            }, () => {
                this.focusInput();
            });
        },
        focusInput() {
            this.setData({focus: false, inputStatus: 'text'}, () => {
                this.setData({focus: true});
            });
        },
        _chatInput$extra$click$event() {
            const isShow = !this.data.extraObj.chatInputShowExtra;
            if (isShow) {
                wx.hideKeyboard();
            }
            this.setData({
                'extraObj.chatInputShowExtra': isShow
            }, () => {
                this.triggerEvent(EVENT.EXTRA_CLICK, {isShow}, {});
            });
        },
        _change$input$way$event() {
            this.setData({
                'inputStatus': this.data.inputStatus === 'text' ? 'voice' : 'text',
                'extraObj.chatInputShowExtra': false
            });
        },
        _triggerVoiceRecordEvent({status, dataset}) {
            this.triggerEvent(EVENT.VOICE_RECORD, {recordStatus: status, ...dataset}, {});
        },
        _long$click$voice$btn(e) {
            if ('send$voice$btn' === e.currentTarget.id) {//长按时需要打开录音功能，开始录音
                this._checkRecordAuth(() => {
                    const {maxVoiceTime, singleVoiceTimeCount} = this.data;
                    this.setData({//调出取消弹窗
                        'voiceObj.showCancelSendVoicePart': true,
                        'voiceObj.timeDownNum': maxVoiceTime - singleVoiceTimeCount,
                        'voiceObj.status': 'start',
                        'voiceObj.startStatus': 1,
                        'voiceObj.moveToCancel': false
                    }, () => {
                        this._triggerVoiceRecordEvent({status: status.START});
                    });
                    this.recorderManager.start({duration: 60000, format: this.data.format, numberOfChannels: 2, sampleRate:8000, encodeBitRate: 16000});
                }, (res) => {
                    //录音失败
                    console.error('录音拒绝授权');
                    clearInterval(this.data.timer);
                    this._endRecord();
                    this.setData({
                        'voiceObj.status': 'end',
                        'voiceObj.showCancelSendVoicePart': false
                    });
                    this._triggerVoiceRecordEvent({status: status.UNAUTH});

                    wx.showModal({
                        title: '您未授权语音功能',
                        content: '暂时不能使用语音',
                        confirmText: '去设置',
                        success: res => {
                            if (res.confirm) {
                                wx.openSetting({
                                    success: res => {
                                        if (res.authSetting['scope.record']) {
                                            this.setData({
                                                'extraObj.chatInputShowExtra': false
                                            });
                                        }
                                    }
                                });
                            } else {
                                this.setData({
                                    'inputStatus': 'text',
                                    'extraObj.chatInputShowExtra': false
                                });
                            }
                        }
                    });
                });
            }
        },
        _dealVoiceLongClickEventWithHighVersion() {
            this.recorderManager.onStart(() => {
                this.data.singleVoiceTimeCount = 0;
                const {_startTimeDown, maxVoiceTime} = this.data;
                //设置定时器计时60秒
                this.data.timer = setInterval(() => {
                    const voiceTimeCount = ++this.data.singleVoiceTimeCount;
                    if (voiceTimeCount >= _startTimeDown && voiceTimeCount < maxVoiceTime) {
                        this.setData({
                            'voiceObj.timeDownNum': maxVoiceTime - voiceTimeCount,
                            'voiceObj.status': 'timeDown'
                        })
                    } else if (voiceTimeCount >= maxVoiceTime) {
                        this.setData({
                            'voiceObj.status': 'timeout'
                        });
                        this._delayDismissCancelView();
                        clearInterval(this.data.timer);
                        this._endRecord();
                    }
                }, 1000);
            })
        },
        _send$voice$move$event(e) {
            if ('send$voice$btn' === e.currentTarget.id) {
                const {windowHeight, voiceObj, tabBarHeight, cancelLineYPosition} = this.data,
                    y = windowHeight + tabBarHeight - e.touches[0].clientY;
                if (y > cancelLineYPosition) {
                    if (!voiceObj.moveToCancel) {
                        this.setData({
                            'voiceObj.moveToCancel': true
                        });
                    }
                } else {
                    if (voiceObj.moveToCancel) {//如果移出了该区域
                        this.setData({
                            'voiceObj.moveToCancel': false
                        })
                    }
                }

            }
        },
        _send$voice$move$end$event(e) {
            if ('send$voice$btn' === e.currentTarget.id) {
                const {singleVoiceTimeCount, minVoiceTime, timer} = this.data;
                if (singleVoiceTimeCount < minVoiceTime) {//语音时间太短
                    this.setData({
                        'voiceObj.status': 'short'
                    });
                    this._delayDismissCancelView();
                } else {//语音时间正常
                    this.setData({
                        'voiceObj.showCancelSendVoicePart': false,
                        'voiceObj.status': 'end'
                    });
                }
                clearInterval(timer);
                this._endRecord();
            }
        },
        _initVoiceData() {
            const {windowWidth, windowHeight} = this.data, width = windowWidth / 2.6;
            this.setData({
                'inputStatus': 'text',
                'windowHeight': windowHeight,
                'windowWidth': windowWidth,
                'voiceObj.status': 'end',
                'voiceObj.startStatus': 0,
                'voiceObj.voicePartWidth': width,
                'voiceObj.moveToCancel': false,
                'voiceObj.voicePartPositionToBottom': (windowHeight - width / 2.4) / 2,
                'voiceObj.voicePartPositionToLeft': (windowWidth - width) / 2
            });
        },
        _delayDismissCancelView() {
            setTimeout(() => {
                if (this.data.voiceObj.status !== 'start') {
                    this.setData({
                        'voiceObj.showCancelSendVoicePart': false,
                        'voiceObj.status': 'end'
                    });
                }
            }, 1000);
        },

        _endRecord() {
            this.setData({
                'voiceObj.startStatus': 0
            }, () => {
                this.recorderManager.stop();
            });
        },
        _chatInput$bind$focus$event() {
            this.closeExtraView();
        },
        _sendText(text) {
            if (!text || !text.trim()) {
                return;
            }
            this.setData({
                textMessage: ''
            }, () => {
                this.triggerEvent(EVENT.SEND_MESSAGE, {value: text});
                this.triggerEvent(EVENT.TEXT_CHANGE, {value: ''});
            });
        },
        // 键盘上的发送按钮
        _chatInput$send$text$message(e) {
            this._sendText(e.detail.value);
        },
        _chatInput$bind$blur$event() {
            this.setData({focus: false});
            this._updateKeyboardHeight(0);
        },
        // 输入框右侧的发送按钮
        _chatInput$send$text$message02() {
            this._sendText(this.data.textMessage);
        },
        _chatInput$getValue$event(e) {
            const {detail: {value: textMessage}} = e;
            const oldText = this.data.textMessage || '';
            this.setData({
                textMessage
            });
            this.triggerEvent(EVENT.TEXT_CHANGE, {value: textMessage});
            // 只有新输入 @ 时，才触发选择 @ 对象
            if (textMessage.length > oldText.length && textMessage.endsWith('@')) {
                this.triggerEvent(EVENT.MENTION);
            }
        },
        _onKeyboardHeightChange(e) {
            this._updateKeyboardHeight(e.detail.height || 0);
        },
        _updateKeyboardHeight(height) {
            if (height === this.data.keyboardHeight) {
                return;
            }
            this.setData({keyboardHeight: height}, () => {
                this.triggerEvent(EVENT.KEYBOARD_HEIGHT_CHANGE, {height});
            });
        },
        _chatInput$extra$item$click$event(e) {
            const {currentTarget: {dataset}} = e;
            this.triggerEvent(EVENT.EXTRA_ITEM_CLICK, {...dataset}, {});
        },

        _setVoiceListener() {
            this.recorderManager.onStop((res) => {
                console.log(res, this.data.voiceObj.status);
                if (this.data.voiceObj.status === 'short') {//录音时间太短或者移动到了取消录音区域， 则取消录音
                    this._triggerVoiceRecordEvent({status: status.SHORT});
                    return;
                } else if (this.data.voiceObj.moveToCancel) {
                    this._triggerVoiceRecordEvent({status: status.CANCEL});
                    return;
                }
                console.log('录音成功');
                this._triggerVoiceRecordEvent({status: status.SUCCESS, dataset: res});
            });
            this.recorderManager.onError((res) => {
                this._triggerVoiceRecordEvent({status: status.FAIL, dataset: res});
            });
        },

        _checkRecordAuth(cbOk, cbError) {
            wx.getSetting({
                success: (res) => {
                    if (!res.authSetting['scope.record']) {
                        wx.authorize({
                            scope: 'scope.record',
                            success: (res) => {
                                // 用户已经同意小程序使用录音功能，后续调用 wx.startRecord 接口不会弹窗询问
                                console.log('同意', res);
                            }, fail: res => {
                                console.log('拒绝', res);
                                cbError && cbError();
                            }
                        })
                    } else {
                        cbOk && cbOk();
                    }
                }
            })
        }
    },
    lifetimes: {
        created() {
            this.recorderManager = wx.getRecorderManager();
            const {windowHeight, windowWidth} = wx.getSystemInfoSync();
            if (!windowHeight || !windowWidth) {
                console.error('没有获取到手机的屏幕尺寸：windowWidth', windowWidth, 'windowHeight', windowHeight);
                return;
            }
            this.data.windowHeight = windowHeight;
            this.data.windowWidth = windowWidth;
            this.data.cancelLineYPosition = windowHeight * 0.12;
            this._dealVoiceLongClickEventWithHighVersion();
            this._setVoiceListener();
        },
        attached() {
            this._initVoiceData();
        },
        detached() {
            clearInterval(this.data.timer);
        }
    }
});
