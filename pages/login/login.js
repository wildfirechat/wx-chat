import wfc from "../../wfc-bundle/client/wfc";


Page({
  data: {
    focus: false,
    phone: '',
    code: ''
  },
  bindPhoneInput: function (e) {
    this.setData({
      phone: e.detail.value
    })
  },

  bindCodeInput: function (e) {
    this.setData({
      code: e.detail.value
    })
  },

  bindLoginTap: function(e){
    console.log(this.data.phone)
    // console.log(this.data.code)
    this.login(this.data.phone, this.data.code)
  },

  login(phone, code){

    let appServer = 'http://pc.wildfirechat.cn:8888/login'
    let clientId = 'cf760da4605865a51569402605040'
    wx.request({
      url: appServer,
      data: {
        mobile:phone,
        code:code,
        clientId:clientId
      },
      header: {
        'content-type': 'application/json', // 默认值
      },
      method: 'POST',
      success(res) {
        console.log(res.data)
        if (res.statusCode === 200) {
          let loginResult = res.data;
          if(loginResult.code === 0){
              let userId = loginResult.result.userId;
              let token = loginResult.result.token;
              wfc.connect('appId', 'appKey', 'http://pc.wildfirechat.cn',80, userId, clientId, token);
            wx.switchTab({
              url: '../chat-list/chat-list', fail: (e) => {
                console.log(e)
              }
            })          }else{
            console.log('login failed', loginResult);
          }
        }
      }
    })
  }

})