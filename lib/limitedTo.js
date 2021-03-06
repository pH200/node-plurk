"use strict";

module.exports = {
    parse: function (strOrArray) {
        if (Array.isArray(strOrArray)) {
            return strOrArray;
        } else if (typeof strOrArray === 'string') {
            var str = strOrArray;
            var pattern = /[0-9]+/g;
            var matches = str.match(pattern);
            if (matches) {
                return matches.map(function (id) {
                    return parseInt(id, 10);
                });
            } else {
                return null;
            }
        } else {
            return null;
        }
    },
    stringify: function (array) {
        return array.reduce(function (memo, id) {
            return memo + "|" + id + "|";
        }, "");
    }
};
