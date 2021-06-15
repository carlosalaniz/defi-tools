import { ExchangeCredentials, ExchangeNames } from "../../../lib/common/database";
import BinanceExchange from "../../../lib/common/exchanges/binance/binanace";
import FTXExchange from "../../../lib/common/exchanges/ftx/ftx";
import { TransactionsSide } from "../../../lib/common/exchanges/HttpExchangeInterfaces";
import { FTXMonitorExchangeCredentials, Monitor, MonitorExchangeCredentials, PendingOrder, Transaction } from "../database";
import { YFSmartContractFactory } from "../web3/SmartContractFactory";
import { GetHedgeTargetInterface } from "../web3/SmartContractIntefaces";
import {
    MonitorStarted, NewTransactionMessage, MonitorStoppedMessage,
    MonitorMessageInterface, CommandRequestInterface, InitParametersInterface,
    DeltaZeroMessage, UnexpectedErrorMessage, BadConfigurationErrorMessage,
    TradeLimitReachedErrorMessage, HeartbeatMilliSeconds, HeartbeatMessage,
    ErrorMessageInterface,
    MonitorHasPendingOrderErrorMessage,
    MonitorPositionMessage
} from "./MonitorProcessInterfaces";
import { v4 as uuidv4 } from 'uuid';

type MonitorExchanges = {
    exchange?: (BinanceExchange | FTXExchange)
} & MonitorExchangeCredentials

export class MonitorProcess {
    private _exchanges!: MonitorExchanges[];
    private _minimumQuantityStep!: number;
    private _heartbeatMilliSeconds = HeartbeatMilliSeconds;
    private _monitor!: Monitor;
    private _contract!: GetHedgeTargetInterface;
    private _process!: NodeJS.Process;
    private _stopFlag = false;
    private _errorFlag = false;
    private static _self: MonitorProcess;

    constructor(process: NodeJS.Process) {
        if (process.send) {
            this._process = process;
        } else {
            throw "This class is meant to be ivoked with a forked process.";
        }
        MonitorProcess._self = this;
        MonitorProcess._self.HeartBeatLoop();
    }

    private async HeartBeatLoop() {
        setInterval(() => {
            MonitorProcess._self.SendMessage({
                action: "messageout",
                type: "success",
                body: new HeartbeatMessage()
            });
        }, MonitorProcess._self._heartbeatMilliSeconds)
    }

    //#region Main Methods
    private async getTotalPositionAsync(): Promise<number> {
        let position = 0;
        for (let i = 0; i < MonitorProcess._self._exchanges.length; i++) {
            let exchangeObj = MonitorProcess._self._exchanges[i];
            let exchangePosition = await exchangeObj.exchange!.tryGetBalanceAsync(exchangeObj.market);
            if (exchangePosition > 0) {
                throw `${exchangeObj.exchange!.exchangeName} position for market ${exchangeObj.market} account ${MonitorProcess._self._monitor.walletAddress} is incorrect. Net position: ${exchangePosition} should be negative (SHORT)`
            }
            position += +exchangePosition;
        }
        return position;
    }

    private static validateTotalDistribution() {
        let exchanges = MonitorProcess._self._monitor.exchangeData;
        let totalDistribution = exchanges.reduce((accumulator, currentValue) => {
            return accumulator + currentValue.orderDistributionPercentage;
        }, 0);
        if (totalDistribution !== 1) {
            MonitorProcess.handleError({
                action: "messageout",
                type: "error",
                body: new BadConfigurationErrorMessage(
                    `Monitor ${MonitorProcess._self._monitor._id} exchange position distributions are invalid, ${totalDistribution} should be equal to 1`
                )
            });
            return false;
        }
        return true;
    }

