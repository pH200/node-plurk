var base36 = require('./base36');

// decode base36 plurk_id to decimal if decode has a value
module.exports.plurk = function (url, decode) {
    var PLURKPATTERN = new RegExp("plurk\.com/(m/)?p/([0-9a-z]+)(/#)?$");
    var result = PLURKPATTERN.exec(url);
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
}

module.exports.user = function (url) {
    var USERPATTERN = new RegExp("plurk\.com/(m/u/)?([0-9a-zA-Z_]+)(/#)?$"); // 0-9, a-z and underscore
    var result = USERPATTERN.exec(url);
    if (result) {
        var user = result[2];
        return user;
    }
    return null;
}
