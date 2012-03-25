var plurk = require('../index');

var client = plurk.fromFileSync("test.json")

client.rq('Profile/getPublicProfile', {'user_id': "plurkapi"}, function(err, data) {
    console.log(err);
    console.log(data["user_info"]);
});
