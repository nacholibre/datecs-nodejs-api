'use strict';

const Promise = require("bluebird");
const fs = require('fs');

var self;

class API {
    constructor(serialWrapper, lock) {
        this.serialWrapper = serialWrapper;
        this.lock = lock;

        self = this;
    }

    getNoteFrequency(note) {
        let notesFreq = {
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

        return notesFreq[note];
    }

    cancelFiscalOperation() {
        return self.serialWrapper.runCommand(60);
    }

    async playMusicSteps(musicSteps) {
        await self.lock.acquire();

        await Promise.each(musicSteps, function(musicData) {
            if (musicData[0] == 0 && musicData[1] == 0) {
                return Promise.delay(musicData[2]);
            } else {
                var data = musicData[0] + ',' + musicData[1];
                var delay = parseInt(musicData[1]) + parseInt(musicData[2]);

                return self.serialWrapper.runCommand(80, data).delay(delay);
            }
        }).finally(() => {
            self.lock.release();
        });
    }

    async playErrorBeep() {
        var musicSteps = [
            [self.getNoteFrequency('a'), '1500', '50'],
        ];

        return self.playMusicSteps(musicSteps);
    }

    async playMusic() {
        var musicSteps = [
            [self.getNoteFrequency('a'), '500', '30'],
            [self.getNoteFrequency('a'), '500', '30'],
            [self.getNoteFrequency('a'), '500', '30'],
            [self.getNoteFrequency('f'), '350', '30'],
            [self.getNoteFrequency('cH'), '150', '30'],
            [self.getNoteFrequency('a'), '500', '30'],
            [self.getNoteFrequency('f'), '350', '30'],
            [self.getNoteFrequency('cH'), '150', '30'],
            [self.getNoteFrequency('a'), '150', '30'],
            [0, 0, '150'], //end part one
            [self.getNoteFrequency('eH'), '500', '30'],
            [self.getNoteFrequency('eH'), '500', '30'],
            [self.getNoteFrequency('eH'), '500', '30'],
            [self.getNoteFrequency('fH'), '350', '30'],
            [self.getNoteFrequency('cH'), '150', '30'],
            [self.getNoteFrequency('gS'), '500', '30'],
            [self.getNoteFrequency('f'), '350', '30'],
            [self.getNoteFrequency('cH'), '150', '30'],
            [self.getNoteFrequency('a'), '650', '30'],
            [0, 0, '150'], //end part two
            [self.getNoteFrequency('aH'), '500', '30'],
            [self.getNoteFrequency('a'), '300', '30'],
            [self.getNoteFrequency('a'), '150', '30'],
            [self.getNoteFrequency('aH'), '400', '30'],
            [self.getNoteFrequency('gSH'), '200', '30'],
            [self.getNoteFrequency('gH'), '200', '30'],
            [self.getNoteFrequency('fSH'), '125', '30'],
            [self.getNoteFrequency('fH'), '125', '30'],
            [self.getNoteFrequency('fSH'), '250', '30'],
            [0, 0, '250'], //end part three
            [self.getNoteFrequency('aS'), '250', '30'],
            [self.getNoteFrequency('dSH'), '400', '30'],
            [self.getNoteFrequency('dH'), '200', '30'],
            [self.getNoteFrequency('cSH'), '200', '30'],
            [self.getNoteFrequency('cH'), '125', '30'],
            [self.getNoteFrequency('b'), '125', '30'],
            [self.getNoteFrequency('cH'), '250', '30'],
            [0, 0, '250'], //end part four
        ];

        return self.playMusicSteps(musicSteps);
    }

    setHeaders() {
        var commands = [
            [43, "L,1,96"], //turn on logo and set 96 height
        ];

        return Promise.each(commands, function(line) {
            return self.serialWrapper.runCommand(line[0], line[1]).then(function(res) {
                console.log(res);
            });
        });
    }

    getLastFiscalRecord() {
        return self.serialWrapper.runCommand(64, '0').then(function(res) {
            console.log(res);
        });
    }

    clearDisplay() {
        return self.serialWrapper.runCommand(100, 'asd').then(function(res) {
            console.log(res);
        });
    }

    async getDiagnosticInfo() {
        await self.lock.acquire();

        return self.serialWrapper.runCommand(90, '1').then(function(res) {
            return res.data;
        }).finally(() => {
            self.lock.release();
        });
    }

    filterUndefinedValues(obj) {
        const ret = {};
        Object.keys(obj)
            .filter((key) => obj[key] !== undefined)
            .forEach((key) => ret[key] = obj[key]);
        return ret;
    }

    async getStatus() {
        await self.lock.acquire();

        //74 - command get status
        //W - means to wait for fiscal device to print all buffers
        return self.serialWrapper.runCommand(74, 'W').then(function(res) {
            console.log(res);
        }).finally(() => {
            self.lock.release();
        });

        //return Promise.each(fiskalenBonCommands, function(data) {
        //    return self.serialWrapper.runCommand(data[0], data[1]).then(function(res) {
        //        //console.log('messages');
        //        //console.log(res.messages);
        //        //console.log('status codes');
        //        //console.log(res.responseStatusCodes);
        //        //console.log('data');
        //        //console.log(res.data);

        //        if (res.responseStatusCodes.indexOf(self.serialWrapper.getStatusCodes().get('GENERAL_ERROR')) !== -1) {
        //            return Promise.reject('General error');
        //        } else if (res.responseStatusCodes.indexOf(self.serialWrapper.getStatusCodes().get('SYNTACS_ERROR')) !== -1) {
        //            return Promise.reject('Syntax error');
        //        } else if (res.responseStatusCodes.indexOf(self.serialWrapper.getStatusCodes().get('COMMAND_CANNOT_BE_EXECUTED_IN_CURRENT_STATE')) !== -1) {
        //            return Promise.reject('Cannot be executed');
        //        }
        //    });
        //}).then(function() {
        //    return self.getSaleFiscalNumber();
        //}).then(function(data) {
        //    fiscalSaleData.memory = data;
        //    fiscalSaleData.status = 'ok';

        //    return fiscalSaleData;
        //}).catch(function(error) {
        //    return self.playErrorBeep().then(function() {
        //        return self.cancelFiscalOperation().then(function() {
        //            throw error;
        //        });
        //    });
        //}).finally(() => {
        //    self.lock.release();
        //});
    }

    async checkIfHasUnfinishedFiscalOperationAndAbortIt() {
        return self.serialWrapper.runCommand(76).then(function(res) {
            var splitted = res.data.split(',');
            if (splitted[0] == '1') {
                return self.serialWrapper.runCommand(60); // cancel fiscal operation
            }
        });
    }

    async createSale(options={}) {
        var defaultOptions = {
            'saleItemText': 'Стоки',
            'NSale': null,
            'OpCode': "1",
            'OpPwd': "1",
            'TillNmb': "1",
            'Amount': "0.01",
            'PaidMode': "P",
            'storno': false,
            'stornoData': {
                'docType': '0', //0 operator error, 1 return/replace, 2 lower amount
                'docNumber': '0',
                'docDateTime': '0',
                'fmNumber': '0',
           },
            'lines': [],
        };

        defaultOptions = Object.assign(defaultOptions, this.filterUndefinedValues(options));
        //console.log(defaultOptions);
        //return;

        //NSale Уникален номер на продажба УНП (21 символа CCCCCCCC-CCCC-DDDDDDD
        //формат [0-9A-Zaz]{8}-[0-9A-Za-z]{4}-[0-9]{7} ).
        //Параметърът е задължителен в първия синтаксис на командата.

        //PaidMode Незадължителен код, указващ начина на плащане. Може да има следните стойности:
        //‘P’ - Плащане в брой (по подразбиране);
        //‘N’ - Плащане с кредит;
        //‘C’ - Плащане с дебитна карта;
        //‘D’ - Плащане с НЗОК;
        //‘I’ - Плащане с ваучер;
        //‘J’ - Плащане с купон;

        //Б) ФИСКАЛНИ БОНОВЕ.
        //Първо се отваря фискален бон, регистрират се продажбите, извършва се плащането и накрая бона се затваря.
        //Използват се командите 48 (30H), 49 (31H), 51 (33H), 52 (34H), 53 (35H), 54 (36H), 58 (3AH) и 56 (38H).
        //Накрая на деня се извършва дневен финансов отчет с нулиране (Z-отчет), за да се запише информацията във ФП. Това става с
        //командата 69 (45H).
        var openCommand = [48, "1,1,1"]; //open command without NSale

        if (defaultOptions['NSale']) {
            openCommand = [48, "1,1,"+defaultOptions['NSale']+",1"]; //open command with NSale
        }
        //console.log(openCommand);

        var fiskalenBonCommands = [
            [52, defaultOptions['saleItemText'] + "\t1\t" + defaultOptions['Amount']], //РЕГИСТРИРАНЕ НА ПРОДАЖБА И ПОКАЗВАНЕ НА ДИСПЛЕЯ
            //[92, "3"], //LINES=====
            //[51, "11"], //МЕЖДИННА СУМА
            [53, "\t" + defaultOptions['PaidMode']], //ИЗЧИСЛЯВАНЕ НА СБОР (ТОТАЛ)
            [56, null], //close
            //[49, "\t1\t-100"], //registrirane na prodajba
            //[54, "hello"], //ПЕЧАТАНЕ НА ФИСКАЛЕН СВОБОДЕН ТЕКСТ
            //[58, "-1"], //РЕГИСТРИРАНЕ (ПРОДАЖБА) НА АРТИКУЛ
        ];

        defaultOptions.lines.forEach(function(d) {
            fiskalenBonCommands.unshift([54, d]);
        });

        //create open command
        if (options.storno) {
            //[46, "1,1,DT743818-0008-0000005,1,0,123,2602191309,00000157"],

            var commandData = [];

            //commandData.push(46); //storno command
            commandData.push(1); //operator code
            commandData.push(1); //operator password
            commandData.push(defaultOptions['NSale']);
            commandData.push(defaultOptions['TillNmb']);
            commandData.push(defaultOptions['stornoData']['docType']);
            commandData.push(defaultOptions['stornoData']['docNumber']);
            commandData.push(defaultOptions['stornoData']['docDateTime']);
            commandData.push(defaultOptions['stornoData']['fmNumber']);

            openCommand = [46, commandData.join(',')];

            fiskalenBonCommands.unshift(openCommand);
        } else {
            fiskalenBonCommands.unshift(openCommand);
        }

        var fiscalSaleData = {
            'status': null,
            'memory': null,
        };

        console.log(fiskalenBonCommands);

        await self.lock.acquire();

        await self.checkIfHasUnfinishedFiscalOperationAndAbortIt();

        return Promise.each(fiskalenBonCommands, function(data) {
            return self.serialWrapper.runCommand(data[0], data[1]).then(function(res) {
                console.log('messages');
                console.log(res.messages);
                console.log('status codes');
                console.log(res.responseStatusCodes);
                console.log('data');
                console.log(res.data);

                if (res.responseStatusCodes.indexOf(self.serialWrapper.getStatusCodes().get('GENERAL_ERROR')) !== -1) {
                    return Promise.reject('General error');
                } else if (res.responseStatusCodes.indexOf(self.serialWrapper.getStatusCodes().get('SYNTACS_ERROR')) !== -1) {
                    return Promise.reject('Syntax error');
                } else if (res.responseStatusCodes.indexOf(self.serialWrapper.getStatusCodes().get('COMMAND_CANNOT_BE_EXECUTED_IN_CURRENT_STATE')) !== -1) {
                    return Promise.reject('Cannot be executed');
                }
            });
        }).then(function() {
            return self.getSaleFiscalNumber();
        }).then(function(data) {
            fiscalSaleData.memory = data;
            fiscalSaleData.status = 'ok';

            return fiscalSaleData;
        }).catch(function(error) {
            return self.playErrorBeep().then(function() {
                return self.cancelFiscalOperation().then(function() {
                    throw error;
                });
            });
        }).finally(() => {
            self.lock.release();
        });
    }

    getSaleFiscalNumber() {
        return self.serialWrapper.runCommand(48, '*').then(function(res) {
            return res.data;
        });
    }

    dailyFinancialReport() {
        //Option Незадължителен параметър, управляващ вида на генерирания отчет:
        //‘0’ Отпечатва се Z-отчет. Разпечатката завършва с надпис “ФИСКАЛЕН БОН”.
        //‘2’ Прави се дневен финансов отчет без нулиране (т. е. не се извършва запис във ФП и нулиране на
        //регистрите). Разпечатката завършва с текст “СЛУЖЕБЕН БОН”.
        return self.serialWrapper.runCommand(69, '0').then(function(res) {
        });
    }

    loadPBMLogo(fileLocation, width=384, height=96) {
        //use jpg convertion tool like
        //https://convertio.co/jpg-pbm/
        //to convert from jpg to pbm p4
        var data = fs.readFileSync(fileLocation);

        if (data[0] !== 80 && data[1] !== 52) {
            console.log('Error: failed to load file, must be PBM P4 format!');
            return;
        }

        var lineData = '';
        var lines = [];
        var i = 0;
        var l = 0;
        var r = 0;
        data.forEach(function(bt, k) {
            if (k > 9) {
                var hex = parseInt(bt, 10).toString(16).padStart(2, "0");
                lineData += hex;
                i++;
                r++;
                if (r % (height/2) == 0) {
                    lines.push(l + ',' + lineData);
                    lineData = '';
                    l++;
                    r = 0;
                }
            }
        });

        Promise.each(lines, function(line) {
            return self.serialWrapper.runCommand(115, line).then(function(res) {
                //console.log(res);
            });
        });

        //console.log(lines);
        //console.log(lines);
        //console.log(data);
    }
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

module.exports = API;
