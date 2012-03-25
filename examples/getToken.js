var plurk = require('../index');
var rl = require('readline');
var rlInterface = rl.createInterface(process.stdin, process.stdout, null);

var client = plurk.fromFileSync("test.json")

client.getRequestToken(function(err, token, tokenSecret) {
    console.log("requestToken: " + token);
    console.log("requestTokenSecret: " + tokenSecret);
    console.log(client.getAuthPage(token));
    rlInterface.question("Verifier: ", function(verifier) {
        client.getAccessToken(token, tokenSecret, verifier, function(err, aToken, aSecret) {
            if (err) {
                console.log(err);
            } else {
                console.log("accessToken: " + aToken);
                console.log("accessTokenSecret: " + aSecret);
            }
            rlInterface.close();
            process.stdin.destroy();
        });
    });
});
