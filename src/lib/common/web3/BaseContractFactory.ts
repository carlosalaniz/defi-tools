import Web3 from "web3";
import { Contract } from "web3-eth-contract";
import { HttpProviderOptions } from "web3-core-helpers";
import { ContractEnum } from "../defi/ContractEnum";
const ERC20Contract = require('erc20-contract-js');

export type ContractRegistry = {
    [key: string]: {
        abi: any;
    };
}

export type ContractInterface = {
    contract: Contract
}

export interface SmartContractFactoryInterface {
    getContractInteface(contractName: string, contractAddress: string): ContractInterface;
}

abstract class BaseWeb3EthContractFactory implements SmartContractFactoryInterface {
    abstract web3Provider: Web3;
    abstract contractResgistry: ContractRegistry;
    getContractInteface(contractName: ContractEnum, contractAddress: string): ContractInterface {
        let contractInformation = this.contractResgistry[contractName];
        if (contractInformation) {
            return {
                contract: new this.web3Provider.eth.Contract(contractInformation.abi, contractAddress)
            }
        }
        throw `Contract ${contractName} not defined.`
    }
    
    getERC20TokenInterface(address: string) {
        return new ERC20Contract(this.web3Provider, address)
    }
}

export abstract class BaseWeb3HttpContractFactory extends BaseWeb3EthContractFactory {
    web3Provider: Web3;
    constructor(host: string, options?: HttpProviderOptions) {
        super();
        this.web3Provider = new Web3(new Web3.providers.HttpProvider(host, options));
    }
}