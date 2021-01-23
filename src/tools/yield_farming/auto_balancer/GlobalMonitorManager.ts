import { ChildProcess, fork as forkChildProcess } from 'child_process';
import { Types } from 'mongoose';
import * as path from 'path';
import { ExchangeCredentials, MongooseModel } from '../../../lib/common/database';
import defer from '../../../lib/common/defer';
import { logger } from '../../../lib/common/logger';
import { Monitor, MonitorStatus, MonitorUser, PendingOrder, Transaction } from '../database';
import { MonitorMessageInterface, EmitMessageInterface, MessageTypeEnum, InitMessage, MonitorErrorsEnum, UnexpectedErrorMessage, TradeLimitReachedErrorMessage, BadConfigurationErrorMessage, NewTransactionMessage, HeartbeatMilliSeconds, StopMessage, MonitorPositionMessage } from './MonitorProcessInterfaces';

export async function getMonitorAndExchanges(mref: Monitor | string | Types.ObjectId | undefined) {
    const _globalMonitorManager = GlobalMonitorManager.getInstance();
    let monitor_id = mref instanceof Monitor ? mref._id : mref;
    let monitor = (await _globalMonitorManager.MonitorModel!.findById(monitor_id).exec())?.toObject() as Monitor | undefined;
    if (monitor) {
        let exchangeCredentials = await Promise.all(
            monitor.exchangeData.map(
                async monitorExCred => {
                    let exchangeCredentials = await _globalMonitorManager.ExchangeCredentialsModel!.findById(monitorExCred.exchangeCredentials).exec();
                    return exchangeCredentials!.toObject() as ExchangeCredentials;
                })
        );
        return {
            monitor: monitor,
            exchangeCredentials: exchangeCredentials
        }

    }
};

export class GlobalMonitorManager {
    private static _heartbeatTimeoutMilliSeconds = HeartbeatMilliSeconds + 5000;
    public static instance?: GlobalMonitorManager;
    static waitForMonitorReply: Promise<unknown> & { resolve: any; reject: any; };
    public static _healthcheckTimoutSeconds = 30;
    private _globalMonitorRegistry: {
        [key: string]:
        {
            process: ChildProcess,
            lastSeen: number
        }
    } = {};

    private _monitorProcessPath = path.resolve(__dirname + "/MonitorProcess")

    private constructor(
        public UserModel: MongooseModel<MonitorUser>,
        public MonitorModel: MongooseModel<Monitor>,
        public ExchangeCredentialsModel: MongooseModel<ExchangeCredentials>,
        public TransactionModel: MongooseModel<Transaction>,
        public PendingOrderModel: MongooseModel<PendingOrder>
    ) {
        this.startMonitorHealthCheckInterval();
        GlobalMonitorManager.instance = this;
    }

    private startMonitorHealthCheckInterval() {
        return setInterval(async () => {
            for (let mref in GlobalMonitorManager.instance!._globalMonitorRegistry) {
                let process = GlobalMonitorManager.instance!._globalMonitorRegistry[mref];
                let timeDelta = (+Date.now()) - process.lastSeen;
                if (timeDelta >= GlobalMonitorManager._heartbeatTimeoutMilliSeconds) {
                    await GlobalMonitorManager.instance!.startMonitorAsync(mref)
                };
            }
        }, GlobalMonitorManager._healthcheckTimoutSeconds * 1000)
    }

    public static initiliaze(
        UserModel: MongooseModel<MonitorUser>,
        MonitorModel: MongooseModel<Monitor>,
        ExchangeCredentialsModel: MongooseModel<ExchangeCredentials>,
        TransactionModel: MongooseModel<Transaction>,
        PendingOrderModel: MongooseModel<PendingOrder>
    ) {
        if (GlobalMonitorManager.instance) {
            throw "GlobalMonitorManager can only be instantiated once, use GlobalMonitorManager.getInstance() instead"
        }

        return new GlobalMonitorManager(
            UserModel,
            MonitorModel,
            ExchangeCredentialsModel,
            TransactionModel,
            PendingOrderModel
        )
    }

    public static getInstance() {
        if (GlobalMonitorManager.instance) {
            return GlobalMonitorManager.instance;
        }
        throw "GlobalMonitorManager is not yet initizalided";
    }

    public async stopMonitorAsync(monitorId: string | Types.ObjectId) {
        const monitor = GlobalMonitorManager.instance?._globalMonitorRegistry[monitorId.toString()]
        if (monitor) {
            monitor.process.send(new StopMessage());
            GlobalMonitorManager.waitForMonitorReply = defer();
            await GlobalMonitorManager.waitForMonitorReply;
        }
    }

    public async startMonitorAsync(monitorId: string | Types.ObjectId) {
        let m = await getMonitorAndExchanges(monitorId);
        if (m) {
            return await GlobalMonitorManager.instance!.forkMonitorAsync(m.monitor, m.exchangeCredentials);
        }
    }

