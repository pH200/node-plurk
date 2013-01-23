"use strict";

var fs = require('fs');
var PlurkClient = require('./PlurkClient');

function getClient (json) {
    var data = JSON.parse(json);
    return new PlurkClient(data.https,
                           data.consumerKey, data.consumerSecret,
                           data.accessToken, data.accessTokenSecret);
}

module.exports = {
    /* fromFile(filename, ['utf8'], function(err, client))
     */
    fromFile: function (filename, encoding, cb) {
        var innerEnc = encoding;
        var innerCb = cb;
        if (typeof encoding === 'function') {
            innerEnc = 'utf8';
            innerCb = encoding;
        }
        fs.readFile(filename, innerEnc, function(err, json) {
            if (err) {
                innerCb(err, json);
            } else {
                innerCb(err, getClient(json));
            }
        });
    },
    /* fromFileSync(filename, ['utf8'])
     */
    fromFileSync: function (filename, encoding) {
        var innerEnc = encoding;
        if (innerEnc == null) {
            innerEnc = 'utf8';
        }
        return getClient(fs.readFileSync(filename, innerEnc));
    }
};
