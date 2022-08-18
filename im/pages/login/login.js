import wfc from "../../wfc/client/wfc";
import Config from '../../config'

Page({
  data: {
    focus: false,
    phone: '',
    code: ''
  },

  onLoad: function () {
    let userId = wx.getStorageSync('userId')
    let token = wx.getStorageSync('token')
    if(userId && token){
      wfc.connect(userId, token);
      wx.redirectTo({
        url: '../chat-list/chat-list', fail: (e) => {
          console.log(e)
        }
      })
    }
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

  bindLoginTap: function (e) {
    console.log(this.data.phone)
    // console.log(this.data.code)
    this.login(this.data.phone, this.data.code)
  },

  login(phone, code) {
    let appServer = Config.APP_SERVER + '/login'
    let clientId = wfc.getClientId('wx')
    wx.request({
      url: appServer,
      data: {
        mobile: phone,
        code: code,
        clientId: clientId,
        platform:6,
      },
      header: {
        'content-type': 'application/json', // 默认值
      },
      method: 'POST',
      success(res) {
        console.log(res.data)
        if (res.statusCode === 200) {
          let loginResult = res.data;
          if (loginResult.code === 0) {
            let userId = loginResult.result.userId;
            let token = loginResult.result.token;
            wfc.connect(userId, token, 'wx');
            wx.setStorage({
              key:"userId",
              data:userId
            })
            wx.setStorage({
              key:"token",
              data:token
            })
            wx.switchTab({
              url: '../chat-list/chat-list', fail: (e) => {
                console.log(e)
              }
            })
          } else {
            console.log('login failed', loginResult);
          }
        }
      }
    })
  },

  bindAuthCodeTap: function (e) {
    console.log(this.data.phone)
    this.authCode(this.data.phone)
  },

  authCode(phone) {
    let appServer = Config.APP_SERVER + '/send_code'
    wx.request({
      url: appServer,
      data: {
        mobile: phone
      },
      header: {
        'content-type': 'application/json', // 默认值
      },
      method: 'POST',
      success(res) {
        console.log(res.data)
        if (res.statusCode === 200) {
          console.log('发送验证码成功');
        }
      }
    })

  }

})