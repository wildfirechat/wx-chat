/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */

/*
{
    "uid": "uiuJuJcc", 
    "name": "13888888888", 
    "displayName": "imndx", 
    "gender": 0, 
    "portrait": "https://avatars.io/gravatar/uiuJuJcc", 
    "mobile": "13888888888", 
    "email": "", 
    "address": "", 
    "company": "", 
    "social": "", 
    "extra": "", 
    "type": -472579968, 
    "updateDt": 1550652404513
}

*/
export default class UserInfo {
    uid = '';
    name = '';
    displayName = '';
    groupAlias = '';
    friendAlias = '';
    gender = 0;
    portrait = '';
    mobile = '';
    email = '';
    address = '';
    social = '';
    extra = '';
    type = 0; //0 normal; 1 robot; 2 thing;
    //0 normal; 1 deleted;
    deleted = 0;

    updateDt = 0;

}
