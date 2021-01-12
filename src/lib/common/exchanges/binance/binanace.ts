import { CheckBalanceInterface, CheckExchangeRatesInterface, TradeFuturesInterface, TransactionsSide } from "../HttpExchangeInterfaces";
import axios, { AxiosInstance } from 'axios';
import * as crypto from "crypto";
export default class BinanceExchange implements TradeFuturesInterface, CheckBalanceInterface, CheckExchangeRatesInterface {

    orderPrecision: number = 1;
    exchangeName = "Binance";
    stableAssetMap: { [key: string]: string; } = {
        "USD": "USDT"
    };

    private fapi: AxiosInstance;
    private secretkey: string;
    private api: AxiosInstance;

    constructor(apikey: string, apisecret: string) {
        // futures api, required for
        this.secretkey = apisecret;
        this.fapi = axios.create({
            baseURL: 'https://fapi.binance.com',
            headers: {
                'X-MBX-APIKEY': apikey,
                'X-Requested-With': 'XMLHttpRequest',
                'content-type': 'application/json'
            }
        });
        this.api = require('axios').create({
            baseURL: 'https://api.binance.com',
            headers: {
                'X-MBX-APIKEY': apikey,
                'X-Requested-With': 'XMLHttpRequest',
                'content-type': 'application/json'
            }
        });
    }

    async tryGetAccountCollateralAsync(): Promise<number> {
        throw new Error("Method not implemented.");
    }

    private signPayload(queryString: string): string {
        var hmac = crypto.createHmac('sha256', this.secretkey);
        hmac.update(queryString.replace(",", ""));
        return hmac.digest("hex");
    }

    private getfapi = async (path: string) => await this.callAPIAsync(path, "get", this.fapi);
    private postfapi = async (path: string) => await this.callAPIAsync(path, "post", this.fapi);

    private getapi = async (path: string) => await this.callAPIAsync(path, "get", this.api);
    private postapi = async (path: string) => await this.callAPIAsync(path, "post", this.api);

    async tryGetAccountInformationAsync() {
        let path = `/fapi/v2/account`;
        try {
            let accountInfo = await this.getfapi(path);
            return accountInfo.data;
        } catch (e) {
            if (e && e.response.status >= 400 && e.response.status < 500) {
                throw {
                    path: path,
                    error: e.response.data
                }
            }
            throw e;
        }
    }

    private async callAPIAsync(fullpath: string, method: "get" | "post", api: AxiosInstance) {
        let time = + new Date();
        let split = fullpath.split("?");
        let path = split[0];
        let queryString = split[1];
        if (!queryString) {
            queryString = `timestamp=${time}`
        } else {
            queryString += `&timestamp=${time}`
        }
        let signature = this.signPayload(queryString);
        let uri = `${path}?${queryString}&signature=${signature}`;
        if (method === "get") {
            return await api.get(uri);
        } else {
            return await api.post(uri);
        }
    }

    public async tryCheckExchangeRatesInterfaceAsync(mi: string, mo: string): Promise<number> {
        let marketin = this.stableAssetMap[mi] || mi;
        let marketout = this.stableAssetMap[mo] || mo;
        let symbol = `${marketin}${marketout}`;
        let path = `/sapi/v1/margin/priceIndex?symbol=${symbol}`;
        try {
            let rates = await this.getapi(path);
            return rates.data.price || -1;
        } catch (e) {
            if (e && e.response.status >= 400 && e.response.status < 500) {
                throw {
                    path: path,
                    error: e.response.data
                }
            }
            throw e;
        }
    }

    public async tryGetBalanceAsync(market: string): Promise<number> {
        let path = `/fapi/v2/positionRisk?symbol=${market}`;
        try {
            let positionResponse = await this.getfapi(path);
            let position = positionResponse.data.pop();
            if (position) {
                return +position.positionAmt;
            }
            throw positionResponse;
        } catch (e) {
            if (e && e.response.status >= 400 && e.response.status < 500) {
                throw {
                    path: path,
                    error: e.response.data
                }
            }
            throw e;
        }
    }

    public async tryPlaceFuturesMarketOrderAsync(amount: number, side: "buy" | "sell", market: string): Promise<void> {
        if (amount === 0) return;
        let path = `/fapi/v1/order?symbol=${market}&side=${side.toUpperCase()}&type=MARKET&quantity=${amount}`;
        try {
            await this.postfapi(path);
        } catch (e) {
            if (e && e.response.status >= 400 && e.response.status < 500) {
                throw {
                    path: path,
                    error: e.response.data
                }
            }
            throw e;
        }
    }
}