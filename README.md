## 野火IM解决方案

野火IM是专业级即时通讯和实时音视频整体解决方案，由北京野火无限网络科技有限公司维护和支持。

主要特性有：私有部署安全可靠，性能强大，功能齐全，全平台支持，开源率高，部署运维简单，二次开发友好，方便与第三方系统对接或者嵌入现有系统中。详细情况请参考[在线文档](https://docs.wildfirechat.cn)。

主要包括一下项目：

| [GitHub仓库地址(主站)](https://github.com/wildfirechat)            | [码云仓库地址(镜像)](https://gitee.com/wfchat)                | 说明                                                             | 备注                      |
|--------------------------------------------------------------|-------------------------------------------------------|----------------------------------------------------------------|-------------------------|
| [im-server](https://github.com/wildfirechat/im-server)       | [server](https://gitee.com/wfchat/im-server)          | IM Server                                                      |                         |
| [android-chat](https://github.com/wildfirechat/android-chat) | [android-chat](https://gitee.com/wfchat/android-chat) | 野火IM Android SDK源码和App源码                                       | 可以很方便地进行二次开发，或集成到现有应用当中 |
| [ios-chat](https://github.com/wildfirechat/ios-chat)         | [ios-chat](https://gitee.com/wfchat/ios-chat)         | 野火IM iOS SDK源码和App源码                                           | 可以很方便地进行二次开发，或集成到现有应用当中 |
| [pc-chat](https://github.com/wildfirechat/vue-pc-chat)       | [pc-chat](https://gitee.com/wfchat/vue-pc-chat)       | 基于[Electron](https://electronjs.org/)开发的PC 端                   |                         |
| [web-chat](https://github.com/wildfirechat/vue-chat)         | [web-chat](https://gitee.com/wfchat/vue-chat)         | 野火IM Web 端, [体验地址](http://web.wildfirechat.cn)                 |                         |
| [wx-chat](https://github.com/wildfirechat/wx-chat)           | [wx-chat](https://gitee.com/wfchat/wx-chat)           | 小程序平台的Demo(支持微信、百度、阿里、字节、QQ 等小程序平台)                            |                         |
| [app server](https://github.com/wildfirechat/app_server)     | [app server](https://gitee.com/wfchat/app_server)     | 应用服务端                                                          |                         |
| [robot_server](https://github.com/wildfirechat/robot_server) | [robot_server](https://gitee.com/wfchat/robot_server) | 机器人服务端                                                         |                         |
| [push_server](https://github.com/wildfirechat/push_server)   | [push_server](https://gitee.com/wfchat/push_server)   | 推送服务器                                                          |                         |
| [docs](https://github.com/wildfirechat/docs)                 | [docs](https://gitee.com/wfchat/docs)                 | 野火IM相关文档，包含设计、概念、开发、使用说明，[在线查看](https://docs.wildfirechat.cn/) |                         |

## 前置说明

1. 本项目所使用的`小程序 SDK`是需要付费的，且依赖于`专业版 IM-Server`，价格请参考[费用详情](https://docs.wildfirechat.cn/price/)
2. `小程序 SDK`和`专业版 IM-Server`都支持试用，具体请参考[试用说明](https://docs.wildfirechat.cn/trial/)
3. 本项目默认只能连接到官方服务，购买或申请试用之后，替换`小程序 SDK`，即可连到自行部署的服务

野火IM小程序SDK目前支持以下小程序平台：

1. wx，微信小程序
2. qq，QQ小程序
3. bd，百度小程序
4. ali，支付宝小程序
5. tt，今日头条小程序

开发者可自行开发其他小程序平台的UI，也可以采用```uni-app```等跨平台技术开发，需要注意的是，**需要保证```wfc```目录和```config.js```处于同级目录下**

## 音视频通话

采用`webview`的方式实现音视频通话，支持普通单人、多人音视频通话，支持音视频会议。音视频通话相关代码，请参考[voip-uni](https://github.com/wildfirechat/voip-uni)

## 开发配置

1. nodejs v18.19.0
2. npm 10.2.3
   ![本地设置](https://static.wildfirechat.cn/local_setting.png)
   ![项目配置](https://static.wildfirechat.cn/project_settings.png)

## 开发

> 一定要根据上面的开发配置进行配置，不然会出现编译不通过等问题。

1. npm install
2. 微信开发者工具 --> 工具 --> 构建 npm
3. 微信开发者工具 --> 工具 --> 编译

### 联系我们

> 商务合作请优先采用邮箱和我们联系。技术问题请到[野火IM论坛](http://bbs.wildfirechat.cn/)发帖交流。

1. heavyrain.lee 邮箱: heavyrain.lee@wildfirechat.cn 微信：wildfirechat
2. imndx 邮箱: imndx@wildfirechat.cn 微信：wfchat

### 问题交流

1. 如果大家发现bug，请在GitHub提issue
2. 其他问题，请到[野火IM论坛](http://bbs.wildfirechat.cn/)进行交流学习
3. 微信公众号

<img src="http://static.wildfirechat.cn/wx_wfc_qrcode.jpg" width = 50% height = 50% />

> 强烈建议关注我们的公众号。我们有新版本发布或者有重大更新会通过公众号通知大家，另外我们也会不定期的发布一些关于野火IM的技术介绍。

### 在线体验

请用微信扫描下方小程序码，进行体验

![野火IM 小程序码](https://static.wildfirechat.cn/qx.jpeg)

## 应用截图

![conversation_list](https://static.wildfirechat.cn/conversation_list.png)
![conversation](https://static.wildfirechat.cn/conversation.png)
![friends](https://static.wildfirechat.cn/friends.png)
![voip-audio](https://static.wildfirechat.cn/voip-audio.jpeg)
![voip-video](https://static.wildfirechat.cn/voip-video.jpeg)

## 贡献

欢迎提交pull request，一起打造一个更好的开源IM。

## 鸣谢

1. [wechat-im](https://github.com/unmagic/wechat-im) 本项目UI和即时通讯部分功能，基于此项开发，感谢作者。作者的项目和博客都特别棒，值得大家去学习。
2. [protoBufferForWechat](https://github.com/Zhang19910325/protoBufferForWechat) 感谢此项目，让在微信小程序中使用protobuf成为了可能。

如果有什么地方侵犯了您的权益，请联系我们删除🙏🙏🙏

## 原始项目README

[wechat-im README](./README-org.md)

## License

1. Under the MIT license. See the [LICENSE](https://github.com/wildfirechat/mars/blob/firechat/LICENSE) file for details.
