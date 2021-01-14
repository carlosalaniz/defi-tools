import { Web3HttpContractFactory } from "../../../lib/common/defi/Web3HttpContractFactory";
import { HttpProviderOptions } from "web3-core-helpers";

import { GetAssetsBalanceInterface, GetAssetsBalanceResult, GetHedgeTargetInterface } from "./SmartContractIntefaces";
import { ContractInterface } from "../../../lib/common/web3/BaseContractFactory";
import { ContractEnum } from "../../../lib/common/defi/ContractEnum";

export class YFBalancer implements GetHedgeTargetInterface, GetAssetsBalanceInterface {
    private _contractInterface: ContractInterface;
    constructor(contractAddress: string, host: string, options?: HttpProviderOptions | undefined) {
        const _web3HttpContractFactory = new Web3HttpContractFactory(host, options);
        this._contractInterface = _web3HttpContractFactory.getContractInteface(ContractEnum.Balancer, contractAddress);
    }
    private async getAssetsAddress(): Promise<string[]> {
        let contract = this._contractInterface.contract;
        return await contract.methods.getCurrentTokens().call();
    }

    async TryGetAssetsBalanceAsync(walletAddress: string): Promise<GetAssetsBalanceResult[]> {
        let assetAddressArray = await this.getAssetsAddress();
        return await Promise.all(assetAddressArray.map(async assetAddress => {
            let result = {} as GetAssetsBalanceResult;
            result.asset_address = assetAddress;
            result.balance = await this.tryGetAssetBalanceAsync(walletAddress, assetAddress);
            return result;
        }))
    }
    
    private async tryGetAssetBalanceAsync(walletAddress: string, tokenAddress: string): Promise<number> {
        let contract = this._contractInterface.contract;
        let decimals = this._contractInterface.decimals;

        let poolTokenBalance = +await contract.methods.getBalance(tokenAddress).call();
        let totalShares = +await contract.methods.totalSupply().call();
        let walletBalance = +await contract.methods.balanceOf(walletAddress).call();

        let rawBalance = (poolTokenBalance / totalShares) * walletBalance;
        let balance = rawBalance / Math.pow(10, decimals);

        return balance;
    }

    async tryGetHedgeTargetAsync(walletAddress: string, tokenAddress: string): Promise<number> {
        return await this.tryGetAssetBalanceAsync(walletAddress, tokenAddress);
    }
}