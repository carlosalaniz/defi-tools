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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Web3HttpContractFactory = void 0;
var BaseContractFactory_1 = require("../web3/BaseContractFactory");
var ContractEnum_1 = require("./ContractEnum");
var Web3HttpContractFactory = /** @class */ (function (_super) {
    __extends(Web3HttpContractFactory, _super);
    function Web3HttpContractFactory(host, options) {
        var _this = _super.call(this, host, options) || this;
        _this.contractResgistry = {};
        _this.contractResgistry[ContractEnum_1.ContractEnum.Balancer] = {
            abi: require("./balancer/abi.json"),
            contractAddress: "0xba100000625a3754423978a60c9317c58a424e3D",
            decimals: 18
        };
        _this.contractResgistry[ContractEnum_1.ContractEnum.OneInch] = {
            abi: require("./1inch/abi.json"),
            contractAddress: "0x111111111117dC0aa78b770fA6A738034120C302",
            decimals: 18
        };
        return _this;
    }
    return Web3HttpContractFactory;
}(BaseContractFactory_1.BaseWeb3HttpContractFactory));
exports.Web3HttpContractFactory = Web3HttpContractFactory;
//# sourceMappingURL=Web3HttpContractFactory.js.map