    private async tryPlaceDistributedOrderAsync(amount: number, side: TransactionsSide) {
        let batchId: string | undefined = uuidv4();
        let transactions: Transaction[] = [];
        let carryOver = 0;
        MonitorProcess._self._exchanges.sort((a, b) => b.exchange!.getQuantityStep(b.tradeSymbol) - a.exchange!.getQuantityStep(a.tradeSymbol));
        for (let i = 0; i < MonitorProcess._self._exchanges.length; i++) {
            let exchangeObj = MonitorProcess._self._exchanges[i];
            let orderDistributionPercentage = (exchangeObj.orderDistributionPercentage || 0);
            let ordersize = carryOver + (amount * orderDistributionPercentage);
            let quantityStep = exchangeObj.exchange!.getQuantityStep(exchangeObj.tradeSymbol);
            let preciseOrderSize = Math.floor(ordersize / quantityStep) * quantityStep;
            carryOver = ordersize % quantityStep;
            if (preciseOrderSize > 0) {
                await exchangeObj.exchange!.tryPlaceFuturesMarketOrderAsync(preciseOrderSize, side, exchangeObj.market);
                let exchangeData = { ...exchangeObj } as MonitorExchanges;
                delete exchangeData.exchange;

                let transaction = {} as Transaction;
                transaction.transactionBatchId = batchId;
                transaction.orderDistributionPercentage = orderDistributionPercentage;
                transaction.exchangeData = exchangeData;
                transaction._monitor = MonitorProcess._self._monitor._id;
                transaction.side = side;
                transaction.size = preciseOrderSize;
                transactions.push(transaction);
            }
        }

        transactions.forEach(transaction => {
            transaction.batchSize = transactions.length;
            MonitorProcess._self.SendMessage({
                action: "messageout",
                type: "success",
                body: new NewTransactionMessage(transaction)
            })
        })
    }

    private static handleError(message: MonitorMessageInterface<ErrorMessageInterface>) {
        MonitorProcess._self.SendMessage(message);
        MonitorProcess._self._stopFlag = true;
        MonitorProcess._self._errorFlag = true;
    }

    private exitProcess() {
        if (!MonitorProcess._self._errorFlag) {
            MonitorProcess._self.SendMessage({
                action: "messageout",
                type: "success",
                body: new MonitorStoppedMessage()
            })
        }
        return MonitorProcess._self._process.exit();
    }

    private async LoopBody() {
        //#region Main loop body
        if (
            MonitorProcess.validateTotalDistribution()
        ) {
            try {
                let stopMax = MonitorProcess._self._monitor.tradeSettings.tradeMaxminumAmount;
                let tradeMin = MonitorProcess._self._monitor.tradeSettings.tradeMinimumAmount;
                let rawHedgeTarget = +(await MonitorProcess._self._contract.tryGetHedgeTargetAsync(
                    MonitorProcess._self._monitor.walletAddress,
                    MonitorProcess._self._monitor.targetAssetAddress
                ));

                if (rawHedgeTarget < 0) {
                    let error = `Hedge target for token ${MonitorProcess._self._monitor.targetAssetAddress} in wallet ${MonitorProcess._self._monitor.walletAddress} is incorrect. Hedge target: ${rawHedgeTarget} should be positive (LONG)`;
                    throw error;
                }

                let rawPosition = await MonitorProcess._self.getTotalPositionAsync();
                let hedgeTarget = +rawHedgeTarget.toFixed(MonitorProcess._self._minimumQuantityStep);
                let position = +rawPosition.toFixed(MonitorProcess._self._minimumQuantityStep);
                let delta = +(hedgeTarget + position);
                let absDelta = Math.abs(delta);

                MonitorProcess._self.SendMessage({
                    action: "messageout",
                    type: "success",
                    body: new MonitorPositionMessage(rawHedgeTarget)
                });

                if (absDelta > tradeMin) {
                    if (absDelta <= stopMax) {
                        if (delta > 0) {
                            await MonitorProcess._self.tryPlaceDistributedOrderAsync(absDelta, TransactionsSide.Sell);
                        } else {
                            await MonitorProcess._self.tryPlaceDistributedOrderAsync(absDelta, TransactionsSide.Buy);
                        }
                    } else {
                        let pendingOrder = {} as PendingOrder;
                        pendingOrder._monitor = MonitorProcess._self._monitor._id,
                            pendingOrder.ordersize = absDelta,
                            pendingOrder.side = (delta > 0) ? TransactionsSide.Sell : TransactionsSide.Buy
                        MonitorProcess.handleError({
                            action: "messageout",
                            type: "error",
                            body: new TradeLimitReachedErrorMessage({
                                message: `${absDelta} >= ${tradeMin} : ${absDelta >= tradeMin} ${absDelta} <= ${stopMax}: ${absDelta <= stopMax}`,
                                ...pendingOrder
                            })
                        });
                    }
                } else {
                    MonitorProcess._self.SendMessage({
                        action: "messageout",
                        type: "success",
                        body: new DeltaZeroMessage()
                    });
                }
            } catch (e) {
                MonitorProcess.handleError({
                    action: "messageout",
                    type: "error",
                    body: new UnexpectedErrorMessage(JSON.stringify(e))
                });
            }
        }
        //#endregion 

        if (!MonitorProcess._self._stopFlag) {
            let refreshRateSeconds = MonitorProcess._self._monitor.tradeSettings.refreshRateSeconds;
            setTimeout(MonitorProcess._self.LoopBody, refreshRateSeconds * 1000);
        } else {
            MonitorProcess._self.exitProcess();
        }
    }
    //#endregion

