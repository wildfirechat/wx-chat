/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */

import MessageContentType from './messageContentType';
import TextMessageContent from './textMessageContent';


export default class PTextMessageContent extends TextMessageContent {

    constructor(content, mentionedType = 0, mentionedTargets = []) {
        super(content, mentionedType, mentionedTargets);
        this.type = MessageContentType.P_Text;
    }

}
