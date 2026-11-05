/**
 * 交互相关的通用方法
 */

/**
 * 显示操作菜单，wx.showActionSheet 最多支持 6 项，超出部分折叠到“更多”里
 * @param {[{label: string, action: function}]} items
 */
export function showActionMenu(items) {
    items = (items || []).filter(i => i);
    if (items.length === 0) {
        return;
    }
    let shown = items;
    let rest = [];
    if (items.length > 6) {
        shown = items.slice(0, 5);
        rest = items.slice(5);
        shown.push({label: '更多...', action: () => showActionMenu(rest)});
    }
    wx.showActionSheet({
        itemList: shown.map(i => i.label),
        success(res) {
            const item = shown[res.tapIndex];
            item && item.action && item.action();
        },
        fail() {
            // 用户取消
        }
    });
}

export function confirm(title, content, confirmText = '确定', confirmColor) {
    return new Promise(resolve => {
        let options = {
            title: title || '',
            content: content || '',
            confirmText,
            success: res => resolve(!!res.confirm),
            fail: () => resolve(false),
        };
        if (confirmColor) {
            options.confirmColor = confirmColor;
        }
        wx.showModal(options);
    });
}

/**
 * 输入框
 * @return {Promise<string|null>} 用户取消时返回 null
 */
export function prompt(title, placeholder = '', defaultValue = '') {
    return new Promise(resolve => {
        wx.showModal({
            title,
            editable: true,
            placeholderText: placeholder,
            content: defaultValue,
            success: res => resolve(res.confirm ? (res.content || '').trim() : null),
            fail: () => resolve(null),
        });
    });
}

export function toast(title, icon = 'none') {
    wx.showToast({title, icon, duration: 2000});
}

export function showLoading(title = '请稍候') {
    wx.showLoading({title, mask: true});
}

export function hideLoading() {
    wx.hideLoading();
}

export function formatFileSize(size) {
    size = Number(size) || 0;
    if (size < 1024) {
        return size + 'B';
    } else if (size < 1024 * 1024) {
        return (size / 1024).toFixed(1) + 'KB';
    } else if (size < 1024 * 1024 * 1024) {
        return (size / 1024 / 1024).toFixed(1) + 'MB';
    }
    return (size / 1024 / 1024 / 1024).toFixed(1) + 'GB';
}

export function formatDuration(seconds) {
    seconds = Math.round(Number(seconds) || 0);
    let m = Math.floor(seconds / 60);
    let s = seconds % 60;
    return (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
}
