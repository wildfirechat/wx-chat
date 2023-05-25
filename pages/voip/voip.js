import avenginekitproxy from '../../wfc/av/engine/avenginekitproxy';
import wfc from '../../wfc/client/wfc';

Page({
  data: {
    url: 'https://192.168.2.180:8082/',
  },


  onLoad: function (options) {
    avenginekitproxy.setVoipWebview(this);
    console.log('voip page onload', this.data);

    let authToken = wx.getStorageSync('authToken');
    let shortLinkInfo = wfc.getShortLinkInfo();

    const voipBaseWebUrl = 'https://192.168.2.180:8082';

    let voipWebUrl = `${voipBaseWebUrl}?type=${options.type}&authToken=${authToken}&token=${shortLinkInfo.token}&clientId=${shortLinkInfo.clientId}&server=${encodeURIComponent(shortLinkInfo.server)}`;

    console.log('start voip page', shortLinkInfo,  voipWebUrl);
    this.setData({url: voipWebUrl});

  },

  onUnload: function () {
    avenginekitproxy.setVoipWebview(null);

  }

})