import * as dotenv from "dotenv";
dotenv.config({ path: __dirname + '/.env' });

import { mongoose } from "@typegoose/typegoose";
import { ExchangeCredentialsModel, ExchangeNames } from "../../../lib/common/database";
import BinanceExchange from "../../../lib/common/exchanges/binance/binanace";
import FTXExchange from "../../../lib/common/exchanges/ftx/ftx";
import { CheckExchangeRatesInterface, TradeFuturesInterface } from "../../../lib/common/exchanges/HttpExchangeInterfaces";
import { FTXMonitorExchangeCredentials, MonitorModel, MonitorReportModel, MonitorUserModel } from "../database";
import { YFSmartContractFactory } from "../web3/SmartContractFactory";
import { logger } from "../../../lib/common/logger";

const conString = process.env.CONNECTION_STRING as string;
const repeatEveryMinutes = Number.parseInt(process.env.REPEAT_EVERY_MINUTES as string);
const checkEveryMilliseconds = repeatEveryMinutes * 60 * 1000; // every 2 hours

(async () => {
    // connect
    mongoose.set('useCreateIndex', true);
    await mongoose.connect(conString,
        {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

    async function fetchReportsAndPersist() {
        try {
            let monitors = await MonitorModel.find().exec()
            let monitorReports = await Promise.all(monitors.map(async monitor => {
                let wallet = monitor!.walletAddress;
                let targetAssetAddress = monitor!.targetAssetAddress;
                let web3HttpConnectionString = monitor!.web3HttpConnectionString;
                let contractName = monitor!.contractName;
                let contractAddress = monitor!.contractAddress;
                let contractFactory = new YFSmartContractFactory(web3HttpConnectionString);
                let contract = contractFactory.getYFSmartContract(contractName, contractAddress);
                let assetsBalance = await contract.TryGetAssetsBalanceAsync(wallet);
                let exchangeCredentials = Array.from(monitor!.exchangeData);
                let accountDetails = await Promise.all(exchangeCredentials.map(async exchangeCredentials => {
                    let _excid = exchangeCredentials.exchangeCredentials;
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
                    _mid: monitor!._id,
                    wallet,
                    targetAssetAddress,
                    contractName,
                    assetsBalance,
                    accountDetails
                }
            }));
            await Promise.all(monitorReports.map(async monitorReport => {
                if (monitorReport) {
                    let report = new MonitorReportModel()
                    report.report = monitorReport;
                    await report.save();
                    logger.log("report saved", monitorReport._mid)
                }
            }));
            setTimeout(fetchReportsAndPersist, checkEveryMilliseconds);
        } catch (e) {
            logger.log(e);
        }
    }

    await fetchReportsAndPersist();
})()