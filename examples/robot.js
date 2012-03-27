/* This robot response reversed content of its friends' plurks.
 * Including its own plurk.
 */

var plurk = require('../index');

var client = plurk.fromFileSync("test.json");

client.startComet(function (err, data, cometUrl) {
    if (err) {
        console.log(err);
        return;
    }

    console.log('Comet channel started.');

    var rec;
    rec = function (reqUrl) {
        client.rq('Alerts/addAllAsFriends'); // ignore callback
        client.comet(reqUrl, function (err, cometData, newUrl) {
            if (err) {
                rec(cometUrl); // Request by first comet offset.
                return;
            }
            var msgs = cometData.data;
            if (msgs && Array.isArray(msgs)) {
                msgs.filter(function (data) {
                    return (data && (data.type === 'new_plurk')); // Only response to new plurk.
                }).forEach(function (data) {
                    console.log("New Plurk" + "(" + data.user_id + '): ' + data.content_raw);

                    var content = data.content_raw;
                    var reverse = content.split("").reverse().join(""); // Reverse string.
                    var arg = {
                        'plurk_id': data.plurk_id,
                        'content': reverse,
                        'qualifier': 'thinks'
                    };
                    client.rq('Responses/responseAdd', arg); // ignore callback
                });
            }
            rec(newUrl);
        });
    };

    rec(cometUrl); // Start recursion.
});
