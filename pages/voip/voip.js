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

    // 多人版音视频
    const voipBaseWebUrl = 'https://static.wildfirechat.cn/voip-multi-20230525.html';
    // 高级版音视频
    //const voipBaseWebUrl = 'https://static.wildfirechat.cn/voip-multi-20230525.html';

    let voipWebUrl = `${voipBaseWebUrl}?type=${options.type}&authToken=${authToken}&token=${shortLinkInfo.token}&clientId=${shortLinkInfo.clientId}&server=${encodeURIComponent(shortLinkInfo.server)}`;

    console.log('start voip page', shortLinkInfo,  voipWebUrl);
    this.setData({url: voipWebUrl});

  },

  onUnload: function () {
    avenginekitproxy.setVoipWebview(null);

  }

})