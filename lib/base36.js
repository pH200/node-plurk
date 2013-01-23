"use strict";

module.exports = {
    decode: function (value) {
        return parseInt(value, 36);
    },
    encode: function (value) {
        if (typeof value === 'string') {
            value = parseInt(value, 10);
        }
        if (typeof value === 'number' && !isNaN(value)) {
            return value.toString(36);
        }
    }
};
