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
    let clientId = 'cid123456aaa788'
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
            wfc.connect('wx_12345678', '4cdd21c01fe004ce5858da81089986d772e64586', 'http://pc.wildfirechat.cn',80, userId, clientId, token);
            wx.switchTab({
              url: '../chat-list/chat-list', fail: (e) => {
                console.log(e)
              }
            })
          }else{
            console.log('login failed', loginResult);
          }
        }
      }
    })
  }

})