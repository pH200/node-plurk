# node-plurk #

Easy-to-use library for [Plurk API 2.0][API]. Parses JSON data automatically and handles comet channel.

## Installation ##

    npm install plurk

## Features ##

 - JSON data returned by Plurk API are parsed automatically
 - Helpers for comet channel API
 - Handle JSONP from comet channel *(CometChannel.scriptCallback({});)*
 - Instantiate new plurk client from json file
 - Parse limited_to property *("|id1||id2|")* of plurk data to array
 - Base36 converter for plurk_id in Plurk URL
 - Extract user\_id and plurk\_id from Plurk URL

## Getting Started ##

### Initialize Client ###

```javascript
var PlurkClient = require('plurk').PlurkClient;
var client = new PlurkClient(https, consumerKey, consumerSecret, accessToken, accessTokenSecret);
// https: true or false, for requesting request token and access token
// accessToken and accessTokenSecret are optional and can be set afterward.
client.accessToken = "MY_ACCESS_TOKEN";
client.accessTokenSecret = "MY_ACCESS_TOKEN_SECRET";
```

Or you can instantiate client from json config file:

```javascript
var client = require('plurk').fromFileSync('config.json')
```

config.json:

```json
{
    "https": true
    , "consumerKey": "MY_CONSUMER_KEY"
    , "consumerSecret": "MY_CONSUMER_SECRET"
    , "accessToken": "MY_ACCESS_TOKEN"
    , "accessTokenSecret": "MY_ACCESS_TOKEN_SECRET"
}
```

Again, accessToken and accessTokenSecret are optional.

Async read method is also available:

```javascript
require('plurk').fromFile('config.json', function (err, client) {
	if (!err) {
		// ...
	}
});
```

### Obtaining Request Token and Access Token ###

See *examples/getToken.js* for example usage.

```javascript
PlurkClient.prototype.getRequestToken // alias: getOAuthRequestToken
PlurkClient.prototype.getAccessToken // alias: getOAuthAccessToken
```

These two methods are as same as methods on [@ciaranj/node-oauth][oauth].

### Calling Plurk API ###

See *examples/getPublicProfile.js* for example usage.

```javascript
PlurkClient.prototype.rq = function(api, obj, callback [, accessToken, accessTokenSecret])
// pass null for obj argument if no parameter required by Plurk API.
```

```javascript
client.rq('Profile/getPublicProfile', {'user_id': "plurkapi"}, function(err, data) {
	if (!err) console.log(data);
});
```

#### API path can be one of following styles: ####

 - "/APP/Profile/getPublicProfile"
 - "APP/Profile/getPublicProfile"
 - "/Profile/getPublicProfile"
 - "Profile/getPublicProfile"

#### Note: #####

 1. For callback: function (err, data) { ... }
 2. Error object (**err**, data) is returned by [node-oauth][oauth]. This is null if no error occurred.
 3. For data (err, **data**), if JSON.parse failed internally, **data** would be null if err was null.
 4. And SyntaxError from JSON.parse would be catched and not being rethrowed.
 5. Instead, this exception (SyntaxError) would be assigned to **err** if **err** was null.
 6. However, normally invalid JSON and **err** (400, 404, 500) are presenting simultaneously.
 7. If so, **err** is not null and won't be changed by the presence of SyntaxError.

#### Short Version: ####

 - If you successfully called API. The function would automatically parse JSON for you.
 - On the other hand, if failed, err would be an object and the error JSON might not be parsed.

## Helpers ##

### Interacting with Comet Channel ###

Helper functions were created for handling data of comet API.

See *examples/getUserChannel.js* for example usage.

### Parsing Plurk limited_to ###

```javascript
var limitedTo = require('plurk').limitedTo;

limitedTo.parse("|1||2|"); // returns [1, 2]

limitedTo.stringify([1, 2]); // returns "|1||2|"
```

### Extract plurk\_id and user\_id from URL ###

```javascript
var urlMatch = require('plurk').urlMatch;

var userId = urlMatch.user('http://www.plurk.com/ChronoPlurk');
// returns "ChronoPlurk"

var plainPlurkId = urlMatch.plurk('http://www.plurk.com/p/foo3ly')
// returns "foo3ly"

var plurkId = urlMatch.plurk('http://www.plurk.com/p/foo3ly', true)
// returns 948427846 (require('plurk').base36.decode)
```

Mobile version of URL works, too.

```javascript
var userId = urlMatch.user('http://www.plurk.com/m/u/ChronoPlurk');

var plurkId = urlMatch.plurk('http://www.plurk.com/m/p/foo3ly', true)
```

[API]: http://www.plurk.com/API
[oauth]: https://github.com/ciaranj/node-oauth
