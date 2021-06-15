interface HttpExchangeInterface {
    exchangeName: string
}
export enum TransactionsSide {
    Buy = "buy",
    Sell = "sell"
}

export enum TransactionStatusEnum {
    Complete = "success",
    Pending = "error"
}

export interface CheckBalanceInterface extends HttpExchangeInterface {
    tryGetBalanceAsync(market: string): Promise<number>;
}

export interface TradeFuturesInterface extends HttpExchangeInterface {
    getQuantityStep(asset: string): number;
    tryPlaceFuturesMarketOrderAsync(amount: number, side: TransactionsSide, market: string): Promise<number|void>;
    tryGetAccountInformationAsync(subaccount?: string): Promise<any>;
}

export interface CheckExchangeRatesInterface extends HttpExchangeInterface {
    /**
     * Example: { "USD":"USDT" }
     */
    stableAssetMap: { [key: string]: string; }
    tryCheckExchangeRatesInterfaceAsync(marketin: string, marketout: string): Promise<number>;
}