    //#region Event handling
    public SendMessage(message: MonitorMessageInterface) {
        let _id = MonitorProcess._self._monitor?._id?.toString();
        if (_id) {
            message._monitorId = _id;
        }
        if (MonitorProcess._self._process.send) {
            MonitorProcess._self._process.send(message);
        }
    }

    public OnMessageEventHandler(message: MonitorMessageInterface<CommandRequestInterface | InitParametersInterface>) {
        switch (message.action) {
            case "init":
                MonitorProcess._self.Init(message.body as InitParametersInterface);
                break;
            case "command":
                let payload = message.body as CommandRequestInterface;
                switch (payload.command) {
                    case "stop":
                        MonitorProcess._self._stopFlag = true;
                        break;
                }
                break;
        }
    }

    private Init(initparamaters: InitParametersInterface) {
        // Monitor
        MonitorProcess._self._monitor = initparamaters.monitor;
        if (initparamaters.hasPendingOrders) {
            MonitorProcess.handleError({
                action: "messageout",
                type: "error",
                body: new MonitorHasPendingOrderErrorMessage()
            })
            return MonitorProcess._self.exitProcess();
        }
        try {
            // Get contract interface
            MonitorProcess._self._contract = new YFSmartContractFactory(MonitorProcess._self._monitor.web3HttpConnectionString)
                .getYFSmartContract(
                    MonitorProcess._self._monitor.contractName,
                    MonitorProcess._self._monitor.contractAddress
                );

            // Map exchanges
            MonitorProcess._self._exchanges = initparamaters.monitorExchangeCredentials
                .map(exchangeCredentials => {
                    let exchange = undefined;
                    let monitorExchangeCredentials = initparamaters.monitor.exchangeData.filter(
                        cred => {
                            let id = cred.exchangeCredentials instanceof ExchangeCredentials ? cred.exchangeCredentials._id : cred.exchangeCredentials;
                            return id === exchangeCredentials._id
                        }
                    ).pop();

                    if (monitorExchangeCredentials) {
                        switch (exchangeCredentials.exchangeName) {
                            case ExchangeNames.BINANCE:
                                exchange = new BinanceExchange(
                                    exchangeCredentials.apikey!,
                                    exchangeCredentials.apisecret!
                                )
                                break;
                            case ExchangeNames.FTX:
                                let ftxMonitorExchangeCredentials = monitorExchangeCredentials as FTXMonitorExchangeCredentials;
                                exchange = new FTXExchange(
                                    exchangeCredentials.apikey!,
                                    exchangeCredentials.apisecret!,
                                    ftxMonitorExchangeCredentials.subaccount
                                )
                                break;
                            default:
                                throw exchangeCredentials.exchangeName + "Not recognized";
                        }

                        return {
                            exchange: exchange,
                            ...monitorExchangeCredentials,
                        }
                    }

                    throw "monitorExchangeCredentials not found";
                });
        } catch (e) {
            MonitorProcess.handleError({
                action: "messageout",
                type: "error",
                body: new BadConfigurationErrorMessage(
                    "An error occured while initializing the monitor, this is most likely caused by a bad configuration, please delete the monitor and recreate with the correct data." +
                    `\n Original error: ${e.message}`
                )
            });
            MonitorProcess._self.exitProcess();
        }
        // Start monitor loop
        MonitorProcess._self.LoopBody();
    }
    // #endregion
}

const monitor = new MonitorProcess(process);
process.on("message", monitor.OnMessageEventHandler);

monitor.SendMessage({
    action: "messageout",
    type: "success",
    body: new MonitorStarted()
});