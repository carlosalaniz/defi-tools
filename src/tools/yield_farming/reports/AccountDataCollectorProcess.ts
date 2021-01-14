import { mongoose } from "@typegoose/typegoose";
import { ExchangeCredentials, ExchangeCredentialsModel, ExchangeNames, FTXExchangeCredentials } from "../../../lib/common/database";
import BinanceExchange from "../../../lib/common/exchanges/binance/binanace";
import FTXExchange from "../../../lib/common/exchanges/ftx/ftx";
import { CheckExchangeRatesInterface, TradeFuturesInterface } from "../../../lib/common/exchanges/HttpExchangeInterfaces";
import { FTXMonitorExchangeCredentials, MonitorModel, MonitorReportModel, MonitorUserModel } from "../database";
import { YFSmartContractFactory } from "../web3/SmartContractFactory";

const conString = "mongodb+srv://root:GmTSj8asbXOCd6zQ@balancer.ksbsv.mongodb.net/deltazeroTest?retryWrites=true&w=majority";
const checkEveryMilliseconds = 2 * 60 * 60 * 1000; // every 2 hours
(async () => {
    // connect
    mongoose.set('useCreateIndex', true);
    await mongoose.connect(conString,
        {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

    async function fetchReportsAndPersist() {
        let users = await MonitorUserModel.find().exec()
        await Promise.all(users.map(async user => {
            let monitorRefs = user.monitors;
            let monitorReports = await Promise.all(monitorRefs.map(async _mid => {
                let monitor = await MonitorModel.findById(_mid).exec();
                let wallet = monitor!.walletAddress;
                let targetAssetAddress = monitor!.targetAssetAddress;
                let web3HttpConnectionString = monitor!.web3HttpConnectionString;
                let contractName = monitor!.contractName;
                let contractAddress = monitor!.contractAddress;
                let contractFactory = new YFSmartContractFactory(web3HttpConnectionString);
                let contract = contractFactory.getYFSmartContract(contractName, contractAddress);
                let assetsBalance = await contract.TryGetAssetsBalanceAsync(wallet);
                let exchangeCredentials = Array.from(monitor!.exchangeCredentials);
                let accountDetails = await Promise.all(exchangeCredentials.map(async exchangeCredentials => {
                    let _excid = exchangeCredentials.exchangeCredentials;
                    let market = exchangeCredentials.market;
                    let tradeSymbol = exchangeCredentials.tradeSymbol;
                    let exchange = await ExchangeCredentialsModel.findById(_excid).exec();
                    let exchangeInsterface: TradeFuturesInterface & CheckExchangeRatesInterface;
                    switch (exchange?.exchangeName) {
                        case ExchangeNames.BINANCE:
                            exchangeInsterface = new BinanceExchange(exchange.apikey!, exchange.apisecret!);
                            break;
                        case ExchangeNames.FTX:
                            let subaccount = (exchangeCredentials as FTXMonitorExchangeCredentials).subaccount;
                            exchangeInsterface = new FTXExchange(exchange.apikey!, exchange.apisecret!, subaccount);
                            break;
                        default:
                            throw exchange;
                    }
                    let accountDetails = await exchangeInsterface.tryGetAccountInformationAsync();
                    let exchangeRate = await exchangeInsterface.tryCheckExchangeRatesInterfaceAsync(tradeSymbol, "USD");
                    let apikey = exchange!.apikey!;
                    return {
                        apikey: apikey.replace(new RegExp(`^.{1,${apikey.length - 5}}`), m => "*".repeat(m.length)),
                        exchangeName: exchange?.exchangeName,
                        accountDetails: accountDetails,
                        exchangeRate: {
                            market_in: tradeSymbol,
                            market_out: "USD",
                            rate: exchangeRate
                        }
                    }
                }));
                return {
                    wallet,
                    targetAssetAddress,
                    contractName,
                    assetsBalance,
                    accountDetails
                }
            }))
            await Promise.all(monitorReports.map(async monitorReport => {
                let report = new MonitorReportModel()
                report.report = monitorReport;
                await report.save();
            }));
        }));
        setTimeout(fetchReportsAndPersist, checkEveryMilliseconds);
    }
    await fetchReportsAndPersist();
})()