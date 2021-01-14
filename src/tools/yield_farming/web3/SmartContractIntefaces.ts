export interface GetHedgeTargetInterface {
    tryGetHedgeTargetAsync(walletAddress: string, tokenAddress: string): Promise<number>
}

export interface GetAssetsBalanceResult {
    asset_address: string,
    balance: number
}
export interface GetAssetsBalanceInterface {
    TryGetAssetsBalanceAsync(walletAddress: string): Promise<GetAssetsBalanceResult[]>
}