'use strict';

const SerialPort = require('serialport')
const ByteLength = require('@serialport/parser-byte-length')
var Promise = require("bluebird");

//var testOptions = {
//    baudRate: 115200,
//    databits: 8,
//    parity: 'none',
//    stopbits: 1,
//};

var defaultOptions = {
    baudRate: 115200,
    databits: 8,
    parity: 'none',
    stopbits: 1,
    //autoOpen: true
};

const port = new SerialPort('/dev/tty.usbserial-AL0517WZ', defaultOptions);

//port.open(function (err) {
//    if (err) {
//        return console.log('Error opening port: ', err.message)
//    }
//
//    // Because there's no callback to write, write errors will be emitted on the port:
//    port.write('main screen turn on')
//});

// The open event is always emitted
port.on('open', function() {
    console.log('port is now opened');
    //port.write(Buffer.from('Hi Mom!'));
    //port.write('<01><LEN><SEQ><CMD><DATA><05><BCC><03>');

    //var buffer = Buffer.alloc(10);
    //buffer[0] = 0x01; // Preamble
    //buffer[1] = 0x20; // <LEN>
    //buffer[2] = 0x20; // <SEQ> HASH
    //buffer[3] = 0x50; // <CMD> 0x50 - BEEP
    //buffer[4] = 0x00; // <DATA>
    //buffer[5] = 0x05; // Postamble
    //buffer[6] = 0x05; // <BCC>
    //buffer[7] = 0x03; // Postamble

    //var BCC = parseInt('25', 16) + parseInt('20', 16) + parseInt('50', 16) + parseInt('00', 16) + parseInt('05', 16);
    ////console.log(BCC.toString(10));

    //var decimalSum = '48495352';

    //0+48 = 48
    //1+48 = 49
    //5+48 = 53
    //4+48 = 52

    var testData = [];
    testData.push(1);
    testData.push(36);
    testData.push(62);
    testData.push(80);
    testData.push(5);
    testData.push(48);
    testData.push(48);
    testData.push(66);
    testData.push(55);
    testData.push(3);
    var testBinary = Buffer.from(testData);
    //1 36 62 80 5 48 48 66 55 3

    var test2 = [];
    test2.push(1);
    test2.push(36);
    test2.push(62);
    test2.push(80);
    test2.push(5);
    test2.push(48);
    test2.push(48);
    test2.push(66);
    test2.push(55);
    test2.push(3);

    //var d = Buffer.from([0x01, 0x24], 'hex');
    //console.log(d);

    var decimalData = [];

    decimalData.push(1); //premble
    decimalData.push(4+32); //len - 32 is offset
    decimalData.push(32); //seq
    decimalData.push(80); //cmd 80 is beep
    //decimalData.push(0); //data
    decimalData.push(5); //postamble

    //decimalData.forEach(function(v, i) {
    //    console.log(i);
    //    console.log(v);
    //});

    var BCC = (4+32) + 32 + 80 + 0 + 5;
    console.log(parseInt(BCC).toString(16));
    //153 result

    //decimalData.push(0+48); //BCC
    //decimalData.push(1+48); //BCC
    //decimalData.push(5+48); //BCC
    //decimalData.push(3+48); //BCC

    decimalData.push(Buffer.from('0x30')); //BCC
    decimalData.push(Buffer.from('0x30')); //BCC
    decimalData.push(Buffer.from('0x39')); //BCC
    decimalData.push(Buffer.from('0x39')); //BCC

    decimalData.push(3); //terminaltor

    var data = Buffer.from(decimalData)
    //console.log(data);

    //console.log('write test data');
    //port.write(data, function(err, result) {
    //    if (err) {
    //        console.log(err);
    //    }

    //    console.log(err);
    //    console.log(result);
    //});

    playMusic(port);
    //port.write(pack, function(err, result) {
    //    if (err) {
    //        console.log(err);
    //    }

    //    console.log(err);
    //    console.log(result);
    //});

    //setTimeout(function() {
    //    var pack = generateCommandPack(44, Buffer.from([parseInt('34', 16)]));
    //    port.write(pack);
    //}, 500);

    //var pack = generateCommandPack(115, Buffer.from([parseInt('30', 16), parseInt('2c', 16), parseInt('31', 16)]));
    //port.write(pack, function(err, result) {
    //    console.log(err);
    //    console.log(result);
    //});

    //port.write(Buffer.from('01', 'hex'));

    ////отваряне на клиентски бон
    //var d = [
    //    parseInt('31', 16),
    //    parseInt('2c', 16),
    //    parseInt('31', 16),
    //    parseInt('2c', 16),
    //    parseInt('31', 16),
    //    parseInt('2c', 16),
    //    parseInt('31', 16),
    //];
    //var pack = generateCommandPack(48, Buffer.from(d));
    //port.write(pack, function(err, res) {
    //    console.log(err);
    //    console.log(res);
    //});

    //var d = [
    //    parseInt('32', 16),
    //    parseInt('30', 16),
    //    parseInt('32', 16),
    //    parseInt('30', 16),
    //    parseInt('34', 16),
    //    parseInt('38', 16),
    //    parseInt('34', 16),
    //    parseInt('38', 16),
    //    parseInt('33', 16),
    //    parseInt('09', 16),
    //    parseInt('0', 16),
    //];
    //var pack = generateCommandPack(57, Buffer.from(d));
    //port.write(pack, function(err, res) {
    //    console.log(err);
    //    console.log(res);
    //});

    //setTimeout(function() {
    //    var d = [
    //        parseInt('09', 16),
    //        parseInt('c0', 16), //c0 - А на кирилица
    //        parseInt('1', 16),
    //        parseInt('2d', 16),
    //        parseInt('31', 16),
    //    ];
    //    var pack = generateCommandPack(49, Buffer.from(d));
    //    port.write(pack, function(err, res) {
    //        console.log(err);
    //        console.log(res);
    //    });
    //}, 500);
});

