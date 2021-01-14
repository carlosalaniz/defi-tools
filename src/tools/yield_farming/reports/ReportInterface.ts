import { ExchangeNames } from "../../../lib/common/database";
import { ContractEnum } from "../../../lib/common/defi/ContractEnum";
import { GetAssetsBalanceResult } from "../web3/SmartContractIntefaces";

export class ReportInterface {
    wallet!: string;
    targetAssetAddress!: string;
    contractName!: ContractEnum;
    assetsBalance!: GetAssetsBalanceResult[];
    accountDetails!: {
        apikey: string;
        exchangeName: typeof ExchangeNames;
        accountDetails: any;
        exchangeRate: {
            market_in: string;
            market_out: string;
            rate: number;
        };
    }[];
}