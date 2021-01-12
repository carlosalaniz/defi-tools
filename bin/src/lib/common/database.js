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
exports.BinanceExchangeCredentialsModel = exports.FTXExchangeCredentialsModel = exports.ExchangeCredentialsModel = exports.UserModel = exports.BinanceExchangeCredentials = exports.FTXExchangeCredentials = exports.ExchangeCredentials = exports.User = exports.ExchangeNames = void 0;
require("reflect-metadata");
var defaultClasses_1 = require("@typegoose/typegoose/lib/defaultClasses");
var typegoose_1 = require("@typegoose/typegoose");
var ExchangeNames;
(function (ExchangeNames) {
    ExchangeNames["FTX"] = "FTX";
    ExchangeNames["BINANCE"] = "BINANCE";
})(ExchangeNames = exports.ExchangeNames || (exports.ExchangeNames = {}));
var User = /** @class */ (function (_super) {
    __extends(User, _super);
    function User() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    __decorate([
        typegoose_1.prop({ lowercase: true, index: true, unique: true }),
        __metadata("design:type", String)
    ], User.prototype, "email", void 0);
    __decorate([
        typegoose_1.prop(),
        __metadata("design:type", String)
    ], User.prototype, "password", void 0);
    return User;
}(defaultClasses_1.TimeStamps));
exports.User = User;
var ExchangeCredentials = /** @class */ (function (_super) {
    __extends(ExchangeCredentials, _super);
    function ExchangeCredentials() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    __decorate([
        typegoose_1.prop({ required: true }),
        __metadata("design:type", String)
    ], ExchangeCredentials.prototype, "exchangeName", void 0);
    __decorate([
        typegoose_1.prop({ unique: true, required: true }),
        __metadata("design:type", String)
    ], ExchangeCredentials.prototype, "apikey", void 0);
    __decorate([
        typegoose_1.prop({ unique: true, required: true }),
        __metadata("design:type", String)
    ], ExchangeCredentials.prototype, "apisecret", void 0);
    ExchangeCredentials = __decorate([
        typegoose_1.index({ apikey: 1, apisecret: 1 }, { unique: true }),
        typegoose_1.modelOptions({
            schemaOptions: {
                discriminatorKey: 'exchangeName'
            }
        })
    ], ExchangeCredentials);
    return ExchangeCredentials;
}(defaultClasses_1.TimeStamps));
exports.ExchangeCredentials = ExchangeCredentials;
var FTXExchangeCredentials = /** @class */ (function (_super) {
    __extends(FTXExchangeCredentials, _super);
    function FTXExchangeCredentials() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    __decorate([
        typegoose_1.prop({ required: true }),
        __metadata("design:type", Array)
    ], FTXExchangeCredentials.prototype, "subaccounts", void 0);
    return FTXExchangeCredentials;
}(ExchangeCredentials));
exports.FTXExchangeCredentials = FTXExchangeCredentials;
var BinanceExchangeCredentials = /** @class */ (function (_super) {
    __extends(BinanceExchangeCredentials, _super);
    function BinanceExchangeCredentials() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return BinanceExchangeCredentials;
}(ExchangeCredentials));
exports.BinanceExchangeCredentials = BinanceExchangeCredentials;
exports.UserModel = typegoose_1.getModelForClass(User); // UserModel is a regular Mongoose Model with correct types
exports.ExchangeCredentialsModel = typegoose_1.getModelForClass(ExchangeCredentials); // UserModel is a regular Mongoose Model with correct types
exports.FTXExchangeCredentialsModel = typegoose_1.getDiscriminatorModelForClass(exports.ExchangeCredentialsModel, FTXExchangeCredentials);
exports.BinanceExchangeCredentialsModel = typegoose_1.getDiscriminatorModelForClass(exports.ExchangeCredentialsModel, BinanceExchangeCredentials);
//# sourceMappingURL=database.js.map