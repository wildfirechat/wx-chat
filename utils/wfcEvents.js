import wfc from "../wfc/client/wfc";

/**
 * 给页面/组件注册 wfc 事件，并保证 this 指向页面，且单个监听异常不会影响其他监听。
 * @param target 页面或组件实例
 * @param map {[EventType]: 方法名 | function}
 */
export function bindWfcEvents(target, map) {
    unbindWfcEvents(target);
    target.__wfcListeners = [];
    Object.keys(map).forEach(event => {
        const handler = typeof map[event] === 'function' ? map[event] : target[map[event]];
        if (typeof handler !== 'function') {
            console.warn('bindWfcEvents, handler not found', event, map[event]);
            return;
        }
        const fn = (...args) => {
            try {
                handler.apply(target, args);
            } catch (e) {
                console.error('wfc event handler error', event, e);
            }
        };
        wfc.eventEmitter.on(event, fn);
        target.__wfcListeners.push([event, fn]);
    });
}

export function unbindWfcEvents(target) {
    (target.__wfcListeners || []).forEach(([event, fn]) => {
        wfc.eventEmitter.removeListener(event, fn);
    });
    target.__wfcListeners = [];
}
