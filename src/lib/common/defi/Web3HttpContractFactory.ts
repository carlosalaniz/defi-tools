import { BaseWeb3HttpContractFactory, ContractRegistry } from "../web3/BaseContractFactory";
import { HttpProviderOptions } from "web3-core-helpers";
import { ContractEnum } from "./ContractEnum";


export class Web3HttpContractFactory extends BaseWeb3HttpContractFactory {
    contractResgistry: ContractRegistry;
    constructor(host: string, options?: HttpProviderOptions) {
        super(host, options);
        this.contractResgistry = {};
        this.contractResgistry[ContractEnum.Balancer] = {
            abi: require("./balancer/abi.json")
        };
        this.contractResgistry[ContractEnum.OneInch] = {
            abi: require("./1inch/abi.json")
        }
    }
}
