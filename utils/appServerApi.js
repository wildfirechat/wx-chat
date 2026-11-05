import Config from "../config";
import wfc from "../wfc/client/wfc";
import FavItem from "../wfc/model/favItem";
import {_reverseToJsLongString, stringValue} from "../wfc/util/longUtil";

/**
 * 应用服务(app server)相关接口，和 web 端 appServerApi 保持一致
 * authToken 在登录时保存
 */
function post(path, data = {}, rawResponseData = false) {
    return new Promise((resolve, reject) => {
        wx.request({
            url: Config.APP_SERVER + path,
            method: 'POST',
            data: data,
            // dataType 非 json 时，不会对返回内容做 JSON.parse
            dataType: rawResponseData ? 'text' : 'json',
            responseType: 'text',
            header: {
                'content-type': 'application/json',
                'authToken': wx.getStorageSync('authToken') || '',
            },
            success: res => {
                if (res.statusCode !== 200) {
                    reject(new Error('request error, status code: ' + res.statusCode));
                    return;
                }
                let body = res.data;
                if (rawResponseData) {
                    resolve(body);
                    return;
                }
                if (typeof body === 'string') {
                    try {
                        body = JSON.parse(body);
                    } catch (e) {
                        reject(e);
                        return;
                    }
                }
                if (body && body.code === 0) {
                    resolve(body.result);
                } else {
                    let error = new Error(body ? body.message : 'unknown error');
                    error.code = body ? body.code : -1;
                    reject(error);
                }
            },
            fail: err => reject(err)
        });
    });
}

export default class AppServerApi {

    static getGroupAnnouncement(groupId) {
        return post('/get_group_announcement', {groupId});
    }

    static updateGroupAnnouncement(groupId, text) {
        return post('/put_group_announcement', {
            author: wfc.getUserId(),
            groupId,
            text,
        });
    }

    static favMessage(message) {
        let favItem = FavItem.fromMessage(message);
        return post('/fav/add', {
            messageUid: stringValue(favItem.messageUid),
            type: favItem.favType,
            convType: favItem.conversation.type,
            convTarget: favItem.conversation.target,
            convLine: favItem.conversation.line,
            origin: favItem.origin,
            sender: favItem.sender,
            title: favItem.title,
            url: favItem.url,
            thumbUrl: favItem.thumbUrl,
            data: favItem.data,
        });
    }

    /**
     * @return {Promise<{items: [], hasMore: boolean}>}
     */
    static async getFavList(startId, count = 20) {
        let text = await post('/fav/list', {id: startId, count}, true);
        if (typeof text !== 'string') {
            text = JSON.stringify(text);
        }
        // messageUid 是 64 位整数，避免精度丢失
        text = _reverseToJsLongString(text, 'messageUid');
        let body = JSON.parse(text);
        if (body && body.code === 0) {
            return body.result;
        }
        throw new Error(body ? body.message : 'getFavList error');
    }

    static delFav(favItemId) {
        return post('/fav/del/' + favItemId, {});
    }
}
