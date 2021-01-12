"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitorModel = exports.TransactionModel = exports.MonitorUserModel = exports.MonitorUser = exports.Monitor = exports.Transaction = exports.FTXMonitorExchangeCredentials = exports.MonitorExchangeCredentials = exports.MonitorTradeSettings = void 0;
var typegoose_1 = require("@typegoose/typegoose");
var defaultClasses_1 = require("@typegoose/typegoose/lib/defaultClasses");
var database_1 = require("../../lib/common/database");
var ContractEnum_1 = require("../../lib/common/defi/ContractEnum");
var HttpExchangeInterfaces_1 = require("../../lib/common/exchanges/HttpExchangeInterfaces");
//#region SUBDOCUMENTS
var MonitorTradeSettings = /** @class */ (function () {
    function MonitorTradeSettings() {
    }
    __decorate([
        typegoose_1.prop(),
        __metadata("design:type", Number)
    ], MonitorTradeSettings.prototype, "tradeMinimumAmount", void 0);
    __decorate([
        typegoose_1.prop(),
        __metadata("design:type", Number)
    ], MonitorTradeSettings.prototype, "tradeMaxminumAmount", void 0);
    __decorate([
        typegoose_1.prop(),
        __metadata("design:type", Number)
    ], MonitorTradeSettings.prototype, "refreshRateSeconds", void 0);
    return MonitorTradeSettings;
}());
exports.MonitorTradeSettings = MonitorTradeSettings;
var MonitorExchangeCredentials = /** @class */ (function () {
    function MonitorExchangeCredentials() {
    }
    __decorate([
        typegoose_1.prop({ ref: "ExchangeCredentials", required: true }),
        __metadata("design:type", Object)
    ], MonitorExchangeCredentials.prototype, "exchangeCredentials", void 0);
    __decorate([
        typegoose_1.prop({ required: true }),
        __metadata("design:type", String)
    ], MonitorExchangeCredentials.prototype, "market", void 0);
    __decorate([
        typegoose_1.prop(),
        __metadata("design:type", Number)
    ], MonitorExchangeCredentials.prototype, "positionDistributionPercentage", void 0);
    return MonitorExchangeCredentials;
}());
exports.MonitorExchangeCredentials = MonitorExchangeCredentials;
var FTXMonitorExchangeCredentials = /** @class */ (function (_super) {
    __extends(FTXMonitorExchangeCredentials, _super);
    function FTXMonitorExchangeCredentials() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    __decorate([
        typegoose_1.prop(),
        __metadata("design:type", String)
    ], FTXMonitorExchangeCredentials.prototype, "subaccount", void 0);
    return FTXMonitorExchangeCredentials;
}(MonitorExchangeCredentials));
exports.FTXMonitorExchangeCredentials = FTXMonitorExchangeCredentials;
//#endregion 
//#region ENUMS
var MonitorStatus;
(function (MonitorStatus) {
    MonitorStatus["Running"] = "running";
    MonitorStatus["Stopped"] = "stopped";
    MonitorStatus["AwaitingUserAction"] = "awaitinguseraction";
})(MonitorStatus || (MonitorStatus = {}));
var Transaction = /** @class */ (function (_super) {
    __extends(Transaction, _super);
    function Transaction() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    __decorate([
        typegoose_1.prop({
            type: function () { return MonitorExchangeCredentials; },
        }),
        __metadata("design:type", Object)
    ], Transaction.prototype, "exchangeCredentials", void 0);
    __decorate([
        typegoose_1.prop({ ref: 'Monitor' }),
        __metadata("design:type", Object)
    ], Transaction.prototype, "_monitor", void 0);
    __decorate([
        typegoose_1.prop({ enum: HttpExchangeInterfaces_1.TransactionsSide }),
        __metadata("design:type", String)
    ], Transaction.prototype, "side", void 0);
    __decorate([
        typegoose_1.prop(),
        __metadata("design:type", Number)
    ], Transaction.prototype, "size", void 0);
    __decorate([
        typegoose_1.prop(),
        __metadata("design:type", Number)
    ], Transaction.prototype, "beforePosition", void 0);
    __decorate([
        typegoose_1.prop(),
        __metadata("design:type", Number)
    ], Transaction.prototype, "afterPosition", void 0);
    __decorate([
        typegoose_1.prop({ enum: HttpExchangeInterfaces_1.TransactionStatusEnum }),
        __metadata("design:type", String)
    ], Transaction.prototype, "status", void 0);
    return Transaction;
}(defaultClasses_1.TimeStamps));
exports.Transaction = Transaction;
var Monitor = /** @class */ (function (_super) {
    __extends(Monitor, _super);
    function Monitor() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    __decorate([
        typegoose_1.prop({
            type: function () { return MonitorExchangeCredentials; },
        }),
        __metadata("design:type", Array)
    ], Monitor.prototype, "exchangeCredentials", void 0);
    __decorate([
        typegoose_1.prop({ type: function () { return MonitorTradeSettings; } }),
        __metadata("design:type", MonitorTradeSettings)
    ], Monitor.prototype, "tradeSettings", void 0);
    __decorate([
        typegoose_1.prop({ enum: ContractEnum_1.ContractEnum }),
        __metadata("design:type", String)
    ], Monitor.prototype, "contractName", void 0);
    __decorate([
        typegoose_1.prop(),
        __metadata("design:type", String)
    ], Monitor.prototype, "web3HttpConnectionString", void 0);
    __decorate([
        typegoose_1.prop(),
        __metadata("design:type", String)
    ], Monitor.prototype, "walletAddress", void 0);
    __decorate([
        typegoose_1.prop(),
        __metadata("design:type", String)
    ], Monitor.prototype, "targetAssetAddress", void 0);
    __decorate([
        typegoose_1.prop(),
        __metadata("design:type", String)
    ], Monitor.prototype, "state", void 0);
    __decorate([
        typegoose_1.prop(),
        __metadata("design:type", String)
    ], Monitor.prototype, "reason", void 0);
    __decorate([
        typegoose_1.prop({ ref: 'Transaction' }),
        __metadata("design:type", Array)
    ], Monitor.prototype, "transactions", void 0);
    __decorate([
        typegoose_1.prop({ enum: MonitorStatus }),
        __metadata("design:type", String)
    ], Monitor.prototype, "status", void 0);
    return Monitor;
}(defaultClasses_1.TimeStamps));
exports.Monitor = Monitor;
var MonitorUser = /** @class */ (function (_super) {
    __extends(MonitorUser, _super);
    function MonitorUser() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    __decorate([
        typegoose_1.prop({ ref: 'Monitor' }),
        __metadata("design:type", Array)
    ], MonitorUser.prototype, "monitors", void 0);
    __decorate([
        typegoose_1.prop({ type: function () { return [String]; } }),
        __metadata("design:type", Array)
    ], MonitorUser.prototype, "jobs", void 0);
    __decorate([
        typegoose_1.prop({ ref: "ExchangeCredentials" }),
        __metadata("design:type", Array)
    ], MonitorUser.prototype, "exchangeCredentials", void 0);
    return MonitorUser;
}(database_1.User));
exports.MonitorUser = MonitorUser;
// public nest: Nested;
//#endregion
exports.MonitorUserModel = typegoose_1.getDiscriminatorModelForClass(database_1.UserModel, MonitorUser);
exports.TransactionModel = typegoose_1.getModelForClass(Transaction);
exports.MonitorModel = typegoose_1.getModelForClass(Monitor);
//# sourceMappingURL=database.js.map