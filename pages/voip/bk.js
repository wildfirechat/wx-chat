import avenginekitproxy from '../../wfc/av/engine/avenginekitproxy';
import Conversation from '../../wfc/model/conversation';

var internal  = 0;
Page({
  data: {
    url: '',
  },

  onLoad: function () {
   setTimeout(() => {
    let conversation = new Conversation(0, 'GNMtGtZZ', 0);
    console.log('startcall');
    avenginekitproxy.startCall(conversation, false, [], '');
   }, 2000);
  },

  onUnload: function () {
    clearInterval(internal)
  }


})