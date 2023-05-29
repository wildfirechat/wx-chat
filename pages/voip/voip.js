import avenginekitproxy from '../../wfc/av/engine/avenginekitproxy';
import wfc from '../../wfc/client/wfc';
import Config from "../../config";

Page({
  data: {
    url: '',
  },


  onLoad: function (options) {
    avenginekitproxy.setVoipWebview(this);
    console.log('voip page onload', this.data);

    let authToken = wx.getStorageSync('authToken');
    let shortLinkInfo = wfc.getShortLinkInfo();

    // 本地调试
    const voipBaseWebUrl = 'https://voip.wfim.work';

    // 多人版音视频
    // const voipBaseWebUrl = 'https://static.wildfirechat.cn/voip-multi-1685347550.html';
    // 高级版音视频
    // const voipBaseWebUrl = 'https://static.wildfirechat.cn/voip-conference-1685347421.html';

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

    console.log('start voip page', shortLinkInfo,  voipWebUrl);
    this.setData({url: voipWebUrl});

  },

  onUnload: function () {
    avenginekitproxy.setVoipWebview(null);

  }

})