var SEQ = 32;

function generateCommandPack(cmd, data=null) {
    SEQ++;

    if (SEQ >= 127) {
        SEQ = 32;
    }

    var pack = [];

    const PREMBLE = 1;
    const POSTAMBLE = 5;
    const TERMINATOR = 3;
    const CHECKSUM_OFFSET_HEX = 30;
    const CHECKSUM_OFFSET_DECIMAL = 48;

    const MIN_LENGTH = 36;

    //var len = Buffer.byteLength(Buffer.from(data)) + MIN_LENGTH;
    var dataLength = 0;
    if (data) {
        dataLength = data.length;
    }
    console.log(data);
    //if (data == 0) {
    //    dataLength = 1;
    //}

    console.log('data length: ' + dataLength);
    var len = dataLength + MIN_LENGTH;
    console.log(len);
    //console.log(Buffer.from(data.toString(), 'hex'));

    var BCC = len + SEQ + cmd + POSTAMBLE;
    if (data) {
        data.forEach(function(v) {
            BCC = BCC + v;
        });
    }


    var hexChecksum = parseInt(BCC).toString(16);
    var charactersLength = hexChecksum.length;

    var bccArr = [];

    if (charactersLength == 2) {
        bccArr.push(CHECKSUM_OFFSET_DECIMAL);
        bccArr.push(CHECKSUM_OFFSET_DECIMAL);
    } else if (charactersLength == 3) {
        bccArr.push(CHECKSUM_OFFSET_DECIMAL);
    }

    for (var i=0;i<hexChecksum.length;i++) {
        var v = hexChecksum[i];
        var n = parseInt(v, 16) + parseInt(CHECKSUM_OFFSET_HEX, 16);
        bccArr.push(n);
    }

    console.log(bccArr);

    console.log(hexChecksum);

    pack.push(PREMBLE); //premble
    pack.push(len); //len - 32 is offset
    pack.push(SEQ); //seq
    pack.push(cmd); //cmd 80 is beep

    if (data) {
        data.forEach(function(v) {
            pack.push(v);
        });
        //pack.push(data); //data
    }

    pack.push(POSTAMBLE); //postamble

    bccArr.forEach(function(v) {
        pack.push(v);
    });

    pack.push(TERMINATOR);

    return Buffer.from(pack);
}

function registriraneNaProdajba() {
    var d = [
        parseInt('09', 16), //tab
        //parseInt('c0', 16), //c0 - А на кирилица
        parseInt('1', 16), //departament
        parseInt('09', 16), //tab
        parseInt('31', 16),
    ];

    var pack = generateCommandPack(49, Buffer.from(d));
}

