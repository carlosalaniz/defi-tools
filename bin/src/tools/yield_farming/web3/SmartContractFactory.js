"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.YFSmartContractFactory = void 0;
var ContractEnum_1 = require("../../../lib/common/defi/ContractEnum");
var YFBalancer_1 = require("./YFBalancer");
var YFSmartContractFactory = /** @class */ (function () {
    function YFSmartContractFactory(host, options) {
        this._host = host;
        this._options = options;
    }
    YFSmartContractFactory.prototype.getYFSmartContract = function (YFSmartContract) {
        switch (YFSmartContract) {
            case ContractEnum_1.ContractEnum.Balancer:
                return new YFBalancer_1.YFBalancer(this._host, this._options);
            default:
                throw "Contract " + YFSmartContract + " not defined.";
        }
    };
    return YFSmartContractFactory;
}());
exports.YFSmartContractFactory = YFSmartContractFactory;
//# sourceMappingURL=SmartContractFactory.js.map