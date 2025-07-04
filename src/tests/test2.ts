import * as dotenv from "dotenv";
dotenv.config({ path: __dirname + '/.env' });

import { mongoose } from "@typegoose/typegoose";
import { BinanceExchangeCredentialsModel, ExchangeCredentials, ExchangeCredentialsModel, ExchangeNames, FTXExchangeCredentialsModel, UserModel } from "../lib/common/database";
import { ContractEnum } from "../lib/common/defi/ContractEnum";
import { logger } from "../lib/common/logger";
import { GlobalMonitorManager } from "../tools/yield_farming/auto_balancer/GlobalMonitorManager";
import { Monitor, MonitorModel, MonitorStatus, MonitorUserModel, PendingOrderModel, TransactionModel } from "../tools/yield_farming/database";

(async () => {
    mongoose.set('useCreateIndex', true);
    const conString = process.env.CONNECTION_STRING as string;
    await mongoose.connect(conString,
        {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

    await mongoose.connection.db.dropDatabase();
    let user = new UserModel();
    user.email = "carlosglvn93@gmail.com";
    user.password = "$2a$10$c.WR8hd9H10mmBM3U2qdnuCuZU8pjVeadXn4xQT2ei/Er/woz4pOm";
    await user.save();

    let ftxExchangeCredentials = new FTXExchangeCredentialsModel({
        _user: user._id,
        apikey: "oKWf56Z7PAhKa8C8Czb_-zEz1I4YgKll5FeeA1SL",
        apisecret: "l0LkQM3VG8YBR-ZmdZTw3UK0iOCf4zzefnlPzCmp",
        subaccounts: []
    });
    await ftxExchangeCredentials.save();

    let binanceExchangeCredentials = new BinanceExchangeCredentialsModel({
        _user: user._id,
        apikey: "KegqqA6UmAbghdvGANym0fzNBU9XImCLYHxd9F4e68lgnHAgfy0Z2nopBPnOXnNS",
        apisecret: "9IdcgEo1zyDN1jZkRsVoXQEfUEauNV3kqSU9EdPVFeIj9VRegGvonCT5DdAknSWV"
    });
    await binanceExchangeCredentials.save();


    let monitor = new MonitorModel({
        _user: user._id,
        exchangeData: [
            {
                exchangeCredentials: ftxExchangeCredentials._id,
                market: "BAL-PERP",
                tradeSymbol: "BAL",
                orderDistributionPercentage: .5
            },
            {
                exchangeCredentials: binanceExchangeCredentials._id,
                market: "BALUSDT",
                tradeSymbol: "BAL",
                orderDistributionPercentage: .5
            }
        ],
        tag: "diet snapple",
        tradeSettings: {
            tradeMinimumAmount: 0,
            tradeMaxminumAmount: .5,
            refreshRateSeconds: 10
        },
        contractName: ContractEnum.Balancer,
        contractAddress: "0xe2eb726bce7790e57d978c6a2649186c4d481658",
        walletAddress: "0x9d017314c142014b728db33fd8dadbc3c7a99d61",
        targetAssetAddress: "0xba100000625a3754423978a60c9317c58a424e3D",
        web3HttpConnectionString: "https://mainnet.infura.io/v3/eeb133ef92054b6b972655a777493eca",
        status: MonitorStatus.Running
    } as Monitor);

    await monitor.save();
    let monitorUser = new MonitorUserModel();
    monitorUser._user = user._id;
    monitorUser.monitors?.push(monitor._id);
    monitorUser.exchangeCredentials?.push(ftxExchangeCredentials._id);
    await monitorUser.save();
    logger.log("2")

    GlobalMonitorManager.initiliaze(
        MonitorUserModel,
        MonitorModel,
        ExchangeCredentialsModel,
        TransactionModel,
        PendingOrderModel
    );

    // let manager = new UserMonitorManager(
    //     monitorUser._user!.toString()
    // )

})()

logger.log("1")