export default class Config {
  // 如果需要支持音视频通话功能，必须全站使用https(包括app server和im server) + wss，
  // WebSockets over SSL/TLS
  // 置为true时，请确保 IM SERVER 支持https访问。IM SERVER本身不能处理https请求，一般是通过在IM SERVER前面加上nginx之类的负载均衡器来实现https支持
  static USE_WSS = true;
  // WebSocket连接端口，需要和服务端对应，不能随意修改
  static WS_PORT = 8083;
  // Secure WebSocket连接端口，需要和服务端对应，不能随意修改
  static WSS_PORT = 8084;

  static STATIC_RESOURCE_PATH = 'https://static.wildfirechat.cn/'

  // IM SERVER的HOST，是域名或者ip，没有http等前缀!
  static IM_SERVER_HOST = 'wildfirechat.cn';

  //默认demo应用服务的端口是8888，地址配置为 http://${应用服务器地址}:8888 上线需要切换成https的地址。
  //static APP_SERVER = 'http://wildfirechat.cn:8888';
  static APP_SERVER = 'https://app.wildfirechat.cn';
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

  // 向服务端发送ping的间隔，单位是秒。没有特殊需求，不建议修改
  static KEEP_ALIVE_INTERNAL = 180;

  /**
   * 配合{@link wfc.onForeground}使用，切换到前台时，如果多少时间没有活动，将进行重连，单位是秒
   * 需要大于{@link KEEP_ALIVE_INTERNAL}
   * 没有特殊需求，不建议修改
    */
  static KEEP_ALIVE_TIMEOUT = 200;


  // 小程序不能播放amr格式的音频，需要将amr格式转换为mp3格式
  // 本服务传入amr音频文件的地址，将音频文件转换为mp3格式，并以application/octet-stream的格式返回
  static AMR_TO_MP3_SERVER_ADDRESS = 'https://app.wildfirechat.cn/amr2mp3?path=';

  // 发送消息超时时间，超时之后，认为当前连接已不可用，将进行重连，单位是秒。没有特殊需求不，不建议修改
  static SEND_MESSAGE_TIMEOUT = 20;

  static DEFAULT_USER_PORTRAIT = 'https://static.wildfirechat.cn/avatar_def.png';

  static DEFAULT_GROUP_PORTRAIT = 'https://static.wildfirechat.cn/avatar_def.png';

  static getWFCPlatform() {
    return 6;
  }
}
