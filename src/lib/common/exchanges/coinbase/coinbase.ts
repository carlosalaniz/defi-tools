import axios, { AxiosInstance } from "axios";
import { CheckExchangeRatesInterface } from "../HttpExchangeInterfaces";

export default class CoinbaseExchange implements CheckExchangeRatesInterface {
    exchangeName: string = "Coinbase";
    api: AxiosInstance;
    constructor(){
        this.api = axios.create({
            baseURL: 'https://api.coinbase.com/v2',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'content-type': 'application/json'
            }
        });
    }
    stableAssetMap: { [key: string]: string; } = {
        
    };
    async tryCheckExchangeRatesInterfaceAsync(mi: string, mo: string): Promise<number> {
        let marketin = this.stableAssetMap[mi] || mi;
        let marketout = this.stableAssetMap[mo] || mo;
        let path = `/exchange-rates?currency=${marketin}`;
        try {
            let rates = await this.api.get(path);
            return rates.data.data.rates[marketout] || -1;
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