var stdlib = {};

stdlib.exitFn = function(err) {
    if(err) {
        console.warn("Exiting with error : " + err);
        process.exit(1);
    } else {
        console.warn("Exiting");
        process.exit(0);
    }
};

stdlib.itera = function(array, cb) {
    for(var i=0,iLen=array.length;i<iLen;i++) {
        cb(array[i], i);
    }
};

stdlib.errorClosure = function(cb, next) {
    return function(err, result) {
        if(err) {
            console.warn("err:"+err);
            console.trace();
            cb(err);
        } else {
            next(result);
        }
    };
};

stdlib.waitForArgs = function(fieldArray, cb) {
    var argsObject = {},
        fieldLen = fieldArray.length,
        fieldDict = {'_len':fieldArray.length};
    stdlib.itera(fieldArray, function(field) {
        fieldDict[field] = 1;
    });
    
    return function(err, argName, argVal) {
        if(err) return cb(err);
        else if(fieldDict[argName]) {
            fieldDict[argName] -= 1;
            fieldDict['_len'] -= 1;
            argsObject[argName] = argVal;
        }//ignore other fieldnames
        if(fieldDict['_len'] == 0)//all fields have been set
            return cb(null, argsObject);
        return;
    };
};

stdlib.getChokepoint = function(max, perCall, cb) {
    var total = 0;
    return function(err, arg) {
        total = total + 1;
        if(perCall) perCall(err, arg);
        if(total == max) {
            total=0;
            cb();
        }
    };
};
stdlib.getSemaphore = stdlib.getChokepoint;

stdlib.paginationClosure = function(array, perPage, exitCondition, numPerPage) {
    var curIndex = 0;
    var endIndex = 0;
    var arrayLen = array.length;
    var pageSize = (numPerPage) ? numPerPage : Math.min(arrayLen, 30);
    var ret = function() {
        curIndex = endIndex;
        endIndex = Math.min(arrayLen, (curIndex + pageSize));
        perPage(array.slice(curIndex, endIndex),
                function(err, arg) {
                    if(exitCondition) exitCondition(err, arg);
                    if(endIndex < arrayLen)
                        inner();
                }
        );
    };
    
    var inner = stdlib.getSemaphore(pageSize, null, function() {
        //finished up to endIndex 
        console.log("Finished " + endIndex + "/" + arrayLen + ", paging next " + pageSize);
        ret();
    });
    return ret;
};

stdlib.cache = function(connection, keyGen, request) {
    return function(requestData, cb) {
        var key = keyGen(requestData);
        var cachedData = conn.hgetall(key);
        if(cachedData) cb(null, cachedData);
        else request(requestData, function(err, data) {
            if(err) cb(err);
            else {
                conn.hmset(key, data);
                cb(null, data);
            }
        });
    };
};

exports.stdlib = stdlib;
