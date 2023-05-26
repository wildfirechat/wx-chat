import avenginekitproxy from '../../wfc/av/engine/avenginekitproxy';
import wfc from '../../wfc/client/wfc';

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
    // const voipBaseWebUrl = 'https://192.168.2.180:8080';

    // 多人版音视频
    // const voipBaseWebUrl = 'https://static.wildfirechat.cn/voip-multi-1685070010.html';
    // 高级版音视频
    const voipBaseWebUrl = 'https://static.wildfirechat.cn/voip-conference-1685069872.html';

    let token = shortLinkInfo.token;
    token = token.replaceAll('+', '.').replaceAll('/', '_').replaceAll('=', '-')
    let voipWebUrl = `${voipBaseWebUrl}?type=${options.type}&authToken=${authToken}&token=${token}&clientId=${shortLinkInfo.clientId}&server=${encodeURIComponent(shortLinkInfo.server)}&debug=false`;

    console.log('start voip page', shortLinkInfo,  voipWebUrl);
    this.setData({url: voipWebUrl});

  },

  onUnload: function () {
    avenginekitproxy.setVoipWebview(null);

  }

})