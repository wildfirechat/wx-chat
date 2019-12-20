export default class Config {
  // 如果需要支持音视频通话功能，必须全站使用https(包括app server和im server) + wss，
  // WebSockets over SSL/TLS
  static USE_WSS = false;
  // WSS 的默认端口，其实是443
  static WSS_PORT = 8084;

  static STATIC_RESOURCE_PATH = 'https://static.wildfirechat.cn/'
  static APP_SERVER = 'http://wildfirechat.cn:8888';
  // 用于本地打包验证
  // static APP_SERVER = 'http://localhost:8888';
  static QR_CODE_PREFIX_PC_SESSION = "wildfirechat://pcsession/";
  static ICE_ADDRESS = 'turn:turn.wildfirechat.cn:3478';
  static ICE_USERNAME = 'wfchat';
  static ICE_PASSWORD = 'wfchat';

  static WX_APP_ID = 'wx_12345678';
  static WX_APP_KEY = 'e7a9ad28474252f306c682ee78b31558cc0eca30';

  static MESSAGE_ROAMING = 1;
  // 拉取最近2小时的消息
  static MESSAGE_ROAMING_HOUR_COUNT = 2;

  static getWFCPlatform() {
    return 6;
  }
}
