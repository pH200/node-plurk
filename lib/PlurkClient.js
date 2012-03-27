var urlparse = require('url').parse;
var http = require('http');

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

/* rq(api, obj, function(err, data) [, accessToken, accessTokenSecret])
 */
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

var pollComet = function (requestUrl, callback) {
    var TIMEOUT = 80000; // 80000ms is 80secs

    var parsedUrl = urlparse(requestUrl, true);
    parsedUrl.method = "GET";

    var channel = parsedUrl.query["channel"];
    var cometUrl = /[^?]+/.exec(requestUrl) + "?channel=" + channel;

    var request = http.request(parsedUrl, function (res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            boundCometCb(callback, cometUrl)(null, chunk);
        });
    });
    request.setTimeout(TIMEOUT);
    request.on('error', function (e) {
        boundCometCb(callback, cometUrl)(e);
    });
    request.end();
}

/* startComet(function(err, data, cometUrl) [, accessToken, accessTokenSecret])
 */
PlurkClient.prototype.startComet = function(callback, accessToken, accessTokenSecret) {
    if (accessToken == null) accessToken = this.accessToken;
    if (accessTokenSecret == null) accessTokenSecret = this.accessTokenSecret;
    this.post('/APP/Realtime/getUserChannel', accessToken, accessTokenSecret, null, function (err, data) {
        if (err) {
            callback(err, data);
        } else {
            callback(err, data, data["comet_server"]);
        }
    });
};

/* comet(cometUrl, function(err, data, cometUrl))
 */
PlurkClient.prototype.comet = function(cometUrl, callback) {
    pollComet(cometUrl, callback);
};

module.exports = PlurkClient;
