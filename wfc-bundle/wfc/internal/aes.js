var CryptoJS = require("crypto-js");

var AES_KEY = [0x00, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x78, 0x79, 0x7A, 0x7B, 0x7C, 0x7D, 0x7E, 0x7F];

/**
 * 
 * @param {string | Int8Array} msg 
 * @param {string} userKey 
 * @returns {string} encrypted msg in base64 format
 */
function AESEncrypt(msg, userKey = '') {
    var key = AES_KEY;
    if (userKey.length > 0) {
        key = convertUserKey(userKey);
    }

    var curhour = parseInt(((new Date().getTime() / 1000 - 1514736000) / 3600));
    var msgWithTimeBytes = new Array();
    msgWithTimeBytes.push(curhour & 0XFF); // 会为负
    msgWithTimeBytes.push(((curhour & 0XFF00) >> 8));
    msgWithTimeBytes.push(((curhour & 0XFF0000) >> 16));
    msgWithTimeBytes.push((curhour >> 24));

    if (typeof msg === 'string') {
        msgWithTimeBytes.push(...stringToBytes(msg));
    } else {
        msgWithTimeBytes.push(...msg);
    }

    var msgWithTimeHexStr = bytes2HexString(msgWithTimeBytes);

    var key = CryptoJS.enc.Utf8.parse(Uint8ToStr(key));
    var e = CryptoJS.AES.encrypt(CryptoJS.enc.Hex.parse(msgWithTimeHexStr), key, { iv: key, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 })
    var eb = e.toString()
    return eb;
}

/**
 * 
 * @param {string} msg crypted msg in base64 format
 * @param {string} key 
 * @param {boolean} checkTime 
 * 
 * @returns decrypted byte array
 */
function AESDecrypt(msg, key, checkTime) {
    var aesKey = AES_KEY;
    if (key.length > 0) {
        aesKey = convertUserKey(key);
    }
    var key = CryptoJS.enc.Utf8.parse(Uint8ToStr(aesKey))
    var value = CryptoJS.AES.decrypt(msg, key, { iv: key, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
    var ciphertext = value.toString();
    var cipherBytes = hexstring2btye(ciphertext)
    if (cipherBytes.length > 4) {
        var hours = 0;
        hours += cipherBytes[3] && 0xFF;
        hours <<= 8;
        hours += cipherBytes[2] && 0xFF;
        hours <<= 8;
        hours += cipherBytes[1] && 0xFF;
        hours <<= 8;
        hours += cipherBytes[0] && 0xFF;
        hours <<= 8;

        var curhour = ((new Date().getUTCMilliseconds() / 1000 - 1514736000) / 3600);

        if (curhour - hours > 24 && checkTime) {
            return null;
        } else {
            return cipherBytes.slice(4, cipherBytes.length);
        }
    }

    return null;
}

function Uint8ToStr(arr) {
    for (var i = 0, str = ''; i < arr.length; i++)
        str += String.fromCharCode(arr[i]);
    return str;
}

function convertUserKey(str) {
    var arr = [];
    for (var i = 0; i < str.length && i < 16; i++) {
        arr.push(str.charCodeAt(i));
    }
    return new Uint8Array(arr);
}

function StrToUint8(str) {
    for (var i = 0, arr = []; i < str.length; i++) {
        arr.push(str.charCodeAt(i));
    }
    return new Uint8Array(arr);
}

function hexstring2btye(str) {
    let pos = 0;
    let len = str.length;
    if (len % 2 != 0) {
        return null;
    }
    len /= 2;
    let hexA = new Array();
    for (let i = 0; i < len; i++) {
        let s = str.substr(pos, 2);
        let v = parseInt(s, 16);
        hexA.push(v);
        pos += 2;
    }
    return hexA;
}


function stringToBytes(str) {
    var bytes = new Array();
    var len, c;
    len = str.length;
    for (var i = 0; i < len; i++) {
        c = str.charCodeAt(i);
        if (c >= 0x010000 && c <= 0x10FFFF) {
            bytes.push(((c >> 18) & 0x07) | 0xF0);
            bytes.push(((c >> 12) & 0x3F) | 0x80);
            bytes.push(((c >> 6) & 0x3F) | 0x80);
            bytes.push((c & 0x3F) | 0x80);
        } else if (c >= 0x000800 && c <= 0x00FFFF) {
            bytes.push(((c >> 12) & 0x0F) | 0xE0);
            bytes.push(((c >> 6) & 0x3F) | 0x80);
            bytes.push((c & 0x3F) | 0x80);
        } else if (c >= 0x000080 && c <= 0x0007FF) {
            bytes.push(((c >> 6) & 0x1F) | 0xC0);
            bytes.push((c & 0x3F) | 0x80);
        } else {
            bytes.push(c & 0xFF);
        }
    }
    return bytes;
}

function bytes2HexString(arrBytes) {
    var str = "";
    for (var i = 0; i < arrBytes.length; i++) {
        var tmp;
        var num = arrBytes[i];
        if (num < 0) {
            //此处填坑，当byte因为符合位导致数值为负时候，需要对数据进行处理
            tmp = (255 + num + 1).toString(16);
        } else {
            tmp = num.toString(16);
        }
        if (tmp.length == 1) {
            tmp = "0" + tmp;
        }
        str += tmp;
    }
    return str;
}

module.exports.AESEncrypt = AESEncrypt
module.exports.AESDecrypt = AESDecrypt
module.exports.Uint8ToStr = Uint8ToStr