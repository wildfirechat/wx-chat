import avenginekitproxy from '../../wfc/av/engine/avenginekitproxy';
import Conversation from '../../wfc/model/conversation';

var internal  = 0;
Page({
  data: {
    url: 'https://192.168.2.180:8082/',
  },


  onLoad: function (options) {
    avenginekitproxy.setVoipWebview(this);
    console.log('voip page onload', this.data);

    let authToken = wx.getStorageSync('authToken')
    // let authToken = 'authToken'

    const voipBaseWebUrl = 'https://192.168.2.180:8082';

    let voipWebUrl = `${voipBaseWebUrl}?type=${options.type}&authToken=${authToken}`;
    this.setData({url: voipWebUrl});

    setInterval(() => {
      console.log('voip interval');
    }, 5000);
  },

  onUnload: function () {
    clearInterval(internal)
    avenginekitproxy.setVoipWebview(null);

  }

})