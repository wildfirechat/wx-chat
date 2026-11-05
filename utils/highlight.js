// 列表中最多显示一两行，截断过长的文本，避免 setData 数据过大
const MAX_TEXT_LENGTH = 100;

function truncate(text, max) {
    return text.length > max ? text.substring(0, max) + '...' : text;
}

/**
 * 将文本按关键字拆分，用于高亮显示
 * @return {{before: string, match: string, after: string}}
 */
export function splitByKeyword(text, keyword, maxBefore = 12) {
    text = (text || '').replace(/\n/g, ' ');
    if (!keyword) {
        return {before: truncate(text, MAX_TEXT_LENGTH), match: '', after: ''};
    }
    let index = text.toLowerCase().indexOf(keyword.toLowerCase());
    if (index === -1) {
        return {before: truncate(text, MAX_TEXT_LENGTH), match: '', after: ''};
    }
    let before = text.substring(0, index);
    if (before.length > maxBefore) {
        before = '...' + before.substring(before.length - maxBefore);
    }
    return {
        before,
        match: text.substring(index, index + keyword.length),
        after: truncate(text.substring(index + keyword.length), MAX_TEXT_LENGTH),
    };
}
