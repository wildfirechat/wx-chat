import wfc from "../wfc/client/wfc";

/**
 * 媒体相关的通用方法
 */

const THUMBNAIL_MAX_SIDE = 200;
// 缩略图会放到消息里面，不能过大
const THUMBNAIL_MAX_BASE64_LENGTH = 40 * 1024;

function compressToBase64(path, width, height) {
    return new Promise(resolve => {
        let options = {
            src: path,
            quality: 30,
        };
        if (width && height && height > width) {
            options.compressedHeight = Math.min(THUMBNAIL_MAX_SIDE, height);
        } else {
            options.compressedWidth = Math.min(THUMBNAIL_MAX_SIDE, width || THUMBNAIL_MAX_SIDE);
        }
        wx.compressImage({
            ...options,
            success: res => {
                try {
                    let base64 = wx.getFileSystemManager().readFileSync(res.tempFilePath, 'base64');
                    resolve(base64 && base64.length < THUMBNAIL_MAX_BASE64_LENGTH ? base64 : '');
                } catch (e) {
                    resolve('');
                }
            },
            fail: () => resolve('')
        });
    });
}

/**
 * 利用页面中的 canvas 生成缩略图，作为 wx.compressImage 不支持指定尺寸时的兜底方案
 * 页面中需要有 <canvas canvas-id="{canvasId}"/>
 */
function canvasToBase64(page, canvasId, path, width, height) {
    return new Promise(resolve => {
        if (!page || !width || !height) {
            resolve('');
            return;
        }
        let ratio = Math.max(width, height) / THUMBNAIL_MAX_SIDE;
        ratio = ratio > 1 ? ratio : 1;
        let canvasWidth = Math.trunc(width / ratio);
        let canvasHeight = Math.trunc(height / ratio);
        let ctx = wx.createCanvasContext(canvasId, page);
        ctx.drawImage(path, 0, 0, canvasWidth, canvasHeight);
        ctx.draw(false, () => {
            wx.canvasToTempFilePath({
                canvasId,
                width: canvasWidth,
                height: canvasHeight,
                destWidth: canvasWidth,
                destHeight: canvasHeight,
                fileType: 'jpg',
                quality: 0.5,
                success: res => {
                    try {
                        resolve(wx.getFileSystemManager().readFileSync(res.tempFilePath, 'base64'));
                    } catch (e) {
                        resolve('');
                    }
                },
                fail: () => resolve('')
            }, page);
        });
    });
}

/**
 * 生成 base64 格式的缩略图
 * @return {Promise<string>} 失败时返回空字符串
 */
export async function makeThumbnail(path, width, height, page, canvasId = 'canvas') {
    let base64 = await compressToBase64(path, width, height);
    if (!base64 && page) {
        base64 = await canvasToBase64(page, canvasId, path, width, height);
    }
    return base64;
}

export function getImageInfo(path) {
    return new Promise(resolve => {
        wx.getImageInfo({
            src: path,
            success: res => resolve(res),
            fail: () => resolve(null)
        });
    });
}

/**
 * 上传文件，返回远程地址
 * 说明：sdk 在支持大文件上传和不支持大文件上传时，回调参数的顺序不一致，这儿根据参数类型进行区分
 * @return {Promise<string>}
 */
export function uploadFile(fileName, filePath, mediaType) {
    return new Promise((resolve, reject) => {
        let done = false;
        let cb = (a, b) => {
            if (done) {
                return;
            }
            if (typeof a === 'string') {
                done = true;
                resolve(a);
            } else if (b === undefined) {
                // 失败回调，只有一个错误码参数
                done = true;
                reject(a);
            }
            // 其他情况为进度回调
        };
        wfc.uploadMedia(fileName, filePath, mediaType, cb, cb, cb);
    });
}

export function downloadFile(url) {
    return new Promise((resolve, reject) => {
        wx.downloadFile({
            url,
            success: res => {
                if (res.statusCode === 200) {
                    resolve(res.tempFilePath);
                } else {
                    reject(new Error('download failed, status code: ' + res.statusCode));
                }
            },
            fail: reject
        });
    });
}

const fileExistCache = new Map();

/**
 * 判断本地文件是否存在，结果会缓存
 */
export function isLocalFileExist(path) {
    if (!path || path.startsWith('https://')) {
        return false;
    }
    if (fileExistCache.has(path)) {
        return fileExistCache.get(path);
    }
    let exist = false;
    try {
        wx.getFileSystemManager().accessSync(path);
        exist = true;
    } catch (e) {
        exist = false;
    }
    fileExistCache.set(path, exist);
    return exist;
}

/**
 * 媒体消息的显示地址，优先使用本地文件
 */
export function mediaUrl(mediaMessageContent) {
    if (!mediaMessageContent) {
        return '';
    }
    let {localPath, remotePath} = mediaMessageContent;
    if (localPath && (!remotePath || isLocalFileExist(localPath))) {
        return localPath;
    }
    return remotePath || '';
}

const DOCUMENT_TYPES = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'pdf'];

/**
 * 打开文件，支持 doc/xls/ppt/pdf 等格式
 */
export async function openDocument(url, fileName) {
    let ext = (fileName || url || '').split('?')[0];
    ext = ext.substring(ext.lastIndexOf('.') + 1).toLowerCase();
    if (DOCUMENT_TYPES.indexOf(ext) === -1) {
        return Promise.reject(new Error('unsupported'));
    }
    wx.showLoading({title: '正在打开', mask: true});
    try {
        let filePath = isLocalFileExist(url) ? url : await downloadFile(url);
        await new Promise((resolve, reject) => {
            wx.openDocument({
                filePath,
                fileType: ext,
                showMenu: true,
                success: resolve,
                fail: reject
            });
        });
    } finally {
        wx.hideLoading();
    }
}

function authorizeWritePhotosAlbum() {
    return new Promise((resolve, reject) => {
        wx.getSetting({
            success: res => {
                if (res.authSetting['scope.writePhotosAlbum'] === false) {
                    wx.showModal({
                        title: '提示',
                        content: '需要授权保存到相册',
                        confirmText: '去设置',
                        success: r => {
                            if (r.confirm) {
                                wx.openSetting();
                            }
                            reject(new Error('unauthorized'));
                        }
                    });
                } else {
                    resolve();
                }
            },
            fail: () => resolve()
        });
    });
}

/**
 * 保存图片或视频到相册
 * @param url
 * @param {'image' | 'video'} type
 */
export async function saveToPhotosAlbum(url, type) {
    await authorizeWritePhotosAlbum();
    wx.showLoading({title: '正在保存', mask: true});
    try {
        let filePath = isLocalFileExist(url) ? url : await downloadFile(url);
        await new Promise((resolve, reject) => {
            let api = type === 'video' ? wx.saveVideoToPhotosAlbum : wx.saveImageToPhotosAlbum;
            api({filePath, success: resolve, fail: reject});
        });
        wx.hideLoading();
        wx.showToast({title: '已保存到相册', icon: 'success'});
    } catch (e) {
        wx.hideLoading();
        console.log('saveToPhotosAlbum error', e);
        if (!e || !e.errMsg || e.errMsg.indexOf('cancel') === -1) {
            wx.showToast({title: '保存失败', icon: 'none'});
        }
    }
}
