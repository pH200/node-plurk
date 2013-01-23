"use strict";

var plurk = require('../index');

var client = plurk.fromFileSync("test.json");

client.startComet(function (err, data, cometUrl) {
    if (err) {
        console.log(err);
        return;
    }
    console.log("Next: " + cometUrl);
    console.log(data);

    var rec;
    rec = function (reqUrl) {
        client.comet(reqUrl, function (err, data, newUrl) {
            if (err) {
                console.log(err);
                console.log(data);
                return;
            }
            console.log("Next: " + newUrl);
            console.log(data);
            console.log();
            rec(newUrl);
        });
    };
    rec(cometUrl);
});
