
module.exports.decode = function (value) {
    return parseInt(value, 36);
}

module.exports.encode = function (value) {
    if (typeof value === 'string') {
        value = parseInt(value);
    }
    if (typeof value === 'number' && !isNaN(value)) {
        return value.toString(36);
    }
}
