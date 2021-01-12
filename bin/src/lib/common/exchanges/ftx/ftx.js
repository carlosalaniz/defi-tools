"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
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
var axios_1 = __importDefault(require("axios"));
var crypto = __importStar(require("crypto"));
var FTXExchange = /** @class */ (function () {
    function FTXExchange(apikey, apisecret, subaccount) {
        this.exchangeName = "FTX";
        this.stableAssetMap = {
            "USD": "USDC"
        };
        this.apisecret = apisecret;
        var headers = {
            'FTX-KEY': apikey,
            'X-Requested-With': 'XMLHttpRequest',
            'content-type': 'application/json'
        };
        if (subaccount) {
            headers['FTX-SUBACCOUNT'] = encodeURI(subaccount);
        }
        this.api = axios_1.default.create({
            baseURL: 'https://ftx.com',
            headers: headers
        });
    }
    FTXExchange.prototype.signPayload = function (time, method, api_enpoint, body) {
        var hmac = crypto.createHmac('sha256', this.apisecret);
        var payload = "";
        if (method === "get") {
            payload = "" + time + method + api_enpoint;
        }
        else if (method === 'post') {
            payload = "" + time + method + api_enpoint + body;
        }
        hmac.update(payload);
        return hmac.digest("hex");
    };
    FTXExchange.prototype.tryGetAccountInformation = function (subaccount) {
        return __awaiter(this, void 0, void 0, function () {
            var path, time, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        path = "/api/account";
                        time = +new Date();
                        return [4 /*yield*/, this.api.get(path, {
                                headers: {
                                    'FTX-TS': time.toString(),
                                    'FTX-SIGN': this.signPayload(time, "get", path)
                                }
                            })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data.result];
                }
            });
        });
    };
    FTXExchange.prototype.tryCheckExchangeRatesInterfaceAsync = function (mi, mo) {
        return __awaiter(this, void 0, void 0, function () {
            var marketin, marketout, spot, path, time, response, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        marketin = this.stableAssetMap[mi] || mi;
                        marketout = this.stableAssetMap[mo] || mo;
                        spot = marketin + "/" + marketout;
                        path = "/api/markets/" + spot;
                        time = +new Date();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.api.get(path, {
                                headers: {
                                    'FTX-TS': time.toString(),
                                    'FTX-SIGN': this.signPayload(time, "get", path)
                                }
                            })];
                    case 2:
                        response = _a.sent();
                        return [2 /*return*/, response.data.result.price || -1];
                    case 3:
                        e_1 = _a.sent();
                        if (e_1 && e_1.response.status === 404) {
                            throw {
                                path: path,
                                error: e_1.response.data.s
                            };
                        }
                        throw e_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    FTXExchange.prototype.tryGetBalanceAsync = function (market) {
        return __awaiter(this, void 0, void 0, function () {
            var path, time, response, futurePosition;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        path = "/api/positions";
                        time = +new Date();
                        return [4 /*yield*/, this.api.get(path, {
                                headers: {
                                    'FTX-TS': time.toString(),
                                    'FTX-SIGN': this.signPayload(time, "get", path)
                                }
                            })];
                    case 1:
                        response = _a.sent();
                        futurePosition = response.data.result.filter(function (p) { return p.future === market; }).pop();
                        if (futurePosition) {
                            return [2 /*return*/, futurePosition.netSize];
                        }
                        else {
                            throw response;
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    FTXExchange.prototype.tryPlaceFuturesMarketOrderAsync = function (amount, side, market) {
        return __awaiter(this, void 0, void 0, function () {
            var path, payload, time, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        path = "/api/orders";
                        payload = {
                            "market": market,
                            "side": side,
                            "type": "market",
                            "size": amount
                        };
                        time = +new Date();
                        return [4 /*yield*/, this.api.post(path, payload, {
                                headers: {
                                    'FTX-TS': time.toString(),
                                    'FTX-SIGN': this.signPayload(time, "post", path, JSON.stringify(payload))
                                }
                            })];
                    case 1:
                        response = _a.sent();
                        console.log("payload", payload);
                        console.log("response", response.data);
                        return [2 /*return*/];
                }
            });
        });
    };
    return FTXExchange;
}());
exports.default = FTXExchange;
//# sourceMappingURL=ftx.js.map