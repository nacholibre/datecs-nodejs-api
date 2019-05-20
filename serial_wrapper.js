const SerialPort = require('serialport')
const ByteLength = require('@serialport/parser-byte-length')
var Promise = require("bluebird");

var commandPromise = null;
var messageStarted = false;
var messageBytes = [];
var SEQ = getRandomInt(32, 127);
var debug = false;
var statusCodes;
var hexToAscii;

class SerialWrapper {
    constructor(serialPortPath, serialPortOptions={}, debugConsole=false) {
        this.defaultOptions = {
            baudRate: 115200,
            databits: 8,
            parity: 'none',
            stopbits: 1,
            autoOpen: true
        };

        debug = debugConsole;

        hexToAscii = this.hexToAscii;

        if (serialPortOptions['baudRate'] != undefined) {
            this.defaultOptions['baudRate'] = serialPortOptions['baudRate'];
        }

        if (serialPortOptions['databits'] != undefined) {
            this.defaultOptions['databits'] = serialPortOptions['databits'];
        }

        if (serialPortOptions['parity'] != undefined) {
            this.defaultOptions['parity'] = serialPortOptions['parity'];
        }

        if (serialPortOptions['stopbits'] != undefined) {
            this.defaultOptions['stopbits'] = serialPortOptions['stopbits'];
        }

        this.serialPortPath = serialPortPath;

        this.port = new SerialPort(serialPortPath, this.defaultOptions);

        this.portOpened = false;

        this.port.on('open', function() {
            this.portOpened = true;

            this.fnc && this.fnc();
        }.bind(this));

        var parseReponseFunction = this.parseResponse;

        this.port.on('data', function (data) {
            //console.log('message started:');
            //console.log(messageStarted );

            //console.log(commandPromise);
            //console.log(data);
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
                        commandPromise.resolve(parseReponseFunction(messageBytes));
                        messageBytes = [];
                    }
                }
            });
        });

        statusCodes = this.getStatusCodes();
    }

    getStatusCodes() {
        return new Map([
            ['GENERAL_ERROR', 1],
            ['CLIENT_DISPLAY_NOT_CONNECTED', 2],
            ['CLOCK_NOT_SYNCED', 3],
            ['COMMAND_CODE_INVALID', 4],
            ['SYNTACS_ERROR', 5],
            ['INTERNAL_TERMINAL_NOT_RESPONDING', 6],
            ['NOT_SENT_DOCUMENTS_MORE_THAN_TIME_SETTED', 7],
            ['COMMAND_CANNOT_BE_EXECUTED_IN_CURRENT_STATE', 8],
            ['COMMAND_EXECUTION_CAUSED_OVERFLOW_IN_AMOUNT_FIELDS', 9],
            ['SERVICE_NOTE_OPENED', 10],
            ['NEAR_KLEN_END', 11],
            ['FISCAL_NOTE_OPENED', 12],
            ['END_OF_PAPER', 13],
            ['OR_ALL_ERRORS', 14],
            ['FISCAL_MEMORY_FULL', 15],
            ['MEMORY_FOR_LESS_THAN_50_RECORDS_LEFT', 16],
            ['ID_FOR_FISCAL_DEVICE_AND_FISCAL_MEMORY_IS_SET', 17],
            ['EIK_SET', 18],
            ['FISCAL_MEMORY_SAVE_ERROR', 19],
            ['TAX_RATE_IS_ATLEAST_ONE_TIME_SET', 20],
            ['DEVICE_IS_IN_FISCAL_MODE', 21],
            ['FISCAL_MEMORY_IS_FORMATTED', 22],
            ['KLEN_END_LESS_THAN_1_MB', 23],
        ]);
    }

    onOpen(fnc) {
        this.fnc = fnc;
    }

    defer() {
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

    asciiToHex(str) {
        var arr1 = [];

        for (var n = 0, l = str.length; n < l; n ++) {
            var hex = Number(str.charCodeAt(n));
            arr1.push(hex);
        }

        return Buffer.from(arr1, 'hex');
    }

    hexToAscii(hexx) {
        var hex = hexx.toString();//force conversion
        var str = '';
        for (var i = 0; (i < hex.length && hex.substr(i, 2) !== '00'); i += 2)
            str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
        return str;
    }

    generateCommandPack(cmd, data=null) {
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

        if (debug) {
            console.log('==== START Raw Data');
            console.log(data);
            console.log('==== END Raw Data');
        }

        //if (data == 0) {
        //    dataLength = 1;
        //}


        var len = dataLength + MIN_LENGTH;

        if (debug) {
            console.log('==== START Data length');
            console.log(len);
            console.log('==== END Data length');
        }

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


        if (debug) {
            console.log('==== START BCC array and checksum');
            console.log(bccArr);
            console.log(hexChecksum);
            console.log('==== END BCC array and checksum');
        }

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

    runCommand(cmd, data=null) {
        commandPromise = this.defer();

        if (data) {
            data = UnicodeToWin1251(data);
            data = this.asciiToHex(data);
        }

        var pack = this.generateCommandPack(cmd, data);

        this.port.write(pack, function(err, result) {
            if (err) {
                return commandPromise.reject(err);
            }
        });

        return commandPromise.promise;
    }

    parseResponse(response) {
        var lengthBytes = response[1] - 32; //32 is offset

        var dataResponse = [];
        if (lengthBytes > 11) {
            for (var k = 4; k <= (lengthBytes-8); k++) {
                dataResponse.push(response[k]);
            }
        }

        var d = Buffer.from(dataResponse, 'hex').toString();
        //console.log(Buffer.from(dataResponse, 'hex'));

        var statusBytes = [];

        var statusI = 0;
        var statusStart = false;
        response.forEach(function(d) {
            if (d == 4) {
                statusStart = true;
            }

            if (d == 5) {
                statusStart = false;
            }

            if (statusStart) {
                if (statusI > 0) {
                    statusBytes.push(d);
                }
                statusI++;
            }
        });

        var statusMessages = [];
        var responseStatusCodes = [];

        statusBytes.forEach(function(v, i) {
            var binaryResponse = parseInt(v).toString('2');
            var bitsReversed = reverseString(binaryResponse);

            if (i == 0) {
                if (bitsReversed[5] == '1') {
                    statusMessages.push('Обща грешка.');
                    responseStatusCodes.push(statusCodes.get('GENERAL_ERROR'));
                }

                if (bitsReversed[3] == '1') {
                    statusMessages.push('Не е свързан клиентски дисплей. ');
                    responseStatusCodes.push(statusCodes.get('CLIENT_DISPLAY_NOT_CONNECTED'));
                }

                if (bitsReversed[2] == '1') {
                    statusMessages.push('Не е сверен часовника.');
                    responseStatusCodes.push(statusCodes.get('CLOCK_NOT_SYNCED'));
                }

                if (bitsReversed[1] == '1') {
                    statusMessages.push('Кодът на получената команда е невалиден. ');
                    responseStatusCodes.push(statusCodes.get('COMMAND_CODE_INVALID'));
                }

                if (bitsReversed[0] == '1') {
                    statusMessages.push('Получените данни имат синктактична грешка. ');
                    responseStatusCodes.push(statusCodes.get('SYNTACS_ERROR'));
                }
            } else if (i == 1) {
                if (bitsReversed[6] == '1') {
                    statusMessages.push('Вграденият данъчен терминал не отговаря. ');
                    responseStatusCodes.push(statusCodes.get('INTERNAL_TERMINAL_NOT_RESPONDING'));
                }

                if (bitsReversed[5] == '1') {
                    statusMessages.push('Има неизпратени документи за повече от настроеното време за предупреждение');
                    responseStatusCodes.push(statusCodes.get('NOT_SENT_DOCUMENTS_MORE_THAN_TIME_SETTED'));
                }

                if (bitsReversed[1] == '1') {
                    statusMessages.push('Изпълнението на командата не е позволено в текущия фискален режим');
                    responseStatusCodes.push(statusCodes.get('COMMAND_CANNOT_BE_EXECUTED_IN_CURRENT_STATE'));
                }

                if (bitsReversed[0] == '1') {
                    statusMessages.push('При изпълнение на командата се е получило препълване на някои полета от сумите.');
                    responseStatusCodes.push(statusCodes.get('COMMAND_EXECUTION_CAUSED_OVERFLOW_IN_AMOUNT_FIELDS'));
                }
            } else if (i == 2) {
                if (bitsReversed[5] == '1') {
                    statusMessages.push('Отворен е служебен бон. ');
                    responseStatusCodes.push(statusCodes.get('SERVICE_NOTE_OPENED'));
                }

                if (bitsReversed[4] == '1') {
                    statusMessages.push('Близък край на КЛЕН (по-малко от 10 MB от КЛЕН свободни). ');
                    responseStatusCodes.push(statusCodes.get('NEAR_KLEN_END'));
                }

                if (bitsReversed[3] == '1') {
                    statusMessages.push('Отворен е фискален бон. ');
                    responseStatusCodes.push(statusCodes.get('FISCAL_NOTE_OPENED'));
                }

                if (bitsReversed[2] == '1') {
                    statusMessages.push('Край на КЛЕН (по-малко от 1 MB от КЛЕН свободни)');
                    responseStatusCodes.push(statusCodes.get('KLEN_END_LESS_THAN_1_MB'));
                }

                if (bitsReversed[0] == '1') {
                    statusMessages.push('Свършила е хартията. Ако се вдигне този флаг по време на команда, свързана с печат, то командата е отхвърлена и не е променила състоянието на ФУ');
                    responseStatusCodes.push(statusCodes.get('END_OF_PAPER'));
                }
            } else if (i == 4) {
                if (bitsReversed[5] == '1') {
                    statusMessages.push('OR на всички грешки, маркирани с * от байтове 4 и 5');
                    responseStatusCodes.push(statusCodes.get('OR_ALL_ERRORS'));
                }

                if (bitsReversed[4] == '1') {
                    statusMessages.push('ФП е пълна');
                    responseStatusCodes.push(statusCodes.get('FISCAL_MEMORY_FULL'));
                }

                if (bitsReversed[3] == '1') {
                    statusMessages.push('Има място за по-малко от 50 записа във ФП.');
                    responseStatusCodes.push(statusCodes.get('MEMORY_FOR_LESS_THAN_50_RECORDS_LEFT'));
                }

                if (bitsReversed[2] == '1') {
                    statusMessages.push('Зададени са индивидуален номер на ФУ и номер на ФП');
                    responseStatusCodes.push(statusCodes.get('ID_FOR_FISCAL_DEVICE_AND_FISCAL_MEMORY_IS_SET'));
                }

                if (bitsReversed[1] == '1') {
                    statusMessages.push('Зададен е ЕИК');
                    responseStatusCodes.push(statusCodes.get('EIK_SET'));
                }

                if (bitsReversed[0] == '1') {
                    statusMessages.push('Грешка при запис във фискалната памет');
                    responseStatusCodes.push(statusCodes.get('FISCAL_MEMORY_SAVE_ERROR'));
                }
            } else if (i == 5) {
                if (bitsReversed[4] == '1') {
                    statusMessages.push('Зададени са поне веднъж данъчните ставки.');
                    responseStatusCodes.push(statusCodes.get('TAX_RATE_IS_ATLEAST_ONE_TIME_SET'));
                }

                if (bitsReversed[3] == '1') {
                    statusMessages.push('ФУ е във фискален режим.');
                    responseStatusCodes.push(statusCodes.get('DEVICE_IS_IN_FISCAL_MODE'));
                }

                if (bitsReversed[1] == '1') {
                    statusMessages.push('ФП е форматирана.');
                    responseStatusCodes.push(statusCodes.get('FISCAL_MEMORY_IS_FORMATTED'));
                }
            }
        });

        //11
        return {
            'hexResponse': response,
            'messages': statusMessages,
            'responseStatusCodes': responseStatusCodes,
            'data': d,
        };
    }

}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

var DMap = {0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10, 11: 11, 12: 12, 13: 13, 14: 14, 15: 15, 16: 16, 17: 17, 18: 18, 19: 19, 20: 20, 21: 21, 22: 22, 23: 23, 24: 24, 25: 25, 26: 26, 27: 27, 28: 28, 29: 29, 30: 30, 31: 31, 32: 32, 33: 33, 34: 34, 35: 35, 36: 36, 37: 37, 38: 38, 39: 39, 40: 40, 41: 41, 42: 42, 43: 43, 44: 44, 45: 45, 46: 46, 47: 47, 48: 48, 49: 49, 50: 50, 51: 51, 52: 52, 53: 53, 54: 54, 55: 55, 56: 56, 57: 57, 58: 58, 59: 59, 60: 60, 61: 61, 62: 62, 63: 63, 64: 64, 65: 65, 66: 66, 67: 67, 68: 68, 69: 69, 70: 70, 71: 71, 72: 72, 73: 73, 74: 74, 75: 75, 76: 76, 77: 77, 78: 78, 79: 79, 80: 80, 81: 81, 82: 82, 83: 83, 84: 84, 85: 85, 86: 86, 87: 87, 88: 88, 89: 89, 90: 90, 91: 91, 92: 92, 93: 93, 94: 94, 95: 95, 96: 96, 97: 97, 98: 98, 99: 99, 100: 100, 101: 101, 102: 102, 103: 103, 104: 104, 105: 105, 106: 106, 107: 107, 108: 108, 109: 109, 110: 110, 111: 111, 112: 112, 113: 113, 114: 114, 115: 115, 116: 116, 117: 117, 118: 118, 119: 119, 120: 120, 121: 121, 122: 122, 123: 123, 124: 124, 125: 125, 126: 126, 127: 127, 1027: 129, 8225: 135, 1046: 198, 8222: 132, 1047: 199, 1168: 165, 1048: 200, 1113: 154, 1049: 201, 1045: 197, 1050: 202, 1028: 170, 160: 160, 1040: 192, 1051: 203, 164: 164, 166: 166, 167: 167, 169: 169, 171: 171, 172: 172, 173: 173, 174: 174, 1053: 205, 176: 176, 177: 177, 1114: 156, 181: 181, 182: 182, 183: 183, 8221: 148, 187: 187, 1029: 189, 1056: 208, 1057: 209, 1058: 210, 8364: 136, 1112: 188, 1115: 158, 1059: 211, 1060: 212, 1030: 178, 1061: 213, 1062: 214, 1063: 215, 1116: 157, 1064: 216, 1065: 217, 1031: 175, 1066: 218, 1067: 219, 1068: 220, 1069: 221, 1070: 222, 1032: 163, 8226: 149, 1071: 223, 1072: 224, 8482: 153, 1073: 225, 8240: 137, 1118: 162, 1074: 226, 1110: 179, 8230: 133, 1075: 227, 1033: 138, 1076: 228, 1077: 229, 8211: 150, 1078: 230, 1119: 159, 1079: 231, 1042: 194, 1080: 232, 1034: 140, 1025: 168, 1081: 233, 1082: 234, 8212: 151, 1083: 235, 1169: 180, 1084: 236, 1052: 204, 1085: 237, 1035: 142, 1086: 238, 1087: 239, 1088: 240, 1089: 241, 1090: 242, 1036: 141, 1041: 193, 1091: 243, 1092: 244, 8224: 134, 1093: 245, 8470: 185, 1094: 246, 1054: 206, 1095: 247, 1096: 248, 8249: 139, 1097: 249, 1098: 250, 1044: 196, 1099: 251, 1111: 191, 1055: 207, 1100: 252, 1038: 161, 8220: 147, 1101: 253, 8250: 155, 1102: 254, 8216: 145, 1103: 255, 1043: 195, 1105: 184, 1039: 143, 1026: 128, 1106: 144, 8218: 130, 1107: 131, 8217: 146, 1108: 186, 1109: 190}

function UnicodeToWin1251(s) {
    var L = []
    for (var i=0; i<s.length; i++) {
        var ord = s.charCodeAt(i)
        if (!(ord in DMap))
            throw "Character "+s.charAt(i)+" isn't supported by win1251!"
        L.push(String.fromCharCode(DMap[ord]))
    }
    return L.join('')
}

function reverseString(str) {
    // Step 1. Use the split() method to return a new array
    var splitString = str.split(""); // var splitString = "hello".split("");
    // ["h", "e", "l", "l", "o"]

    // Step 2. Use the reverse() method to reverse the new created array
    var reverseArray = splitString.reverse(); // var reverseArray = ["h", "e", "l", "l", "o"].reverse();
    // ["o", "l", "l", "e", "h"]

    // Step 3. Use the join() method to join all elements of the array into a string
    var joinArray = reverseArray.join(""); // var joinArray = ["o", "l", "l", "e", "h"].join("");
    // "olleh"

    //Step 4. Return the reversed string
    return joinArray; // "olleh"
}

module.exports = SerialWrapper;
