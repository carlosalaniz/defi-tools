import { fork as forkChildProcess } from 'child_process';
import path from 'path';
import { ExchangeNames, FTXExchangeCredentials } from '../lib/common/database';
import { ContractEnum } from '../lib/common/defi/ContractEnum';
import { EmitMessageInterface, MessageTypeEnum, InitMessage, MonitorMessageInterface, MonitorErrorsEnum } from '../tools/yield_farming/auto_balancer/MonitorProcessInterfaces';
import { Monitor, MonitorStatus, Transaction } from '../tools/yield_farming/database';
import { mongoose } from '@typegoose/typegoose';
import { logger } from '../lib/common/logger';
const MonitorProcessPath = path.resolve(__dirname + "/tools/yield_farming/auto_balancer/MonitorProcess")

let exchangeCredentials = {
    _id: new mongoose.Types.ObjectId("5ffa189c933da736fa05d753"),
    exchangeName: ExchangeNames.FTX,
    apikey: "oKWf56Z7PAhKa8C8Czb_-zEz1I4YgKll5FeeA1SL",
    apisecret: "l0LkQM3VG8YBR-ZmdZTw3UK0iOCf4zzefnlPzCmp",
    subaccounts: []
} as FTXExchangeCredentials & any;

let monitor: Monitor = {
    tag:"test",
    lastKnownAssetBalance:4,
    transactionsCount:1,
    _user: new mongoose.Types.ObjectId("5ffa18a9c0980552035ed1e0"),
    _id: new mongoose.Types.ObjectId("5ffa18a9c0980552035ed1e0"),
    exchangeData: [
        {
            exchangeCredentials: new mongoose.Types.ObjectId("5ffa189c933da736fa05d753"),
            market: "BAL-PERP",
            tradeSymbol:"BAL",
            orderDistributionPercentage: 1
        }
    ],
    tradeSettings: {
        tradeMinimumAmount: 0.01,
        tradeMaxminumAmount: 0.08,
        refreshRateSeconds: 15
    },
    contractName: ContractEnum.Balancer,
    contractAddress: "0xe2eb726bce7790e57d978c6a2649186c4d481658",
    walletAddress: "0x9d017314c142014b728db33fd8dadbc3c7a99d61",
    targetAssetAddress: "0xba100000625a3754423978a60c9317c58a424e3D",
    web3HttpConnectionString: "https://mainnet.infura.io/v3/eeb133ef92054b6b972655a777493eca",
    status: MonitorStatus.Stopped
}

let child = forkChildProcess(
    MonitorProcessPath,
    // argv
    [],
    // options
    { stdio: ['inherit', 'inherit', 'inherit', 'ipc'] }
)

child.on("message", (message: MonitorMessageInterface<EmitMessageInterface>) => {
    if (message.type === "success") {
        switch (message.body.type as MessageTypeEnum) {
            case MessageTypeEnum.MonitorStarted:
                child.send(new InitMessage({
                    monitor: monitor,
                    monitorExchangeCredentials: [exchangeCredentials],
                    hasPendingOrders: false
                }));
                break;
            case MessageTypeEnum.MonitorStoped:
                break;
            case MessageTypeEnum.DeltaZero:
                break;
            case MessageTypeEnum.NewTransaction:
                let transaction = message.body.payload as Transaction;
                logger.warn("transaction", transaction);
        }
    } else {
        switch (message.body.type as MonitorErrorsEnum) {
            case MonitorErrorsEnum.TradeLimitReached:
                break;
            case MonitorErrorsEnum.BadConfiguration:
                break;
            case MonitorErrorsEnum.UnexpectedError:
        }
    }
    logger.log({ _id: message._monitorId, ...message.body });
})
logger.log(1);

