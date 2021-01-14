import { CheckBalanceInterface, CheckExchangeRatesInterface, TradeFuturesInterface, TransactionsSide } from "../HttpExchangeInterfaces";
import axios, { AxiosInstance } from 'axios';
import * as crypto from "crypto";
export default class FTXExchange implements TradeFuturesInterface, CheckBalanceInterface, CheckExchangeRatesInterface {
    orderPrecision: number = 2;

    exchangeName: string = "FTX";

    stableAssetMap: { [key: string]: string; } = {
        "USD": "USDC"
    };

    private apisecret: string;
    private api: AxiosInstance;

    constructor(apikey: string, apisecret: string, subaccount?: string) {
        this.apisecret = apisecret;

        let headers: { [key: string]: string; } = {
            'FTX-KEY': apikey,
            'X-Requested-With': 'XMLHttpRequest',
            'content-type': 'application/json'
        }

        if (subaccount) {
            headers['FTX-SUBACCOUNT'] = encodeURI(subaccount);
        }

        this.api = axios.create({
            baseURL: 'https://ftx.com',
            headers: headers
        });
    }
    
    private signPayload(time: number, method: "get" | "post", api_enpoint: string, body?: any): string {
        var hmac = crypto.createHmac('sha256', this.apisecret);
        let payload = "";
        if (method === "get") {
            payload = `${time}${method.toUpperCase()}${api_enpoint}`;
        } else if (method === 'post') {
            payload = `${time}${method.toUpperCase()}${api_enpoint}${body}`;
        }
        hmac.update(payload);
        return hmac.digest("hex");
    }

    async tryGetAccountInformationAsync(subaccount?: string) {
        let path = "/api/account";
        let time = + new Date();
        let response = await this.api.get(path, {
            headers: {
                'FTX-TS': time.toString(),
                'FTX-SIGN': this.signPayload(time, "get", path)
            }
        });
        return response.data.result;
    }

    async tryCheckExchangeRatesInterfaceAsync(mi: string, mo: string): Promise<number> {
        let marketin = this.stableAssetMap[mi] || mi;
        let marketout = mo;
        // example: BTC/USD
        let spot = `${marketin}/${marketout}`
        let path = `/api/markets/${spot}`
        let time = + new Date();
        try {
            let response = await this.api.get(path, {
                headers: {
                    'FTX-TS': time.toString(),
                    'FTX-SIGN': this.signPayload(time, "get", path)
                }
            });
            return response.data.result.price || -1;
        } catch (e) {
            if (e && e.response.status === 404) {
                throw {
                    path: path,
                    error: e.response.data.s
                }
            }
            throw e;
        }
    }

    async tryGetBalanceAsync(market: string): Promise<number> {
        let path = "/api/positions";
        let time = + new Date();
        try {
            let response = await this.api.get(path, {
                headers: {
                    'FTX-TS': time.toString(),
                    'FTX-SIGN': this.signPayload(time, "get", path)
                }
            });
            let futurePosition = response.data.result.filter((p: any) => p.future === market).pop();
            return futurePosition.netSize;
        } catch (e) {
            let error = e;
            if (e && e.response.status >= 400 && e.response.status < 500) {
                throw {
                    path: path,
                    error: e.response.data
                }
            }
            throw e;
        }
    }

    async tryPlaceFuturesMarketOrderAsync(amount: number, side: TransactionsSide, market: string): Promise<void> {
        let path = "/api/orders";
        let payload = {
            market: market,
            side: side,
            type: "market",
            size: amount,
            price: null
        }
        let time = + new Date();
        try {
            await this.api.post(path, payload, {
                headers: {
                    'FTX-TS': time.toString(),
                    'FTX-SIGN': this.signPayload(time, "post", path, JSON.stringify(payload))
                }
            });
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