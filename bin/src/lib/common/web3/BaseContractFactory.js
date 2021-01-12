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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseWeb3HttpContractFactory = void 0;
var web3_1 = __importDefault(require("web3"));
var BaseWeb3EthContractFactory = /** @class */ (function () {
    function BaseWeb3EthContractFactory() {
    }
    BaseWeb3EthContractFactory.prototype.getContractInteface = function (contractName) {
        var contractInformation = this.contractResgistry[contractName];
        if (contractInformation) {
            return {
                contract: new this.web3Provider.eth.Contract(contractInformation.abi, contractInformation.contractAddress),
                decimals: contractInformation.decimals
            };
        }
        throw "Contract " + contractName + " not defined.";
    };
    return BaseWeb3EthContractFactory;
}());
var BaseWeb3HttpContractFactory = /** @class */ (function (_super) {
    __extends(BaseWeb3HttpContractFactory, _super);
    function BaseWeb3HttpContractFactory(host, options) {
        var _this = _super.call(this) || this;
        _this.web3Provider = new web3_1.default(new web3_1.default.providers.HttpProvider(host, options));
        return _this;
    }
    return BaseWeb3HttpContractFactory;
}(BaseWeb3EthContractFactory));
exports.BaseWeb3HttpContractFactory = BaseWeb3HttpContractFactory;
//# sourceMappingURL=BaseContractFactory.js.map