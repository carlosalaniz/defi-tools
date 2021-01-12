"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitorProcess = exports.InitMessage = exports.MonitorErrorsEnum = exports.MessageTypeEnum = void 0;
var database_1 = require("../../../lib/common/database");
var binanace_1 = __importDefault(require("../../../lib/common/exchanges/binance/binanace"));
var ftx_1 = __importDefault(require("../../../lib/common/exchanges/ftx/ftx"));
var HttpExchangeInterfaces_1 = require("../../../lib/common/exchanges/HttpExchangeInterfaces");
var database_2 = require("../database");
var SmartContractFactory_1 = require("../web3/SmartContractFactory");
//#region Enums and interfaces
//#region Enums
var MessageTypeEnum;
(function (MessageTypeEnum) {
    MessageTypeEnum[MessageTypeEnum["MonitorStoped"] = 0] = "MonitorStoped";
    MessageTypeEnum[MessageTypeEnum["NewTransaction"] = 1] = "NewTransaction";
    MessageTypeEnum[MessageTypeEnum["MonitorStarted"] = 2] = "MonitorStarted";
})(MessageTypeEnum = exports.MessageTypeEnum || (exports.MessageTypeEnum = {}));
var MonitorErrorsEnum;
(function (MonitorErrorsEnum) {
    MonitorErrorsEnum[MonitorErrorsEnum["BadConfiguration"] = 0] = "BadConfiguration";
    MonitorErrorsEnum[MonitorErrorsEnum["UnexpectedError"] = 1] = "UnexpectedError";
    MonitorErrorsEnum[MonitorErrorsEnum["TradeLimitReached"] = 2] = "TradeLimitReached";
})(MonitorErrorsEnum = exports.MonitorErrorsEnum || (exports.MonitorErrorsEnum = {}));
//#region Message Types
var NewTransactionMessage = /** @class */ (function () {
    function NewTransactionMessage(transaction) {
        this.type = MessageTypeEnum.NewTransaction;
        this.payload = transaction;
    }
    return NewTransactionMessage;
}());
var MonitorStoppedMessage = /** @class */ (function () {
    function MonitorStoppedMessage() {
        this.type = MessageTypeEnum.MonitorStoped;
        this.payload = undefined;
        this.commandReply = true;
    }
    return MonitorStoppedMessage;
}());
var MonitorError = /** @class */ (function () {
    function MonitorError(type, error) {
        this.type = type;
        this.payload = error;
    }
    return MonitorError;
}());
var MonitorStarted = /** @class */ (function () {
    function MonitorStarted() {
        this.type = MessageTypeEnum.MonitorStarted;
        this.payload = "OK";
    }
    return MonitorStarted;
}());
var InitMessage = /** @class */ (function () {
    function InitMessage(payload) {
        this.action = "init";
        this.payload = payload;
    }
    return InitMessage;
}());
exports.InitMessage = InitMessage;
//#endregion
var MonitorProcess = /** @class */ (function () {
    function MonitorProcess(process) {
        this._stopFlag = false;
        this._errorFlag = false;
        if (process.send) {
            this._process = process;
        }
        else {
            throw "This class is meant to be ivoked with a forked process.";
        }
        // register events
        this._process.on("message", this.OnMessageEventHandler);
        this.SendMessage({
            action: "messageout",
            type: "success",
            payload: new MonitorStarted()
        });
        console.log("process running.");
    }
    //#region Main Methods
    MonitorProcess.prototype.getTotalPositionAsync = function () {
        return __awaiter(this, void 0, void 0, function () {
            var position, i, exchangeObj, exchangePosition;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        position = 0;
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < this._exchanges.length)) return [3 /*break*/, 4];
                        exchangeObj = this._exchanges[i];
                        return [4 /*yield*/, exchangeObj.exchange.tryGetBalanceAsync(exchangeObj.market)];
                    case 2:
                        exchangePosition = _a.sent();
                        if (exchangePosition > 0) {
                            throw exchangeObj.exchange.exchangeName + " position for market " + exchangeObj.market + " account " + this._monitor.walletAddress + " is incorrect. Net position: " + exchangePosition + " should be negative (SHORT)";
                        }
                        position += exchangePosition;
                        _a.label = 3;
                    case 3:
                        i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, position];
                }
            });
        });
    };
    MonitorProcess.prototype.tryPlaceDistributedOrderAsync = function (amount, side) {
        return __awaiter(this, void 0, void 0, function () {
            var totalDistribution, error, i, exchangeObj, positionDistributionPercentage, ordersize, currentPosition, latestPosition, transaction, exchangeCredentials;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        totalDistribution = this._exchanges.reduce(function (accumulator, currentValue) {
                            var distributionPercentage = currentValue.positionDistributionPercentage;
                            return accumulator + (distributionPercentage ? distributionPercentage : 0);
                        }, 0);
                        if (totalDistribution !== 1) {
                            error = "Monitor " + this._monitor._id + " exchange position distributions are invalid, " + totalDistribution + " should be equal to 1";
                            this.SendMessage({
                                action: "messageout",
                                type: "error",
                                payload: new MonitorError(MonitorErrorsEnum.UnexpectedError, error)
                            });
                            throw error;
                        }
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < this._exchanges.length)) return [3 /*break*/, 6];
                        exchangeObj = this._exchanges[i];
                        positionDistributionPercentage = (exchangeObj.positionDistributionPercentage || 0);
                        ordersize = amount * positionDistributionPercentage;
                        if (!(ordersize > 0)) return [3 /*break*/, 5];
                        return [4 /*yield*/, exchangeObj.exchange.tryGetBalanceAsync(exchangeObj.market)];
                    case 2:
                        currentPosition = _a.sent();
                        return [4 /*yield*/, exchangeObj.exchange.tryPlaceFuturesMarketOrderAsync(ordersize, side, exchangeObj.market)];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, exchangeObj.exchange.tryGetBalanceAsync(exchangeObj.market)];
                    case 4:
                        latestPosition = _a.sent();
                        transaction = new database_2.TransactionModel().toObject();
                        exchangeCredentials = __assign({}, exchangeObj);
                        delete exchangeCredentials.exchange;
                        transaction.exchangeCredentials = exchangeCredentials;
                        transaction._monitor = this._monitor._id;
                        transaction.side = side;
                        transaction.size = amount;
                        transaction.beforePosition = currentPosition;
                        transaction.afterPosition = latestPosition;
                        transaction.status = HttpExchangeInterfaces_1.TransactionStatusEnum.Complete;
                        this.SendMessage({
                            action: "messageout",
                            type: "success",
                            payload: new NewTransactionMessage(transaction)
                        });
                        _a.label = 5;
                    case 5:
                        i++;
                        return [3 /*break*/, 1];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    MonitorProcess.prototype.LoopBody = function () {
        return __awaiter(this, void 0, void 0, function () {
            var tradeMax, tradeMin, rawHedgeTarget, error, position, delta, absDelta, refreshRateSeconds;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tradeMax = this._monitor.tradeSettings.tradeMaxminumAmount;
                        tradeMin = this._monitor.tradeSettings.tradeMinimumAmount;
                        return [4 /*yield*/, this._contract.tryGetHedgeTargetAsync(this._monitor.walletAddress, this._monitor.targetAssetAddress)];
                    case 1:
                        rawHedgeTarget = _a.sent();
                        if (rawHedgeTarget < 0) {
                            error = "Hedge target for token " + this._monitor.targetAssetAddress + " in wallet " + this._monitor.walletAddress + " is incorrect. Hedge target: " + rawHedgeTarget + " should be positive (LONG)";
                            this.SendMessage({
                                action: "messageout",
                                type: "error",
                                payload: new MonitorError(MonitorErrorsEnum.UnexpectedError, error)
                            });
                            this._stopFlag = true;
                            this._errorFlag = true;
                            throw error;
                        }
                        return [4 /*yield*/, this.getTotalPositionAsync()];
                    case 2:
                        position = _a.sent();
                        delta = +(rawHedgeTarget + position).toFixed(2);
                        absDelta = Math.abs(delta);
                        if (!(absDelta > 0)) return [3 /*break*/, 8];
                        if (!(absDelta >= tradeMin && absDelta <= tradeMax)) return [3 /*break*/, 7];
                        if (!(delta > 0)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.tryPlaceDistributedOrderAsync(absDelta, HttpExchangeInterfaces_1.TransactionsSide.Buy)];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 4: return [4 /*yield*/, this.tryPlaceDistributedOrderAsync(absDelta, HttpExchangeInterfaces_1.TransactionsSide.Sell)];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        this.SendMessage({
                            action: "messageout",
                            type: "error",
                            payload: new MonitorError(MonitorErrorsEnum.TradeLimitReached, "absDelta >= tradeMin : " + (absDelta >= tradeMin) + " absDelta <= tradeMax: " + (absDelta <= tradeMax))
                        });
                        this._stopFlag = true;
                        this._errorFlag = true;
                        _a.label = 8;
                    case 8:
                        //#endregion 
                        if (!this._stopFlag) {
                            refreshRateSeconds = this._monitor.tradeSettings.refreshRateSeconds;
                            setTimeout(this.LoopBody, refreshRateSeconds);
                        }
                        else {
                            if (!this._errorFlag) {
                                this.SendMessage({
                                    action: "messageout",
                                    type: "success",
                                    payload: new MonitorStoppedMessage()
                                });
                            }
                            return [2 /*return*/, this._process.exit()];
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    //#endregion
    //#region Event handling
    MonitorProcess.prototype.SendMessage = function (message) {
        if (this._process.send) {
            this._process.send(message);
        }
    };
    MonitorProcess.prototype.OnMessageEventHandler = function (message) {
        switch (message.action) {
            case "init":
                this.Init(message.payload);
                break;
            case "command":
                var payload = message.payload;
                switch (payload.command) {
                    case "stop":
                        this._stopFlag = true;
                        break;
                }
                break;
        }
    };
    MonitorProcess.prototype.Init = function (initparamaters) {
        this._monitor = initparamaters.monitor;
        this._contract = new SmartContractFactory_1.YFSmartContractFactory(this._monitor.web3HttpConnectionString)
            .getYFSmartContract(this._monitor.contractName);
        this._exchanges = initparamaters.monitorExchangeCredentials
            .map(function (exchangeCredentials) {
            var exchange = undefined;
            var monitorExchangeCredentials = initparamaters.monitor.exchangeCredentials.filter(function (cred) { return cred.exchangeCredentials === exchangeCredentials._id; }).pop();
            if (monitorExchangeCredentials) {
                switch (exchangeCredentials.exchangeName) {
                    case database_1.ExchangeNames.BINANCE:
                        exchange = new binanace_1.default(exchangeCredentials.apikey, exchangeCredentials.apisecret);
                        break;
                    case database_1.ExchangeNames.FTX:
                        var ftxMonitorExchangeCredentials = monitorExchangeCredentials;
                        exchange = new ftx_1.default(exchangeCredentials.apikey, exchangeCredentials.apisecret, ftxMonitorExchangeCredentials.subaccount);
                        break;
                    default:
                        throw exchangeCredentials.exchangeName + "Not recognized";
                }
                return __assign({ exchange: exchange }, monitorExchangeCredentials);
            }
            throw "monitorExchangeCredentials not found";
        });
        //Start monitor loop
        this.LoopBody();
    };
    return MonitorProcess;
}());
exports.MonitorProcess = MonitorProcess;
new MonitorProcess(process);
//# sourceMappingURL=MonitorProcess.js.map