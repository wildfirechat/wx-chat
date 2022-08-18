import {numberValue} from '../wfc/util/longUtil'
let now = new Date();
let year = now.getFullYear();
let month = now.getMonth();//真实的月份需要再加上1
let day = now.getDate();
let currentTime = new Date();

function dealChatTime(currentItemTimeStamp, frontItemTimeStamp) {
    let ifShowTime = timeDivide(currentItemTimeStamp, frontItemTimeStamp);
    return justSimpleDealTime(currentItemTimeStamp, ifShowTime);
}

function timeDivide(currentItemTimeStamp, frontItemTimeStamp) {
    // console.log('时间戳显示时间', currentItemTimeStamp, frontItemTimeStamp);
    return Math.abs(currentItemTimeStamp - frontItemTimeStamp) / 1000 > 300
}

function justSimpleDealTime(currentItemTimeStamp, ifShowTime) {
    currentTime.setTime(currentItemTimeStamp);
    let hoursAndMinutes = currentTime.getHours() + ':' + (currentTime.getMinutes() >= 10 ? currentTime.getMinutes() : ('0' + currentTime.getMinutes()));
    let currentTimeDay = currentTime.getDate();
    if (currentTime.getFullYear() === year && currentTime.getMonth() === month) {
        if (currentTimeDay === day) {//当天显示时分
            return {//5分钟内发送多条消息时不重复显示时间标签,大于5分钟显示时间标签
                ifShowTime: ifShowTime,
                timeStr: hoursAndMinutes
            };
        } else if (currentTimeDay === day - 1) {//昨天：昨天+时分（24小时制）
            return {ifShowTime: ifShowTime, timeStr: '昨天 ' + hoursAndMinutes}
        }
    }
    return {
        ifShowTime: ifShowTime,
        timeStr: currentTime.getFullYear() + '年' + (currentTime.getMonth() + 1) + '月' + currentTimeDay + '日 ' + hoursAndMinutes
    };
}

    /**
     * 消息会话时间显示
     */
    function timeFormat (date) {
        if (!date) return ''
        if((typeof date) === 'object'){
            date = numberValue(date);
        }
        let newtime;
        let nowtime = new Date()
        // if (date.constructor !== Date) {
        //     date = new Date(date.replace(/\-/g, '/')) // 解决ios日期显示NAN问题
        //  }
        date = new Date(date)
        // 获取消息发送时间
        let Y = date.getFullYear()
        let M = date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1
        let D = date.getDate() < 10 ? '0' + date.getDate() : date.getDate()
        let W = date.getDay()
        let H = date.getHours() < 10 ? '0' + date.getHours() : date.getHours()
        let Min = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()
        // 获取当前时间
        let nowY = nowtime.getFullYear()
        let nowM = nowtime.getMonth() + 1 < 10 ? '0' + (nowtime.getMonth() + 1) : nowtime.getMonth() + 1
        let nowD = nowtime.getDate() < 10 ? '0' + nowtime.getDate() : nowtime.getDate()
        let isWeek = Math.abs(date - nowtime) < 7 * 24 * 3600 * 1000
        if (Y < nowY) {
            // 去年
            newtime = Y + '-' + M + '-' + D + ' ' + H + ':' + Min
        } else {
            if (Y === nowY && M === nowM && (nowD - D <= 7)) {
                // 昨天
                if ((nowD - D) === 1) {
                    newtime = '昨天' + ' ' + H + ':' + Min
                } else if (nowD === D) {
                    // 当天
                    newtime = H + ':' + Min
                } else {
                    // 一周内
                    newtime = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六','星期天'][W-1] + ' ' + H + ':' + Min
                }
            } else {
                // 一年内
                newtime = M + '-' + D + ' ' + H + ':' + Min
            }
        }
        return newtime
    }

module.exports = {
    dealChatTime,
    timeFormat
    
};