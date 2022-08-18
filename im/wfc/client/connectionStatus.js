/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */

export default class ConnectionStatus {
    static kConnectionStatusKickedOff = -7;
    static ConnectionStatusSecretKeyMismatch = -6;
    static ConnectionStatusTokenIncorrect = -5;
    static ConnectionStatusServerDown = -4;
    static ConnectionStatusRejected = -3;
    static ConnectionStatusLogout = -2;
    static ConnectionStatusUnconnected = -1;
    static ConnectionStatusConnecting = 0;
    static ConnectionStatusConnected = 1;
    static ConnectionStatusReceiveing = 2;
}
