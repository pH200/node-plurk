/* node.js library for Plurk API 2.0
 */

var fs = require('fs');
var urlparse = require('url').parse;

var OAuth = require('oauth').OAuth;

var clientOAuthGen = function (https, consumerKey, consumerSecret) {
    var requestTokenUrl = https ? "https://www.plurk.com/OAuth/request_token"
                             : "http://www.plurk.com/OAuth/request_token";
    var accessTokenUrl = https ? "https://www.plurk.com/OAuth/access_token"
                            : "http://www.plurk.com/OAuth/access_token";
    return new OAuth(requestTokenUrl,
                     accessTokenUrl,
                     consumerKey,
                     consumerSecret,
                     "1.0",
                     null,
                     "HMAC-SHA1"
    );
};

// accessToken and accessToken are optional
var PlurkClient = function (https,
                       consumerKey, consumerSecret,
                       accessToken, accessTokenSecret) {
    this.endpoint = "http://www.plurk.com/";
    this.oAuth = clientOAuthGen(https, consumerKey, consumerSecret);

    this.getOAuthRequestToken = this.getRequestToken =
        function (extraParams, cb) {
            this.oAuth.getOAuthRequestToken(extraParams, cb);
        };

    this.getOAuthAccessToken = this.getAccessToken =
        function (oauth_token, oauth_token_secret, oauth_verifier, cb) {
            this.oAuth.getOAuthAccessToken(oauth_token, oauth_token_secret,
                                           oauth_verifier,
                                           cb);
        };

    this.accessToken = accessToken;
    this.accessTokenSecret = accessTokenSecret;
};

var getClient = function (json) {
    var data = JSON.parse(json);
    return new PlurkClient(data.https,
                      data.consumerKey, data.consumerSecret,
                      data.accessToken, data.accessTokenSecret);
}

// fromFile(filename, ['utf8'], function(err, client))
module.exports.fromFile = function (filename, encoding, cb) {
    var innerEnc = encoding;
    var innerCb = cb;
    if (typeof encoding === 'function') {
        innerEnc = 'utf8';
        innerCb = encoding;
    }
    fs.readFile(filename, enc, function(err, json) {
        if (err) {
            innerCb(err, json);
        } else {
            innerCb(err, getClient(json));
        }
    })
}

// fromFileSync(filename, ['utf8'])
module.exports.fromFileSync = function (filename, encoding) {
    var innerEnc = encoding;
    if (innerEnc == null) {
        innerEnc = 'utf8';
    }
    return getClient(fs.readFileSync(filename, innerEnc));
}

PlurkClient.prototype.getAuthPage = function(requestToken) {
    return "http://www.plurk.com/OAuth/authorize?oauth_token=" + requestToken
}
PlurkClient.prototype.getAuthPageMobile = function(requestToken) {
    return "http://www.plurk.com/m/authorize?oauth_token=" + requestToken
}

PlurkClient.prototype.join = function(path) {
    if (path.indexOf("/APP/") === 0) {
        return this.endpoint + path.substr(1);
    } else if (path.indexOf("APP/") === 0) {
        return this.endpoint + path
    } else if (path.indexOf("/") === 0) {
        return this.endpoint + "APP" + path;
    } else {
        return this.endpoint + "APP/" + path;
    }
};

var boundCb = function (cb) {
    if (!cb) {
        return function () {}; // or return;
    }
    return function (err, json) {
        var data;
        try {
            data = JSON.parse(json);
        } catch (e) { // JSON.parse throws SyntaxError.
            if (err) {
                cb(err, json);
            } else {
                cb({exception: e}, null);
            }
            return;
        }
        cb(err, data);
    }
}

// err is set to "missing new_offset" if any error occurred
var boundCometCb = function (cb, cometUrl) {
    if (!cb) {
        return function () {};
    }
    return function (err, jsonP) {
        if (err) {
            cb(err, jsonP);
            return;
        }
        var onError = function () {
            cb({error: "missing new_offset"}, jsonP);
        }
        var from = jsonP.indexOf('{');
        var to = jsonP.lastIndexOf('}') + 1;
        var json = jsonP.substring(from, to);
        var data;
        try {
            data = JSON.parse(json);
        } catch (e) {
            onError();
            return;
        }
        if (data["new_offset"] == null) {
            onError();
            return;
        }
        cb(err, data, cometUrl + "&offset=" + data["new_offset"]);
    }
}

