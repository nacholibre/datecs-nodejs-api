'use strict';

var Promise = require("bluebird");
const SerialWrapper = require('./serial_wrapper.js');
const API = require('./api.js');
const fs = require('fs');

var debug = false;
var wrapper = new SerialWrapper('/dev/tty.usbserial-AL0517WZ', {}, debug);
var api = new API(wrapper);

//api.checkIfHasUnfinishedFiscalOperationAndAbortIt();

//api.playMusic();
//api.setLogo();
//api.setHeaders();
//api.dailyFinancialReport();
//api.createSale();
//api.clearDisplay();
//api.getDiagnosticInfo();
//api.getSaleFiscalNumber().then(function(res) {
//    console.log(res);
//});

var commands = [
    [60, null],
    //[46, '1,1,DT743818-0008-0000026,1,0,5122,0404191329,00000289'],
    //[52, 'Стоки\t1\t42.99'],
    ////[84, '1;1234567'], barcode
    ////[51, '11'],
    //[53, '\tP'],
    //[56, null],
];

return Promise.each(commands, function(data) {
    return wrapper.runCommand(data[0], data[1]).then(function(res) {
        console.log('command ' + data[0]);
        console.log('data ' + data[1]);

        console.log('messages');
        console.log(res.messages);
        console.log('status codes');
        console.log(res.responseStatusCodes);
        console.log('data');
        console.log(res.data);
        console.log('===============');
    });
});

//anulirane
//wrapper.runCommand(60).then(function(res) {
//    console.log(res);
//});

//wrapper.runCommand(83, '').then(function(res) {
//    console.log(res);
//});

//api.loadPBMLogo('/Users/nacholibre/Downloads/om_vsqka_edna.pbm');
