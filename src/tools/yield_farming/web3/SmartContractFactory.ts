import { ContractEnum } from "../../../lib/common/defi/ContractEnum";
import { HttpProviderOptions } from "web3-core-helpers";
import { YFBalancer } from "./YFBalancer";
import { YFQSwap } from "./YFQSwap";

export class YFSmartContractFactory {
    private _host: string;
    private _options?: HttpProviderOptions;
    constructor(host: string, options?: HttpProviderOptions) {
        this._host = host;
        this._options = options;
    }
    public getYFSmartContract(YFSmartContract: ContractEnum, contractAddress: string):
        YFBalancer | YFQSwap {
        switch (YFSmartContract) {
            case ContractEnum.Balancer:
                return new YFBalancer(contractAddress, this._host, this._options);
            case ContractEnum.QuickSwap:
                return new YFQSwap(contractAddress, this._host, this._options);
            default:
                throw `Contract ${YFSmartContract} not defined.`
        }
    }
}