//var commandSeq = null;
var commandPromise = null;

function runCommand(connection, cmd, data) {
    commandPromise = defer();

    var pack = generateCommandPack(cmd, data);

    connection.write(pack, function(err, result) {
        if (err) {
            return commandPromise.reject(err);
        }
    });

    return commandPromise.promise;
}


var messageStarted = false;
var messageBytes = [];

port.on('data', function (data) {
    console.log('Received Data:', data)

    data.forEach(function(v) {
        if (v == 1) {
            messageStarted = true;
        }

        if (messageStarted) {
            messageBytes.push(v);
        }

        if (v == 3) {
            messageStarted = false;
            if (commandPromise) {
                commandPromise.resolve(messageBytes);
            }
        }
    });
});

function playMusic(port) {
    var notesFrequencies = {
        'c': 261,
        'd': 294,
        'e': 329,
        'f': 349,
        'g': 391,
        'gS': 415,
        'a': 440,
        'aS': 455,
        'b': 466,
        'cH': 523,
        'cSH': 554,
        'dH': 587,
        'dSH': 622,
        'eH': 659,
        'fH': 698,
        'fSH': 740,
        'gH': 784,
        'gSH': 830,
        'aH': 880,
    };

    var musicSteps = [
        [notesFrequencies['a'], '500', '30'],
        [notesFrequencies['a'], '500', '30'],
        [notesFrequencies['a'], '500', '30'],
        [notesFrequencies['f'], '350', '30'],
        [notesFrequencies['cH'], '150', '30'],
        [notesFrequencies['a'], '500', '30'],
        [notesFrequencies['f'], '350', '30'],
        [notesFrequencies['cH'], '150', '30'],
        [notesFrequencies['a'], '150', '30'],
        [0, 0, '150'], //end part one
        [notesFrequencies['eH'], '500', '30'],
        [notesFrequencies['eH'], '500', '30'],
        [notesFrequencies['eH'], '500', '30'],
        [notesFrequencies['fH'], '350', '30'],
        [notesFrequencies['cH'], '150', '30'],
        [notesFrequencies['gS'], '500', '30'],
        [notesFrequencies['f'], '350', '30'],
        [notesFrequencies['cH'], '150', '30'],
        [notesFrequencies['a'], '650', '30'],
        [0, 0, '150'], //end part two
        [notesFrequencies['aH'], '500', '30'],
        [notesFrequencies['a'], '300', '30'],
        [notesFrequencies['a'], '150', '30'],
        [notesFrequencies['aH'], '400', '30'],
        [notesFrequencies['gSH'], '200', '30'],
        [notesFrequencies['gH'], '200', '30'],
        [notesFrequencies['fSH'], '125', '30'],
        [notesFrequencies['fH'], '125', '30'],
        [notesFrequencies['fSH'], '250', '30'],
        [0, 0, '250'], //end part three
        [notesFrequencies['aS'], '250', '30'],
        [notesFrequencies['dSH'], '400', '30'],
        [notesFrequencies['dH'], '200', '30'],
        [notesFrequencies['cSH'], '200', '30'],
        [notesFrequencies['cH'], '125', '30'],
        [notesFrequencies['b'], '125', '30'],
        [notesFrequencies['cH'], '250', '30'],
        [0, 0, '250'], //end part four
    ];

    return Promise.each(musicSteps, function(musicData) {
        if (musicData[0] == 0 && musicData[1] == 0) {
            return Promise.delay(musicData[2]);
        } else {
            return runCommand(port, 80, asciiToHex(musicData[0] + ',' + musicData[1]) ).delay(parseInt(musicData[1]) + parseInt(musicData[2]));
        }
    });
}

function defer() {
    var resolve, reject;
    var promise = new Promise(function() {
        resolve = arguments[0];
        reject = arguments[1];
    });

    return {
        resolve: resolve,
        reject: reject,
        promise: promise
    };
}

function asciiToHex(str) {
    var arr1 = [];

    for (var n = 0, l = str.length; n < l; n ++) {
        var hex = Number(str.charCodeAt(n)).toString(16);
        arr1.push(hex);
    }

    return Buffer.from(arr1.join(''), 'hex');
}

//port.on('readable', function () {
//    console.log('Data:', port.read())
//})
