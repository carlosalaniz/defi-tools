export interface GetHedgeTargetInterface {
    tryGetHedgeTargetAsync(walletAddress:string, tokenAddress: string): Promise<number>
}