// require csvtojson
var csv = require("csvtojson");

function getDataJson(filePath) {
    return csv()
        .fromFile(filePath)
        .then(function(jsonArrayObj){ //when parse finished, result will be emitted here.
            return jsonArrayObj; 
        }).catch(err => console.log(err));
}

module.exports=getDataJson;