    public async forkMonitorAsync(monitor: Monitor, exchangeCredentials: ExchangeCredentials[]): Promise<void> {
        // fork process
        let monitorInstance = forkChildProcess(
            // path
            GlobalMonitorManager.instance!._monitorProcessPath,
            // argv
            [],
            // options
            { stdio: ['inherit', 'inherit', 'inherit', 'ipc'] }
        );
        var waitForMonitorReply = defer();
        monitorInstance.on("message", (message: MonitorMessageInterface<EmitMessageInterface>) => {
            if (message.type === "success") {
                switch (message.body.type as MessageTypeEnum) {
                    case MessageTypeEnum.MonitorStarted:
                        waitForMonitorReply.resolve();
                }
            }
        });
        await waitForMonitorReply;
        let monitorRecord = await this.MonitorModel.findById(monitor._id).exec();
        monitorRecord!.status = MonitorStatus.Running;
        await monitorRecord!.save();
        await GlobalMonitorManager.instance!.OnMonitorStartedMessageAsync(monitorInstance, monitor, exchangeCredentials);
        monitorInstance.on("message", GlobalMonitorManager.instance!.OnMessageRecievedAsync);
        let _globalMonitorRegistry = GlobalMonitorManager.instance!._globalMonitorRegistry;
        if (_globalMonitorRegistry[monitor._id.toString()]) {
            _globalMonitorRegistry[monitor._id.toString()].process.kill();
        }
        _globalMonitorRegistry[monitor._id.toString()] = {
            process: monitorInstance,
            lastSeen: +new Date()
        };
    }

    //#region EventHandlers
    private async OnMessageRecievedAsync(message: MonitorMessageInterface<EmitMessageInterface>) {
        logger.debug(message);
        let monitor = await GlobalMonitorManager.instance!.MonitorModel.findById(message._monitorId).exec();
        monitor!.lastMessageRecieved = +new Date();
        if (message.type === "success") {
            switch (message.body.type as MessageTypeEnum) {
                case MessageTypeEnum.Heartbeat:
                    GlobalMonitorManager.instance!.OnMonitorHeartbeatMessage(message._monitorId!);
                    break;
                case MessageTypeEnum.MonitorStoped:
                    monitor!.lastMessage = "";
                    await GlobalMonitorManager.instance!.OnMonitorStoppedMessageAsync(message._monitorId!);
                    break;
                case MessageTypeEnum.DeltaZero:
                    GlobalMonitorManager.instance!.OnDeltaZeroMessage(message._monitorId!);
                    break;
                case MessageTypeEnum.MonitorPositionMessage:
                    const _positionMessage = message.body as MonitorPositionMessage;
                    await GlobalMonitorManager.instance!.OnPositionMessageAsync(message._monitorId!, _positionMessage);
                    break;
                case MessageTypeEnum.NewTransaction:
                    const _newTransactionMessage = message.body as NewTransactionMessage;
                    await GlobalMonitorManager.instance!.OnNewTransactionMessageAsync(message._monitorId!, _newTransactionMessage);
            }
        } else {
            switch (message.body.type as MonitorErrorsEnum) {
                case MonitorErrorsEnum.TradeLimitReached:
                    const _tradeLimitReachedErrorMessage = message.body as TradeLimitReachedErrorMessage;
                    await GlobalMonitorManager.instance!.OnTradeLimitReachedErrorAsync(message._monitorId!, _tradeLimitReachedErrorMessage)
                    break;
                case MonitorErrorsEnum.MonitorHasPendingOrderError:
                    await GlobalMonitorManager.instance!.OnMonitorHasPendingOrderErrorAsync(message._monitorId!)
                    break;
                case MonitorErrorsEnum.BadConfiguration:
                    const _badConfigurationErrorMessage = message.body as BadConfigurationErrorMessage;
                    monitor!.lastMessage = _badConfigurationErrorMessage.payload as string;
                    await GlobalMonitorManager.instance!.OnBadConfigurationError(message._monitorId!, _badConfigurationErrorMessage);
                    break;
                case MonitorErrorsEnum.UnexpectedError:
                    const _unexpectedErrorMessage = message.body as UnexpectedErrorMessage;
                    monitor!.lastMessage = _unexpectedErrorMessage.payload as string;
                    await GlobalMonitorManager.instance!.OnUnExpectedErrorAsync(message._monitorId!, _unexpectedErrorMessage);
            }
        }
        await monitor!.save();
    }

    async OnMessageAsync(_monitorId: string, message: MonitorMessageInterface<EmitMessageInterface>) {
        let monitor = await GlobalMonitorManager.instance!.MonitorModel.findById(_monitorId).exec();
        if (monitor) {
            monitor.lastMessageRecieved = +new Date();
            if (message.body.type !== MessageTypeEnum.Heartbeat) {
                monitor.lastMessage = message.body.payload;
            }
            await monitor.save();
        }
    }

