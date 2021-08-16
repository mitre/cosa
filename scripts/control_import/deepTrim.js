function deepTrim(obj)
{
    if (Array.isArray(obj)) {
        // trim all fields of excess trailing whitespace.
        var i;
        for(i = 0; i < obj.length; i++) {
            obj[i] = deepTrim(obj[i]);
        }
        return obj
    } else if(obj === null) {
        return obj;
    } else if (typeof obj === 'object') {
        var key;
        var keys = Object.getOwnPropertyNames(obj);
        var i;
        for(i = 0; i < keys.length; i++) {
            obj[keys[i]] = deepTrim(obj[keys[i]]);
        }
    } else if (typeof obj === 'string') {
        return obj = obj.trim();
    }
    // leave object alone!
    return obj;
}
module.exports = deepTrim;
