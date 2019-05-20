'use strict';

var Promise = require("bluebird");
const SerialWrapper = require('./serial_wrapper.js');
const API = require('./api.js');
const express = require('express')
const bodyParser = require('body-parser')
const Lock = require('./lock');

const app = express()
const host = '127.0.0.1';
const port = 3443

var debug = false;
var wrapper = new SerialWrapper('/dev/tty.usbserial-AL0517WZ', {}, debug);
var lock = new Lock();
var api = new API(wrapper, lock);

app.use(bodyParser.urlencoded({ extended: false }))

//this is used to catch all exceptions and return execution error and 503
//status code
const asyncMiddleware = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next))
    .catch(function(e) {
        //release API lock if any!!
        lock.release();
        console.log(e);
        res.status(503);
        res.send({status: 'execution_error'});
    });
};

//app.post('/play', function(req, res) {
//    api.playMusic().then(function() {
//        res.send({status: 'ok'});
//    });
//});

app.post('/play', asyncMiddleware(async (req, res) => {
    var data = await api.playMusic();
    res.send({'status': 'ok'});
}));

//app.post('/play', async function(req, res, next) {
//    try {
//        res.send({status: 'ok'});
//    } catch(e) {
//        res.send({status: 'execution_error'});
//    }
//});

app.post('/createSale', asyncMiddleware(async (req, res) => {
    if (!req.body.nSale || !req.body.amount) {
        res.status(503);
        res.send({msg: 'NSale or amount is empty!'});
        return;
    }

    var lines = [];
    if (req.body.lines) {
        lines = req.body.lines.split(';');
    }

    var stornoData = {
        'docType': null,
        'docNumber': null,
        'docDateTime': null,
        'fmNumber': null,
    };

    if (req.body.stornoDataDocType) {
        stornoData.docType = req.body.stornoDataDocType;
    }

    if (req.body.stornoDataDocNumber) {
        stornoData.docNumber = req.body.stornoDataDocNumber;
    }

    if (req.body.stornoDataDocDateTime) {
        stornoData.docDateTime = req.body.stornoDataDocDateTime;
    }

    if (req.body.stornoDataFmNumber) {
        stornoData.fmNumber = req.body.stornoDataFmNumber;
    }

    var params = {
        NSale: req.body.nSale,
        Amount: req.body.amount,
        lines: lines,
        PaidMode: req.body.paidMode,
        storno: req.body.storno,
        stornoData: stornoData,
    };

    console.log(params);

    let saleData = await api.createSale(params);

    res.send(saleData);

    //api.createSale(params).then(function(data) {
    //    console.log(data);
    //    res.send(data);
    //}).catch(function() {
    //    res.status(503);
    //    res.send({msg: 'Error'});
    //});
}));

app.get('/diagnostic_info', asyncMiddleware(async (req, res) => {
    let data = await api.getDiagnosticInfo();

    //console.log(data);
    res.send({
        'status': 'ok',
        'data': data,
    });

    //api.createSale(params).then(function(data) {
    //    console.log(data);
    //    res.send(data);
    //}).catch(function() {
    //    res.status(503);
    //    res.send({msg: 'Error'});
    //});
}));

//app.post('/old.createSale', function(req, res) {
//    //var nSale = req.body.nSale;
//    //var amount = req.body.amount;
//
//    //var paidMode = null;
//    //if (req.body.paidMode) {
//    //    paidMode = req.body.paidMode;
//    //}
//
//    if (!req.body.nSale || !req.body.amount) {
//        res.status(503);
//        res.send({msg: 'NSale or amount is empty!'});
//        return;
//    }
//
//    var lines = [];
//    if (req.body.lines) {
//        lines = req.body.lines.split(';');
//    }
//
//    var stornoData = {
//        'docType': null,
//        'docNumber': null,
//        'docDateTime': null,
//        'fmNumber': null,
//    };
//
//    if (req.body.stornoDataDocType) {
//        stornoData.docType = req.body.stornoDataDocType;
//    }
//
//    if (req.body.stornoDataDocNumber) {
//        stornoData.docNumber = req.body.stornoDataDocNumber;
//    }
//
//    if (req.body.stornoDataDocDateTime) {
//        stornoData.docDateTime = req.body.stornoDataDocDateTime;
//    }
//
//    if (req.body.stornoDataFmNumber) {
//        stornoData.fmNumber = req.body.stornoDataFmNumber;
//    }
//
//    //var params = {
//    //    NSale: nSale,
//    //    Amount: amount,
//    //    lines: lines,
//    //    PaidMode: paidMode,
//    //};
//
//    var params = {
//        NSale: req.body.nSale,
//        Amount: req.body.amount,
//        lines: lines,
//        PaidMode: req.body.paidMode,
//        storno: req.body.storno,
//        stornoData: stornoData,
//    };
//
//    api.createSale(params).then(function(data) {
//        console.log(data);
//        res.send(data);
//    }).catch(function() {
//        res.status(503);
//        res.send({msg: 'Error'});
//    });
//});

app.listen(port, host, function() {
    console.log(`Listening on port ${host}:${port}`);
});
