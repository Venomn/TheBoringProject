var getDataJson = require('./dataReader.js');
var logToFile = require('./logToFile.js');
const fsp = require('fs').promises;
const fs = require('fs');


let debugLogOn = false;
let consoleLogOn = false;

function debugLog (msg) {
    debugLogOn && console.log(msg);
}

function consoleLog (msg) {
    consoleLogOn && console.log(msg);
}

Date.prototype.addDays = function(days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}

// go through data from "startDate"
// return 
// {
//     resProfitPerYear: xxx,
//     duration: dateStart - dataEnd,
//     stockTotal: xxx,
//     BuyHistory: [
//         {date:xxx, buyAmount: xxx}
//     ],
//     startPrice:xxx,
//     EndPrice:xxx,
//     inputAmount: xxx,
//     outputAmount: xxx,
//     profitAmount: xxx,
// }

function getData (path, cb) {
    getDataJson(path).then(data => {
        cb(data);
    }).catch(err => console.error(err));
}

function calculateProfit(amountPerCycle, cycleDuration,startDate, targetProfitPerYear, data, minimumYears, stockName) {    
    consoleLog(`calculateProfit - startDate: ${startDate}`)

    function getStockAmount (amount, stockPrice) {
        if (!stockPrice) return 0;

        return amount / stockPrice;
    }

    function getDurationInDay (durationMs) {
        return durationMs/1000/60/60/24;
    }

    function convertToPercentage (rate) {
        return (rate - 1) * 100;
    }

    function run(data) {
        for (let i = 0; i < data.length; i+=cycleDuration) 
        {
            if (new Date(data[i].Date) < new Date(startDate)) {
                debugLog("*** skipping date: " + data[i].Date);

                result.startPrice = data[i].Open;
                continue;
            }
            debugLog("*** calculating date: " + data[i].Date);
            if (result.resProfitPerYear && result.duration
                && result.resProfitPerYear >= targetProfitPerYear 
                && result.duration >= minimumYears)
            {
                result.succeed = true;
                consoleLog(`############# Succeed #############`);
                consoleLog(result);

                
                logToFile(`../output/Succeed-${result.startDate}-${result.endDate}-${stockName}.json`, result);
                
                return result;       
            }          

            let precise = 8;

            debugLog(`amountPerCycle: ${amountPerCycle}, data[i].Open: ${data[i].Open}`);

            result.stockTotal += getStockAmount(amountPerCycle, Number(data[i].Open), precise);

            let curDateObj = new Date(data[i].Date);
            let startDateObj = new Date(startDate);

            debugLog(`endDate: ${curDateObj.toLocaleDateString("en-US")}, startDate: ${startDateObj.toLocaleDateString("en-US")}`);

            result.duration = getDurationInDay(curDateObj - startDateObj) / 365;
            debugLog(`*** result.duration: ` + result.duration);

            result.inputAmount += amountPerCycle;
            result.outputAmount = result.stockTotal * data[i].Open;

            result.resProfitTotal = convertToPercentage(result.outputAmount / result.inputAmount);
            debugLog(`*** result.resProfitTotal: ` + result.resProfitTotal);
            result.resProfitPerYear = result.resProfitTotal / result.duration;
            result.profitAmount = result.outputAmount - result.inputAmount;

            result.buyHistory.push({
                "date": data[i].Date,
                "Pay": amountPerCycle,
                "StockPrice": data[i].Open,
                "stockBuy": amountPerCycle / data[i].Open,
                "accumulateResult": {
                    "resProfitPerYear": result.resProfitPerYear,
                    "resProfitTotal": result.resProfitTotal,
                    "duration": result.duration,
                    "stockTotal": result.stockTotal,
                    "inputAmount": result.inputAmount,
                    "outputAmount": result.outputAmount,
                    "profitAmount": result.profitAmount,
                },
            });

            result.endPrice = data[i].Open;
            result.endDate = data[i].Date;
        }
        
        consoleLog(`############# failed #############`);
        consoleLog(result);

        logToFile(`../output/Failed-${result.startDate}-${result.endDate}-${stockName}.json`, result);

        return result;
    }

    let result = {
        "buyHistory": [],
        "resProfitPerYear": null,
        "resProfitTotal": null,
        "duration": null,           // years
        "stockTotal": 0,
        "startPrice": null,
        "endPrice": null,
        "inputAmount": 0,
        "outputAmount": null,
        "profitAmount": null,
        "startDate": startDate,
        "amountPerCycle": amountPerCycle,
        "cycleDuration": cycleDuration,
        "targetProfitPerYear": targetProfitPerYear,
        "stockName": stockName,
    };

    run(data);
}

const outputDir = '../output';
const startingDate = '1997-7-2';
const amountPerCycle = 1000;
const cycleInDays = 30;
const targetProfitPerYear = 10;
const minimumYears = 1;

fsp.rmdir(outputDir, { recursive: true })
    .then(() => {
        console.log(outputDir + ' directory removed!')
        if (!fs.existsSync(outputDir)){
            fs.mkdirSync(outputDir);
            console.log(outputDir + ' directory created!')
        }
        getData('../data/SSE50_from_1997.csv', (data) => {
            for (let curDate=new Date(startingDate); curDate < new Date(); curDate = curDate.addDays(1)) {
                calculateProfit(amountPerCycle, cycleInDays,`${curDate.getFullYear()}-${curDate.getMonth()+1}-${curDate.getDate()}`, targetProfitPerYear, data, minimumYears, 'SSE50_from_1997');
            }
        });
    })
    .catch(err => console.log(err));

// ##################testing area#######################
// getDataJson('../data/SSE50_from_1997.csv')
//     .then(data => console.log(data));

//calculateProfit(1000, 30,'2008-01-03', 10, '../data/SSE50_from_1997.csv', 1, 'SSE50_from_1997');

// let filename = "";
// if (resultObj.succeed) {
//     filename = `Succeed-${resultObj.startDate}-${resultObj.endDate}-${resultObj.stockCsv}`
// } else {
//     filename = `Failed-${resultObj.startDate}-${resultObj.endDate}-${resultObj.stockCsv}`
// }

// setTimeout(() => {
//     for (let curDate=new Date('1997-07-02'); curDate < new Date(); curDate = curDate.addDays(1)) {
    
//         calculateProfit(1000, 30,`${curDate.getFullYear()}-${curDate.getMonth()+1}-${curDate.getDate()}`, 10, fileCache, 1, 'SSE50_from_1997');
//     }
// }, 10000)