// rq(api, obj, function(err, data) [, accessToken, accessTokenSecret])
PlurkClient.prototype.rq = function(api, obj, callback, accessToken, accessTokenSecret) {
    var path = this.join(api);
    if (accessToken == null) accessToken = this.accessToken;
    if (accessTokenSecret == null) accessTokenSecret = this.accessTokenSecret;
    this.oAuth.post(path, accessToken, accessTokenSecret, obj, boundCb(callback));
};

PlurkClient.prototype.post = function(api, accessToken, accessTokenSecret, obj, callback) {
    var path = this.join(api);
    this.oAuth.post(path, accessToken, accessTokenSecret, obj, boundCb(callback));
};

var startComet = function (self, accessToken, accessTokenSecret, callback) {
    self.post('/APP/Realtime/getUserChannel', accessToken, accessTokenSecret, null, function (err, data) {
        if (err) {
            callback(err, data);
        } else {
            var requestUrl = data["comet_server"];
            var cometUrl = /[^?]+/.exec(requestUrl) + "?channel=" + data["channel_name"];
            self.oAuth.get(requestUrl,
                           accessToken,
                           accessTokenSecret,
                           boundCometCb(callback, cometUrl));
        }
    });
}

var pollComet = function (self, requestUrl, accessToken, accessTokenSecret, callback) {
    var channel = urlparse(requestUrl, true).query["channel"];
    var cometUrl = /[^?]+/.exec(requestUrl) + "?channel=" + channel;
    self.oAuth.get(requestUrl,
                   accessToken,
                   accessTokenSecret,
                   boundCometCb(callback, cometUrl));
}

// startComet(function(err, data, cometUrl) [, accessToken, accessTokenSecret])
PlurkClient.prototype.startComet = function(callback, accessToken, accessTokenSecret) {
    if (accessToken == null) accessToken = this.accessToken;
    if (accessTokenSecret == null) accessTokenSecret = this.accessTokenSecret;
    startComet(this, accessToken, accessTokenSecret, callback);
};

// comet(cometUrl, function(err, data, cometUrl) [, accessToken, accessTokenSecret])
PlurkClient.prototype.comet = function(cometUrl, callback, accessToken, accessTokenSecret) {
    if (accessToken == null) accessToken = this.accessToken;
    if (accessTokenSecret == null) accessTokenSecret = this.accessTokenSecret;
    pollComet(this, cometUrl, accessToken, accessTokenSecret, callback);
};

var limitedTo = {}

limitedTo.parse = function (strOrArray) {
    if (Array.isArray(strOrArray)) {
        return strOrArray;
    } else if (typeof strOrArray === 'string') {
        var str = strOrArray;
        var pattern = /[0-9]+/g;
        var matches = str.match(pattern);
        if (matches) {
            return matches.map(function (id) { return parseInt(id); });
        } else {
            return null;
        }
    } else {
        return null;
    }
}

limitedTo.stringify = function (array) {
    return array.reduce(function (memo, id) {
        return memo + "|" + id + "|";
    }, "");
}

var base36 = {}

var baseTable = "0123456789abcdefghijklmnopqrstuvwxyz".split("");

base36.decode = function (value) {
    var reverse = value.toLowerCase().split("").reverse();
    return reverse.reduce(function (memo, ch, index) {
        return memo + baseTable.indexOf(ch) * Math.pow(36, index);
    }, 0);
}

base36.encode = function (value) {
    if (!value || value <= 0) {
        return "0";
    }
    var divide = value;
    var result = "";
    while (divide !== 0) {
        result = baseTable[divide % 36] + result;
        divide = Math.floor(divide / 36);
    }
    return result;
}

var urlMatch = {};

// decode base36 plurk_id to decimal if decode is set
urlMatch.plurk = function (url, decode) {
    var PLURKPATTERN = new RegExp("plurk\.com/(m/)?p/([0-9a-z]+)");
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

urlMatch.user = function (url) {
    var USERPATTERN = new RegExp("plurk\.com/(m/u/)?([0-9a-zA-Z_]+)(/#)?"); // 0-9, a-z and underscore
    var result = USERPATTERN.exec(url);
    if (result) {
        var user = result[2];
        if (user) {
            if (url.lastIndexOf(result[0]) === (url.length - result[0].length)) { // match trailing
                return user;
            }
        }
    }
    return null;
}

module.exports.limitedTo = limitedTo;

module.exports.base36 = base36;

module.exports.urlMatch = urlMatch;

module.exports.PlurkClient = PlurkClient;
