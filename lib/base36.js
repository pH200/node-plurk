
var baseTable = "0123456789abcdefghijklmnopqrstuvwxyz".split("");

module.exports.decode = function (value) {
    var reverse = value.toLowerCase().split("").reverse();
    return reverse.reduce(function (memo, ch, index) {
        return memo + baseTable.indexOf(ch) * Math.pow(36, index);
    }, 0);
}

module.exports.encode = function (value) {
    if (!value || value <= 0) {
        return "0";
    }
    var divide = value;
    var result = "";
    while (divide !== 0) {
        result = baseTable[divide % 36] + result;
        divide = Math.floor(divide / 36);
    }
    return result;
}
