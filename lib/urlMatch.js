"use strict";

var base36 = require('./base36');

module.exports = {
    plurk: function (url, decode) {
        // decode base36 plurk_id to decimal if decode has a value
        var result = /plurk\.com\/(m\/)?p\/([0-9a-z]+)(\/#)?$/.exec(url);
        if (result) {
            var plurk = result[2];
            if (plurk) {
                if (decode) {
                   return base36.decode(plurk);
                } else {
                    return plurk;
                }
            }
        }
        return null;
    },
    user: function (url) {
        // 0-9, a-z and underscore
        var result = /plurk\.com\/(m\/u\/)?([0-9a-zA-Z_]+)(\/#)?$/.exec(url);
        if (result) {
            var user = result[2];
            return user;
        }
        return null;
    }
};
