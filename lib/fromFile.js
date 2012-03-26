var fs = require('fs');
var PlurkClient = require('./PlurkClient');

var getClient = function (json) {
    var data = JSON.parse(json);
    return new PlurkClient(data.https,
                           data.consumerKey, data.consumerSecret,
                           data.accessToken, data.accessTokenSecret);
}

/* fromFile(filename, ['utf8'], function(err, client))
 */
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

/* fromFileSync(filename, ['utf8'])
 */
module.exports.fromFileSync = function (filename, encoding) {
    var innerEnc = encoding;
    if (innerEnc == null) {
        innerEnc = 'utf8';
    }
    return getClient(fs.readFileSync(filename, innerEnc));
}