    private async OnMonitorHasPendingOrderErrorAsync(_monitorId: string) {
        logger.log("OnMonitorHasPendingOrderErrorAsync", _monitorId);
        let monitor = await GlobalMonitorManager.instance!.MonitorModel.findById(_monitorId).exec();
        if (monitor) {
            monitor.status = MonitorStatus.HasPendingOrders;
            await monitor.save();
            delete GlobalMonitorManager.instance!._globalMonitorRegistry[_monitorId];
        }

    }

    private OnMonitorHeartbeatMessage(_monitorId: string) {
        let lastSeen = GlobalMonitorManager.instance!._globalMonitorRegistry[_monitorId].lastSeen
        logger.log("Heartbeat", _monitorId, ((+new Date()) - lastSeen));
        GlobalMonitorManager.instance!._globalMonitorRegistry[_monitorId].lastSeen = +new Date();
    }

    private async OnMonitorStartedMessageAsync(child: ChildProcess, monitor: Monitor, exchangeCredentials: ExchangeCredentials[]) {
        logger.log("Process started");
        let pendingOrders = await GlobalMonitorManager.instance!.PendingOrderModel.find(
            { _monitor: monitor._id, resolved: false }
        ).exec();
        // send message to initiliaze monitor process
        child.send(new InitMessage({
            monitor: monitor,
            monitorExchangeCredentials: exchangeCredentials,
            hasPendingOrders: pendingOrders.length > 0
        }));
    }

    private async OnMonitorStoppedMessageAsync(_monitorId: string) {
        logger.log("OnMonitorStopped", _monitorId);
        let monitor = await GlobalMonitorManager.instance!.MonitorModel.findById(_monitorId).exec();
        if (monitor) {
            monitor.status = MonitorStatus.Stopped;
            await monitor.save();
            delete GlobalMonitorManager.instance!._globalMonitorRegistry[_monitorId];
        }
        GlobalMonitorManager.waitForMonitorReply.resolve();
    }

    private OnDeltaZeroMessage(_monitorId: string) {
        logger.log("Delta Zero", _monitorId);
    }
    private async OnPositionMessageAsync(_monitorId: string, positionMessage: MonitorPositionMessage) {
        let monitor = await GlobalMonitorManager.instance!.MonitorModel.findById(_monitorId).exec();
        if (monitor) {
            monitor.lastKnownAssetBalance = positionMessage.payload;
            await monitor.save();
        }
    }

    private async OnNewTransactionMessageAsync(_monitorId: string, transaction: NewTransactionMessage) {
        logger.log("Transaction", _monitorId, transaction);
        try {
            let newTransaction = new GlobalMonitorManager.instance!.TransactionModel(transaction.payload);
            await newTransaction.save();
            let monitor = await GlobalMonitorManager.instance!.MonitorModel.findById(transaction.payload._monitor).exec()
            monitor?.transactions?.push(newTransaction._id);
            await monitor!.save();
        } catch (e) {
            logger.log(e);
        }
    }

    private async OnTradeLimitReachedErrorAsync(_monitorId: string, message: TradeLimitReachedErrorMessage) {
        logger.log("OnTradeLimitReachedErrorAsync", _monitorId, message);
        let newPendingOrder = new GlobalMonitorManager.instance!.PendingOrderModel(message.payload);
        await newPendingOrder.save()

        let monitor = await GlobalMonitorManager.instance!.MonitorModel.findById(_monitorId).exec();
        if (monitor) {
            monitor.status = MonitorStatus.HasPendingOrders;
            await monitor.save();
            delete GlobalMonitorManager.instance!._globalMonitorRegistry[_monitorId];
        }
    }

    private async OnBadConfigurationError(_monitorId: string, message: BadConfigurationErrorMessage) {
        let monitor = await GlobalMonitorManager.instance!.MonitorModel.findById(_monitorId).exec();
        if (monitor) {
            monitor.status = MonitorStatus.HasBadConfiguration;
            await monitor.save();
            delete GlobalMonitorManager.instance!._globalMonitorRegistry[_monitorId];
        }
    }

    private async OnUnExpectedErrorAsync(_monitorId: string, message: UnexpectedErrorMessage) {
        logger.log("OnUnExpectedErrorAsync", _monitorId, message);
        let monitor = await GlobalMonitorManager.instance!.MonitorModel.findById(_monitorId).exec();
        if (monitor) {
            monitor.status = MonitorStatus.Stopped;
            await monitor.save();
        }
        logger.log(`Monitor will attempt to restart in ${GlobalMonitorManager._healthcheckTimoutSeconds} seconds...`)
    }
    //#endregion
}




