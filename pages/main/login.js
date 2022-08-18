Page({
    data: {},

    onLoad: function () {},


    bindStartIMTap: function (e) {
        console.log(this.data.phone)
        // console.log(this.data.code)
      wx.redirectTo({
        url: '/im/pages/login/login', fail: (e) => {
          console.log(e)
        }
      })
    },

})