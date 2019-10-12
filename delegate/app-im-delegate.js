import wfc from "../wfc-bundle/client/wfc";

export default class AppIMDelegate {

    //  wfc = new WfcManager();

    constructor(app) {
        this._app = app;
    }

    onLaunch(options) {
        // this.iIMHandler = getIMHandlerFactory;
      // remote
      // this.wfc.connect('http://pc.wildfirechat.cn', "uiuJuJcc", "cf760da4605865a51569402605040", "iNkRQm66ZRdhbsoMNHyG+3Hyx8ss7fnDH5XIWWlJA7qIHZslFPhE2b2s5X0wZ/wEuxLVBbtZ3U7JUU7o9CuNj2OmHAcYm0eG3jFZB+kf3VwkLPvos/jWa9Brasw8FAQoact/jkzFp/qFJq9Ml/eWiVDMZLaLoomYQBqP6h42ShU=");

      // local
        // wfc.connect('appId', 'appKey', 'http://pc.wildfirechat.cn',80, 'UhVCUCTT', 'cf760da4605865a51569402605040', 'UyT0K1uNKaCLE2Yle/ICRFUrnDlUhHWkgndmeNmtSjaswMIvWgi6FFAR3XNozBi9y3yH2zk/3yCk5Q9e8UfkWHP5tuXxodUs5uQdK3CgpcaapEICzX+Wulsb6lXgOEIAGnzKRBdQTbFouZ7SSCsrAz+QmXk+jgD3mF9MnQkvVhg=');

        console.log('app-im-delegate onLaunch, wfc connect', wfc);
    }

    onShow(options) {

      // this.wfc.connect('http://pc.wildfirechat.cn', "userId", "clientId", "token");
        // this.iIMHandler.createConnection({options: {url: 'ws://wildfirechat.cn:8083'}});
        // this.wfc.connect("wx://pc.wildfirechat.cn", 'GNMtGtZZ', 'dGx2nKj1jrLdHUt8B7Uwm19v/C0BJbR1tXySfG0Nf7mjpQVZX5Dk2d07UObJxNAzmTs6vVTsVsWMI3TIiCUd6SUKXNjdZHTT6N5NpIrSSKhVc9c60bJxAbmLCIRPVp');
    }

    onHide() {

    }

    getIMHandlerDelegate() {
      return wfc;
    }
}
