import { Web3HttpContractFactory } from "../../../lib/common/defi/Web3HttpContractFactory";
import { HttpProviderOptions } from "web3-core-helpers";

import { GetAssetsBalanceInterface, GetAssetsBalanceResult, GetHedgeTargetInterface } from "./SmartContractIntefaces";
import { ContractInterface } from "../../../lib/common/web3/BaseContractFactory";
import { ContractEnum } from "../../../lib/common/defi/ContractEnum";

export class YFQSwap implements GetHedgeTargetInterface, GetAssetsBalanceInterface {
    public _contractInterface: ContractInterface;
    private _web3HttpContractFactory: Web3HttpContractFactory;
    private stakeAddress: string;
    constructor(contractAddress: string, host: string, options?: HttpProviderOptions | undefined) {
        this.stakeAddress = "0x6c6920ad61867b86580ff4afb517bec7a499a7bb";
        this._web3HttpContractFactory = new Web3HttpContractFactory(host, options);
        this._contractInterface = this._web3HttpContractFactory.getContractInteface(ContractEnum.QuickSwap, contractAddress);
    }
    private async getAssetsAddress(): Promise<string[]> {
        let contract = this._contractInterface.contract;
        return [
            await contract.methods.token0().call(),
            await contract.methods.token1().call()
        ]
    }

    async TryGetAssetsBalanceAsync(walletAddress: string): Promise<GetAssetsBalanceResult[]> {
        let contract = this._contractInterface.contract;
        let assetAddressArray = await this.getAssetsAddress();
        let reserves = await contract.methods.getReserves().call();
        let totalShares = +await contract.methods.totalSupply().call();
        return [{
            asset_address: assetAddressArray[0],
            balance: await this.tryGetAssetBalanceAsync(
                walletAddress,
                assetAddressArray[0],
                +reserves[0],
                totalShares
            )
        },
        {
            asset_address: assetAddressArray[1],
            balance: await this.tryGetAssetBalanceAsync(
                walletAddress,
                assetAddressArray[1],
                +reserves[1],
                totalShares
            )
        }]
    }

    private async tryGetAssetBalanceAsync(
        walletAddress: string,
        tokenAddress: string,
        reserve: number,
        totalShares: number
    ): Promise<number> {
        let decimals = +await this._web3HttpContractFactory.getERC20TokenInterface(tokenAddress).decimals().call()
        let walletBalance = +await this._web3HttpContractFactory
            .getERC20TokenInterface(this.stakeAddress)
            .balanceOf(walletAddress)
            .call()
        let rawBalance = (reserve / totalShares) * walletBalance;
        let balance = rawBalance / Math.pow(10, decimals);
        return balance;
    }

    async tryGetHedgeTargetAsync(walletAddress: string, tokenAddress: string): Promise<number> {
        let assets = await this.getAssetsAddress();
        let assetIndex = (assets).findIndex(address => address.toLowerCase() === tokenAddress.toLowerCase());
        let reserves = await this._contractInterface.contract.methods.getReserves().call();
        let totalShares = +await this._contractInterface.contract.methods.totalSupply().call();
        return await this.tryGetAssetBalanceAsync(walletAddress, tokenAddress, reserves[assetIndex], totalShares);
    }
}