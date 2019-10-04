import UserSettingScope from "./usetSettingScope";

export default class UserSettingEntry {
    scope = UserSettingScope.kUserSettingCustomBegin;
    key = '';
    value = '';
    updateDt = 0;
}