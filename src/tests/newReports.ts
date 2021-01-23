import { mongoose } from "@typegoose/typegoose";
import * as env from "../env";
import { BinanceExchangeCredentialsModel, FTXExchangeCredentialsModel, UserModel } from "../lib/common/database";
import { ContractEnum } from "../lib/common/defi/ContractEnum";
import { Monitor, MonitorModel, MonitorStatus, MonitorUserModel } from "../tools/yield_farming/database";
(async () => {
    // connect
    mongoose.set('useCreateIndex', true);
    await mongoose.connect(env.conString,
        {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
    await mongoose.connection.db.dropDatabase();
    let user = new UserModel();
    user.email = "carlos.glvn93@gmail.com";
    user.password = "$2a$10$BG2eOb.fSdBJ2FyYOW4/Mu3HmFuyViyg8fLAH4FQslXM8KMzSJtdK";
    await user.save();

    // first monitor
    let ftxExchangeCredentials1 = new FTXExchangeCredentialsModel({
        apikey: "vyWmTpUSzH_Xxslet9oqAzKgNKbRzCxFMoKYaxqy",
        apisecret: "GWbO0HTYOYW_K2wYALZUa5BUVxBOA3-dKXLh4Ncs",
        subaccounts: []
    });
    await ftxExchangeCredentials1.save();

    // second monitor
    let ftxExchangeCredentials2 = new FTXExchangeCredentialsModel({
        apikey: "cOeSwkxgOrb-2-g43R7qvlo5z4_jjxqIq0gxdtkv",
        apisecret: "Ro1m8BlwyxAwb_QIrynS4nAI7-fpnKb75fBMxqiZ",
        subaccounts: []
    });
    await ftxExchangeCredentials2.save();

    //third monitor
    let ftxExchangeCredentials3 = new FTXExchangeCredentialsModel({
        apikey: "9DXas_lVtT0hS5rNOpXzO3Gee4gNxNVS7k4n9JMc",
        apisecret: "2TWGY_F6RHCCtrH-AniSIMrUiGuu_9DF_Q396APG",
        subaccounts: []
    });
    await ftxExchangeCredentials3.save();

    //4 monitor
    let ftxExchangeCredentials4 = new FTXExchangeCredentialsModel({
        apikey: "aDxON1tux-DUr-aToN9xG7HumxocWdiqKhQEhpyY",
        apisecret: "lr9E4qMH95ZzPm4zF_sA6IIOweltizNEAAEA904-",
        subaccounts: ["Juan"]
    });
    await ftxExchangeCredentials4.save();


    // 5th monitor
    let binanceExchangeCredentials1 = new BinanceExchangeCredentialsModel({
        apikey: "bwjoZCGxOz10DpqfSOAdMYFQQd6aUhThngrYQaGO4yqYtDpkkcvbPxQhMWdiASmy",
        apisecret: "da2rlm6Bmm9aOftryTtNI7KINGpnGJfSvYmToPMlmbWM3AJE3SBVS87C76T1YUGZ"
    });
    await binanceExchangeCredentials1.save();
    let monitors = [
        new MonitorModel({
            _user: user._id,
            exchangeData: [
                {
                    exchangeCredentials: ftxExchangeCredentials1._id,
                    market: "BAL-PERP",
                    tradeSymbol: "BAL",
                    orderDistributionPercentage: 1
                }
            ],
            tradeSettings: {
                tradeMinimumAmount: 0,
                tradeMaxminumAmount: 300,
                refreshRateSeconds: 12
            },
            contractName: ContractEnum.Balancer,
            contractAddress: "0xe2eb726bce7790e57d978c6a2649186c4d481658",
            targetAssetAddress: "0xba100000625a3754423978a60c9317c58a424e3D",
            walletAddress: "0x5f88129df411429e5dc15b8fa5ce5cac87eeaecb",
            web3HttpConnectionString: "https://mainnet.infura.io/v3/7ce02f09e14743ac96f9cc9dc8cbc4e0",
            status: MonitorStatus.Running
        } as Monitor),

        new MonitorModel({
            _user: user._id,
            exchangeData: [
                {
                    exchangeCredentials: ftxExchangeCredentials2._id,
                    market: "BAL-PERP",
                    tradeSymbol: "BAL",
                    orderDistributionPercentage: 1
                }
            ],
            tradeSettings: {
                tradeMinimumAmount: 0,
                tradeMaxminumAmount: 150,
                refreshRateSeconds: 21
            },
            contractName: ContractEnum.Balancer,
            contractAddress: "0xe2eb726bce7790e57d978c6a2649186c4d481658",
            targetAssetAddress: "0xba100000625a3754423978a60c9317c58a424e3D",
            walletAddress: "0xa92AC5421f4d09C8A02cA1745caA29051571a47F",
            web3HttpConnectionString: "https://mainnet.infura.io/v3/eeba08deb1244eaca371e5787da3856e",
            status: MonitorStatus.Running
        } as Monitor),

        new MonitorModel({
            _user: user._id,
            exchangeData: [
                {
                    exchangeCredentials: ftxExchangeCredentials3._id,
                    market: "BAL-PERP",
                    tradeSymbol: "BAL",
                    orderDistributionPercentage: 1
                }
            ],
            tradeSettings: {
                tradeMinimumAmount: 0,
                tradeMaxminumAmount: 121,
                refreshRateSeconds: 30
            },
            contractName: ContractEnum.Balancer,
            contractAddress: "0xe2eb726bce7790e57d978c6a2649186c4d481658",
            targetAssetAddress: "0xba100000625a3754423978a60c9317c58a424e3D",
            walletAddress: "0xc5950e36c14285Bc638E9DfcaB93D68d0450807D",
            web3HttpConnectionString: "https://mainnet.infura.io/v3/05ffb0b0a7004ad8a8cfd8b920ba5a83",
            status: MonitorStatus.Running
        } as Monitor),

        new MonitorModel({
            _user: user._id,
            exchangeData: [
                {
                    exchangeCredentials: ftxExchangeCredentials4._id,
                    market: "BAL-PERP",
                    tradeSymbol: "BAL",
                    orderDistributionPercentage: 1,
                    subaccount: "Juan"
                }
            ],
            tradeSettings: {
                tradeMinimumAmount: 0,
                tradeMaxminumAmount: 90,
                refreshRateSeconds: 12
            },
            contractName: ContractEnum.Balancer,
            contractAddress: "0xe2eb726bce7790e57d978c6a2649186c4d481658",
            targetAssetAddress: "0xba100000625a3754423978a60c9317c58a424e3D",
            walletAddress: "0x6D9166E946a1758f0C22eE6b2cFbDb89ba092DE3",
            web3HttpConnectionString: "https://mainnet.infura.io/v3/102ce2ed0095484eb46f5f8d7de1c684",
            status: MonitorStatus.Running
        } as Monitor),

        new MonitorModel({
            _user: user._id,
            exchangeData: [
                {
                    exchangeCredentials: binanceExchangeCredentials1._id,
                    market: "BALUSDT",
                    tradeSymbol: "BAL",
                    orderDistributionPercentage: 1
                }
            ],
            tradeSettings: {
                tradeMinimumAmount: 0,
                tradeMaxminumAmount: 100,
                refreshRateSeconds: 14
            },
            contractName: ContractEnum.Balancer,
            contractAddress: "0xe2eb726bce7790e57d978c6a2649186c4d481658",
            targetAssetAddress: "0xba100000625a3754423978a60c9317c58a424e3D",
            walletAddress: "0x9d017314c142014b728db33fd8dadbc3c7a99d61",
            web3HttpConnectionString: "https://mainnet.infura.io/v3/102ce2ed0095484eb46f5f8d7de1c684",
            status: MonitorStatus.Running
        } as Monitor)
    ];
    await Promise.all(monitors.map(async monitor => {
        await monitor.save();
        let monitorUser = new MonitorUserModel();
        monitorUser._user = user._id;
        monitorUser.monitors?.push(monitor._id);
        monitorUser.exchangeCredentials?.push(...monitor.exchangeData!.map(ed => ed.exchangeCredentials));
        await monitorUser.save();
    }))
})()