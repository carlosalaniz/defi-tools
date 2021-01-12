import { Web3HttpContractFactory } from "../../../lib/common/defi/Web3HttpContractFactory";
import { HttpProviderOptions } from "web3-core-helpers";

import { GetHedgeTargetInterface } from "./SmartContractIntefaces";
import { ContractInterface } from "../../../lib/common/web3/BaseContractFactory";
import { ContractEnum } from "../../../lib/common/defi/ContractEnum";

export class YFBalancer implements GetHedgeTargetInterface {
    private _contractInterface: ContractInterface;
    constructor(contractAddress: string, host: string, options?: HttpProviderOptions | undefined) {
        const _web3HttpContractFactory = new Web3HttpContractFactory(host, options);
        this._contractInterface = _web3HttpContractFactory.getContractInteface(ContractEnum.Balancer, contractAddress);
    }

    async tryGetHedgeTargetAsync(walletAddress: string, tokenAddress: string): Promise<number> {
        let contract = this._contractInterface.contract;
        let decimals = this._contractInterface.decimals;

        let poolTokenBalance = +await contract.methods.getBalance(tokenAddress).call();
        let totalShares = +await contract.methods.totalSupply().call();
        let walletBalance = +await contract.methods.balanceOf(walletAddress).call();

        let rawBalance = (poolTokenBalance / totalShares) * walletBalance;
        let balance = rawBalance / Math.pow(10, decimals);

        return balance;
    }
}