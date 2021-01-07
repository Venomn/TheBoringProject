var fs = require('fs');

function logToFile(path, resultObj) {
    fs.writeFile(path, JSON.stringify(resultObj, null, 4), function(err) {
        if (err) {
            console.log(err);
            return;
        }
        console.log(`### succeed logging to file: ${path}`);
    });
}

module.exports=logToFile;