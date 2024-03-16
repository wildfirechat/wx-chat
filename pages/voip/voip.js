import avenginekitproxy from '../../wfc/av/engine/avenginekitproxy';
import wfc from '../../wfc/client/wfc';
import Config from "../../config";
import CallByeMessageContent from "../../wfc/av/messages/callByeMessageContent";
import CallEndReason from "../../wfc/av/engine/callEndReason";

Page({
  data: {
    url: '',
    callId:'',
    conversation: null,
  },


  onLoad: function (options) {
    avenginekitproxy.setVoipWebview(this);
    console.log('voip page onload', this.data);

    let authToken = wx.getStorageSync('authToken');
    let shortLinkInfo = wfc.getShortLinkInfo();

    //
    // 本地调试
    //const voipBaseWebUrl = 'https://voip.wfim.work';
    // 多人版音视频，根据实际情况，进行切换，需要和其他客户端保持一致，才能互通
    // const voipBaseWebUrl = 'https://static.wildfirechat.cn/voip-multi-1710559021.html';
    // 高级版音视频，根据实际情况，进行切换，需要和其他客户端保持一致，才能互通
    const voipBaseWebUrl = 'https://static.wildfirechat.cn/voip-conference-1710558887.html';

    let token = shortLinkInfo.token;
    token = token.replaceAll('+', '.').replaceAll('/', '_').replaceAll('=', '-')

    let voipWebUrl = `${voipBaseWebUrl}`
    voipWebUrl += `?type=${options.type}`
    // app server info
    voipWebUrl += `&appServer=${encodeURIComponent(Config.APP_SERVER)}`;
    voipWebUrl += `&authToken=${authToken}`
    // im server info
    voipWebUrl += `&server=${encodeURIComponent(shortLinkInfo.server)}`;
    voipWebUrl += `&userId=${wfc.getUserId()}`
    voipWebUrl += `&token=${token}`
    voipWebUrl += `&clientId=${shortLinkInfo.clientId}`
    // options
    voipWebUrl += `&options=${options.options}`
    // enable voip debug，打开之后，音视频通话页面不会自动关闭
    voipWebUrl += `&debug=false`;

    let callOptions = JSON.parse(decodeURIComponent(options.options));
    this.setData({
        callId: callOptions.args.callId,
        conversation: callOptions.args.conversation,
    });
    // let sessionId = callOptions.args.sessionId;

    console.log('start voip page',  shortLinkInfo,  voipWebUrl);
    this.setData({url: voipWebUrl});

  },

  onUnload: function () {
    avenginekitproxy.setVoipWebview(null);
    let byeMessage = new CallByeMessageContent();
    // 处理用户没有主动挂断，而是直接返回页面时，补偿一个挂断消息
    // 现在还无法处理会议的情况，会议只能等待超时
    if (this.data.conversation){
        byeMessage.callId = this.data.callId;
        byeMessage.reason = CallEndReason.REASON_Hangup;
        wfc.sendConversationMessage(this.data.conversation, byeMessage);
    }
  }

})