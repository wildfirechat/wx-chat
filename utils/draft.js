import wfc from "../wfc/client/wfc";
import QuoteInfo from "../wfc/model/quoteInfo";
import Mention from "../wfc/model/mention";
import {_patchToJavaLong, _reverseToJsLongString, stringValue} from "../wfc/util/longUtil";

/**
 * 会话草稿，格式和 web/pc 端保持一致，以便多端同步
 * {content: string, mentions: [Mention], quoteInfo: QuoteInfo}
 */
export default class Draft {

    /**
     * @param conversation
     * @param {string} text
     * @param {QuoteInfo} quoteInfo
     * @param {[string]} mentionUserIds 被 @ 的用户 id，'All' 表示所有人
     */
    static setConversationDraft(conversation, text, quoteInfo, mentionUserIds = []) {
        if (!text && !quoteInfo) {
            wfc.setConversationDraft(conversation, '');
            return;
        }
        let mentions = [];
        (mentionUserIds || []).forEach(uid => {
            let key = uid === 'All' ? '所有人' : wfc.getGroupMemberDisplayName(conversation.target, uid);
            let start = text.indexOf('@' + key);
            if (start > -1) {
                let isAll = uid === 'All';
                mentions.push(new Mention(start, start + 1 + key.length, isAll ? conversation.target : uid, isAll));
            }
        });
        let obj = {
            content: text,
            mentions: mentions,
            quoteInfo: quoteInfo,
        };
        let jsonStr = JSON.stringify(obj, (key, value) => {
            if (key === 'messageUid') {
                return value ? stringValue(value) : value;
            }
            return value;
        });
        jsonStr = _patchToJavaLong(jsonStr, 'messageUid');
        wfc.setConversationDraft(conversation, jsonStr);
    }

    /**
     * @return {{text: string, quoteInfo: QuoteInfo|null, mentionUserIds: [string]}}
     */
    static getConversationDraft(conversation) {
        let result = {text: '', quoteInfo: null, mentionUserIds: []};
        let conversationInfo = wfc.getConversationInfo(conversation);
        if (!conversationInfo || !conversationInfo.draft) {
            return result;
        }
        let draftStr = conversationInfo.draft;
        if (!draftStr.startsWith('{')) {
            result.text = draftStr;
            return result;
        }
        try {
            draftStr = _reverseToJsLongString(draftStr, 'messageUid');
            let draft = JSON.parse(draftStr);
            result.text = draft.content || '';
            if (draft.quoteInfo) {
                let quoteInfo = new QuoteInfo();
                quoteInfo.decode(draft.quoteInfo);
                result.quoteInfo = quoteInfo;
            }
            if (draft.mentions) {
                result.mentionUserIds = draft.mentions.map(m => m.isMentionAll ? 'All' : m.uid);
            }
        } catch (e) {
            console.log('parse draft error', e);
            result.text = conversationInfo.draft;
        }
        return result;
    }

    /**
     * 会话列表中显示的草稿内容
     */
    static getDraftDigest(conversationInfo) {
        if (!conversationInfo || !conversationInfo.draft) {
            return '';
        }
        let draft = conversationInfo.draft;
        if (!draft.startsWith('{')) {
            return draft;
        }
        try {
            let obj = JSON.parse(_reverseToJsLongString(draft, 'messageUid'));
            return obj.content || (obj.quoteInfo ? '[引用]' : '');
        } catch (e) {
            return draft;
        }
    }
}
